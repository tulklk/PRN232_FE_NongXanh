import type {
  ApiProduct,
  ApiProductsResponse,
  ApiProductDetailResponse,
} from '@/lib/types/api'
import type { Product } from '@/data/products'

const BACKEND_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

const getBase = () =>
  typeof window !== 'undefined'
    ? ''
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function getJsonHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed || trimmed.toLowerCase() === 'string') return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  return null
}

function mapApiProductToProduct(api: ApiProduct): Product {
  const primaryImage = api.productImages?.find((i) => i.isPrimary)
  const primaryUrl = normalizeImageUrl(primaryImage?.imageUrl)
  const fallbackUrl = normalizeImageUrl(api.productImages?.[0]?.imageUrl)
  const imageUrl = primaryUrl || fallbackUrl || '/images/logo.png'
  const images =
    api.productImages
      ?.map((i) => normalizeImageUrl(i.imageUrl))
      .filter((u): u is string => Boolean(u)) ?? []

  return {
    id: String(api.productId),
    name: api.productName,
    seller: api.provider ?? 'Nông Xanh',
    image: imageUrl,
    images: images.length > 0 ? images : undefined,
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
  const url = isServer
    ? `${BACKEND_URL}/api/Products/${id}`
    : `${getBase()}/api/products/${id}`
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

export async function searchProducts(
  keyword: string,
  limit = 10
): Promise<Product[]> {
  const trimmed = keyword.trim()
  if (!trimmed) return []

  try {
    const res = await getProducts({ pageNumber: 1, pageSize: 200 })
    const lower = trimmed.toLowerCase()

    const filtered = res.items.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(lower)
      const descMatch = p.description
        ? p.description.toLowerCase().includes(lower)
        : false
      return nameMatch || descMatch
    })

    return filtered.slice(0, limit)
  } catch (error) {
    console.warn('[searchProducts] error', error)
    return []
  }
}

export interface CreateProductInput {
  name: string
  description?: string | null
  origin?: string | null
  unit?: string | null
  basePrice: number
  isOrganic?: boolean
  status?: string | null
  categoryId?: string | null
  providerId?: string | null
  imageUrl?: string | null
  imageUrls?: string[] | null
}

export interface UpdateProductInput {
  name?: string
  description?: string | null
  origin?: string | null
  unit?: string | null
  basePrice?: number
  isOrganic?: boolean | null
  status?: string | null
  categoryId?: string | null
  providerId?: string | null
  imageUrl?: string | null
  imageUrls?: string[] | null
}

export async function getAdminProducts(
  pageNumber = 1,
  pageSize = 50,
  categoryId?: string,
  token?: string
): Promise<ApiProduct[]> {
  const search = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })
  if (categoryId) search.set('categoryId', categoryId)

  const res = await fetch(`${getBase()}/api/products?${search.toString()}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải sản phẩm')
  }

  const json = (await res.json()) as
    | ApiProductsResponse
    | (ApiProductsResponse & { items?: ApiProduct[] })
    | { items?: ApiProduct[] }
    | ApiProduct[]

  const anyJson = json as any
  const data = (anyJson?.data ?? anyJson) as
    | ApiProductsResponse['data']
    | { items?: ApiProduct[] }
    | ApiProduct[]
    | undefined

  if (Array.isArray((data as any)?.items)) {
    return ((data as any).items || []) as ApiProduct[]
  }
  if (Array.isArray((anyJson as any).items)) {
    return ((anyJson as any).items || []) as ApiProduct[]
  }
  if (Array.isArray(data)) return data as ApiProduct[]
  if (Array.isArray(json)) return json as ApiProduct[]

  return []
}

export async function createProduct(
  data: CreateProductInput,
  token?: string
): Promise<ApiProduct> {
  let images: { imageUrl: string; isPrimary: boolean }[] | undefined
  if (data.imageUrls && data.imageUrls.length > 0) {
    images = data.imageUrls.map((url, index) => ({
      imageUrl: url,
      isPrimary: index === 0,
    }))
  } else if (data.imageUrl) {
    images = [
      {
        imageUrl: data.imageUrl,
        isPrimary: true,
      },
    ]
  }

  const body = {
    name: data.name,
    description: data.description ?? null,
    origin: data.origin ?? null,
    unit: data.unit ?? null,
    basePrice: data.basePrice,
    isOrganic: data.isOrganic ?? false,
    status: data.status ?? null,
    categoryId: data.categoryId ?? null,
    providerId: data.providerId ?? null,
    ...(images ? { images } : {}),
  }

  const res = await fetch(`${getBase()}/api/products`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText,
      message: res.statusText,
    }))
    throw new Error(
      (err as { message?: string }).message ||
        (err as { error?: string }).error ||
        'Không thể tạo sản phẩm'
    )
  }

  const json = (await res.json()) as { data?: ApiProduct } | ApiProduct
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data?: ApiProduct }).data as ApiProduct
  }
  return json as ApiProduct
}

export async function updateProduct(
  id: string,
  data: UpdateProductInput,
  token?: string
): Promise<ApiProduct> {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.description !== undefined) body.description = data.description
  if (data.origin !== undefined) body.origin = data.origin
  if (data.unit !== undefined) body.unit = data.unit
  if (data.basePrice !== undefined) body.basePrice = data.basePrice
  if (data.isOrganic !== undefined) body.isOrganic = data.isOrganic
  if (data.status !== undefined) body.status = data.status
  if (data.categoryId !== undefined) body.categoryId = data.categoryId
  if (data.providerId !== undefined) body.providerId = data.providerId

  // Cập nhật danh sách ảnh khi có thay đổi
  if (data.imageUrls !== undefined) {
    ;(body as any).images =
      data.imageUrls && data.imageUrls.length > 0
        ? data.imageUrls.map((url, index) => ({
            imageUrl: url,
            isPrimary: index === 0,
          }))
        : []
  } else if (data.imageUrl !== undefined) {
    ;(body as any).images = data.imageUrl
      ? [
          {
            imageUrl: data.imageUrl,
            isPrimary: true,
          },
        ]
      : []
  }

  const res = await fetch(`${getBase()}/api/products/${id}`, {
    method: 'PUT',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText,
      message: res.statusText,
    }))
    throw new Error(
      (err as { message?: string }).message ||
        (err as { error?: string }).error ||
        'Không thể cập nhật sản phẩm'
    )
  }

  const json = (await res.json()) as { data?: ApiProduct } | ApiProduct
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data?: ApiProduct }).data as ApiProduct
  }
  return json as ApiProduct
}

export async function deleteProduct(id: string, token?: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText,
      message: res.statusText,
    }))
    throw new Error(
      (err as { message?: string }).message ||
        (err as { error?: string }).error ||
        'Không thể xóa sản phẩm'
    )
  }
}
