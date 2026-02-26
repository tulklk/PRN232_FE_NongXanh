import type { ApiProduct, ApiProductsResponse, ApiProductDetailResponse } from '@/lib/types/api'
import type { Product } from '@/data/products'

const getBase = () =>
  typeof window !== 'undefined'
    ? ''
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

function mapApiProductToProduct(api: ApiProduct): Product {
  const primaryImage = api.productImages?.find((i) => i.isPrimary)
  const imageUrl =
    primaryImage?.imageUrl || api.productImages?.[0]?.imageUrl || '/images/logo.png'
  const images = api.productImages?.map((i) => i.imageUrl).filter(Boolean)

  return {
    id: String(api.productId),
    name: api.productName,
    seller: api.provider ?? 'Nông Xanh',
    image: imageUrl,
    images: images && images.length > 0 ? images : undefined,
    rating: api.rating ?? 0,
    reviewCount: api.reviewCount ?? 0,
    salesCount: api.salesCount ?? 0,
    currentPrice: api.basePrice,
    originalPrice: api.originalPrice ?? undefined,
    category: String(api.categoryId),
    description: api.description,
    specifications: api.origin ? { 'Xuất xứ': api.origin } : undefined,
  }
}

export interface GetProductsParams {
  pageNumber?: number
  pageSize?: number
  categoryId?: string
}

export interface GetProductsResult {
  items: Product[]
  totalCount?: number
  pageNumber?: number
  pageSize?: number
  totalPages?: number
}

export async function getProducts(params?: GetProductsParams): Promise<GetProductsResult> {
  const pageNumber = params?.pageNumber ?? 1
  const pageSize = params?.pageSize ?? 10
  const categoryId = params?.categoryId
  let url = `${getBase()}/api/products?pageNumber=${pageNumber}&pageSize=${pageSize}`
  if (categoryId) {
    url += `&categoryId=${categoryId}`
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải sản phẩm')
  }
  const json = (await res.json()) as ApiProductsResponse
  const data = json.data
  const items = (data?.items ?? []) as ApiProduct[]
  const mapped = items.map(mapApiProductToProduct)

  return {
    items: mapped,
    totalCount: data?.totalCount,
    pageNumber: data?.pageNumber ?? pageNumber,
    pageSize: data?.pageSize ?? pageSize,
    totalPages: data?.totalPages,
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const url = `${getBase()}/api/products/${id}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    if (res.status === 404) {
      // Fallback: backend may not have GET /Products/{id}, try list + filter
      const list = await getProducts({ pageNumber: 1, pageSize: 100 })
      const found = list.items.find((p) => p.id === id)
      return found ?? null
    }
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải chi tiết sản phẩm')
  }
  const json = (await res.json()) as ApiProductDetailResponse | ApiProduct
  const apiProduct =
    json && typeof json === 'object' && 'data' in json
      ? (json as ApiProductDetailResponse).data
      : (json as ApiProduct)
  if (!apiProduct || !apiProduct.productId) return null
  return mapApiProductToProduct(apiProduct)
}
