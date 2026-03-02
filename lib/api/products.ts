import type { ApiProduct, ApiProductsResponse, ApiProductDetailResponse } from '@/lib/types/api'
import type { Product } from '@/data/products'

const BACKEND_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

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
  const isServer = typeof window === 'undefined'
  let url = isServer
    ? `${BACKEND_URL}/api/Products?pageNumber=${pageNumber}&pageSize=${pageSize}`
    : `${getBase()}/api/products?pageNumber=${pageNumber}&pageSize=${pageSize}`
  if (categoryId) {
    url += `&categoryId=${categoryId}`
  }
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    ...(typeof window === 'undefined' && { next: { revalidate: 60 } }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải sản phẩm')
  }
  const json = (await res.json()) as ApiProductsResponse & { items?: ApiProduct[] }
  const data = json.data
  const items = (data?.items ?? json.items ?? []) as ApiProduct[]
  const mapped = items.map(mapApiProductToProduct)

  const rawData = data ?? json
  return {
    items: mapped,
    totalCount: rawData?.totalCount ?? data?.totalCount,
    pageNumber: rawData?.pageNumber ?? data?.pageNumber ?? pageNumber,
    pageSize: rawData?.pageSize ?? data?.pageSize ?? pageSize,
    totalPages: rawData?.totalPages ?? data?.totalPages,
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const isServer = typeof window === 'undefined'
  const base = isServer
    ? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    : getBase()
  const url = `${base}/api/products/${id}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: isServer ? 'no-store' : undefined,
  })
  if (!res.ok) {
    if (res.status === 404) {
      try {
        const list = await getProducts({ pageNumber: 1, pageSize: 100 })
        const found = list.items.find((p) => p.id === id)
        return found ?? null
      } catch {
        return null
      }
    }
    const err = (await res.json().catch(() => ({}))) as Record<string, unknown>
    console.warn('[getProductById]', res.status, id, err)
    return null
  }
  const json = (await res.json()) as ApiProductDetailResponse | ApiProduct | Record<string, unknown>
  const raw = json && typeof json === 'object'
  const wrapped = raw && ('data' in json || 'Data' in json)
  const data = wrapped
    ? ((json as { data?: ApiProduct; Data?: ApiProduct }).data ??
       (json as { data?: ApiProduct; Data?: ApiProduct }).Data)
    : null
  const direct =
    raw &&
    ('productId' in json || 'ProductId' in json) &&
    (json as ApiProduct)
  const apiProduct = (data ?? direct ?? null) as ApiProduct | null
  if (!apiProduct || !apiProduct.productId) return null
  return mapApiProductToProduct(apiProduct)
}
