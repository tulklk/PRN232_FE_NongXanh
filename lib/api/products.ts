import type {
  ApiProduct,
  ApiProductsResponse,
  ApiProductDetailResponse,
} from '@/lib/types/api'
import type { ApiProductVariant } from '@/lib/types/api'
import type { Product } from '@/data/products'

const BACKEND_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

const getBase = () =>
  typeof window !== 'undefined'
    ? ''
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

const soldQuantityCache = new Map<string, number>()
const soldQuantityPromiseCache = new Map<string, Promise<number>>()

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

function pickProviderIdFromApi(api: ApiProduct): string | undefined {
  const extended = api as ApiProduct & { ProviderId?: number | string }
  const raw = api.providerId ?? extended.ProviderId
  if (raw === undefined || raw === null) return undefined
  const s = String(raw).trim()
  return s || undefined
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
  const providerId = pickProviderIdFromApi(api)

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
    ...(providerId ? { providerId } : {}),
  }
}

export interface GetProductsParams {
  pageNumber?: number
  pageSize?: number
  categoryId?: string
  /** Lọc theo nhà cung cấp (BE có thể hỗ trợ providerId / provider) */
  providerId?: string
  /**
   * Bỏ qua gọi API sold-quantity cho từng SP (rất chậm khi pageSize lớn).
   * Dùng cho tìm kiếm / autocomplete — không cần salesCount chính xác.
   */
  skipSoldQuantityHydration?: boolean
}

export interface GetProductsResult {
  items: Product[]
  totalCount?: number
  pageNumber?: number
  pageSize?: number
  totalPages?: number
}

export interface GetBestSellersParams {
  top?: number
  lastDays?: number
}

export type ProductLookupItem = {
  productId: string
  productName: string
}

export async function lookupProducts(
  query: string,
  limit = 20,
  token?: string
): Promise<ProductLookupItem[]> {
  const q = String(query ?? '').trim()
  if (!q) return []
  const search = new URLSearchParams({ query: q, limit: String(limit) })
  const res = await fetch(`${getBase()}/api/products/lookup?${search.toString()}`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const err = (json ?? {}) as { error?: string; message?: string }
    throw new Error(err.error || err.message || 'Không thể tìm kiếm sản phẩm')
  }
  const unwrapList = (raw: unknown): unknown[] => {
    if (Array.isArray(raw)) return raw
    if (!raw || typeof raw !== 'object') return []
    const o = raw as any
    const candidates = [
      o.data,
      o.items,
      o.result,
      o.value,
      o.Data,
      o.Items,
      o.Result,
      o.Value,
    ]
    for (const c of candidates) {
      if (Array.isArray(c)) return c
      if (c && typeof c === 'object') {
        const cc = (c as any).items ?? (c as any).Items ?? (c as any).data ?? (c as any).Data
        if (Array.isArray(cc)) return cc
      }
    }
    return []
  }
  const list = unwrapList(json)
  return list
    .map((x: any) => ({
      productId: String(x?.productId ?? x?.id ?? '').trim(),
      productName: String(x?.productName ?? x?.name ?? '').trim(),
    }))
    .filter((x) => x.productId && x.productName)
}

export async function getVariantsByProductId(
  productId: string,
  token?: string
): Promise<ApiProductVariant[]> {
  const pid = String(productId ?? '').trim()
  if (!pid) return []
  const res = await fetch(`${getBase()}/api/products/${encodeURIComponent(pid)}/variants`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const err = (json ?? {}) as { error?: string; message?: string }
    throw new Error(err.error || err.message || 'Không thể tải danh sách biến thể')
  }
  // BE returns a plain array per contract; keep compatibility with wrapped payloads too.
  const list = Array.isArray(json)
    ? (json as any[])
    : (json && typeof json === 'object' && Array.isArray((json as any).data)
        ? (json as any).data
        : [])
  return list.map((row: any) => ({
    variantId: row.variantId ?? row.VariantId ?? row.id ?? row.Id,
    variantName: String(row.variantName ?? row.VariantName ?? ''),
    price: Number(row.price ?? 0),
    discountPrice: row.discountPrice ?? row.DiscountPrice ?? null,
    stockQuantity: Number(row.stockQuantity ?? row.StockQuantity ?? 0),
    sku: row.sku ?? row.Sku ?? null,
    status: row.status ?? row.Status ?? null,
    productId: row.productId ?? row.ProductId ?? pid,
  })) as unknown as ApiProductVariant[]
}

type BestSellerDto = {
  productId?: number | string
  productName?: string | null
  imageUrl?: string | null
  unit?: string | null
  soldQuantity?: number
}

function normalizeBestSellerItem(raw: unknown): BestSellerDto | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as any
  const productId = row.productId ?? row.ProductId ?? row.id ?? row.Id
  if (productId == null) return null
  const soldQuantity = Number(row.soldQuantity ?? row.SoldQuantity ?? row.salesCount ?? row.SalesCount ?? 0)
  return {
    productId,
    productName: row.productName ?? row.ProductName ?? null,
    imageUrl: row.imageUrl ?? row.ImageUrl ?? null,
    unit: row.unit ?? row.Unit ?? null,
    soldQuantity: Number.isFinite(soldQuantity) ? Math.trunc(soldQuantity) : 0,
  }
}

function parseBestSellersPayload(raw: unknown): BestSellerDto[] {
  if (Array.isArray(raw)) return raw.map(normalizeBestSellerItem).filter(Boolean) as BestSellerDto[]
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as any
  const data = obj.data ?? obj.Data ?? obj.items ?? obj.Items ?? obj
  if (Array.isArray(data)) return data.map(normalizeBestSellerItem).filter(Boolean) as BestSellerDto[]
  if (data && typeof data === 'object') {
    const items = (data as any).items ?? (data as any).Items
    if (Array.isArray(items)) return items.map(normalizeBestSellerItem).filter(Boolean) as BestSellerDto[]
  }
  return []
}

export async function getBestSellerProducts(
  params?: GetBestSellersParams
): Promise<Product[]> {
  const top = params?.top ?? 10
  const lastDays = params?.lastDays
  const isServer = typeof window === 'undefined'
  const qs = new URLSearchParams({ top: String(top) })
  if (lastDays != null) qs.set('lastDays', String(lastDays))

  const url = isServer
    ? `${BACKEND_URL}/api/Products/best-sellers?${qs.toString()}`
    : `${getBase()}/api/products/best-sellers?${qs.toString()}`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: isServer ? 'no-store' : 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string; message?: string }).error ||
        (err as { error?: string; message?: string }).message ||
        'Không thể tải sản phẩm bán chạy nhất'
    )
  }
  const json = await res.json().catch(() => ({}))
  const list = parseBestSellersPayload(json)
  if (list.length === 0) return []

  const ids = list.map((x) => String(x.productId))
  const soldById = new Map<string, number>()
  list.forEach((x) => {
    const id = String(x.productId)
    soldById.set(id, Math.max(0, Number(x.soldQuantity ?? 0) || 0))
  })

  // The best-sellers endpoint returns a lightweight DTO.
  // Hydrate full product details for UI cards.
  const CHUNK_SIZE = 8
  const results: Array<Product | null> = []
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE)
    const chunkResults = await Promise.all(
      chunk.map(async (id) => {
        try {
          return await getProductById(id)
        } catch {
          return null
        }
      })
    )
    results.push(...chunkResults)
  }

  const byId = new Map<string, Product>()
  results.forEach((p) => {
    if (p) byId.set(String(p.id), p)
  })

  // Keep BE ranking order and set salesCount from soldQuantity.
  return ids
    .map((id) => {
      const p = byId.get(id)
      if (!p) return null
      const sold = soldById.get(id)
      return sold != null ? { ...p, salesCount: sold } : p
    })
    .filter((p): p is Product => Boolean(p))
}

function normalizeSoldQuantityJson(json: unknown): number {
  if (typeof json === 'number' && Number.isFinite(json)) return Math.trunc(json)
  if (!json || typeof json !== 'object' || Array.isArray(json)) return 0

  const o = json as Record<string, unknown>

  // Common wrapper patterns: { data: number|object } or { data: { soldQuantity } }
  const wrapped = o.data ?? o.Data ?? o.value ?? o.Value
  if (wrapped !== undefined) return normalizeSoldQuantityJson(wrapped)

  const candidates = [
    o.soldQuantity,
    o.SoldQuantity,
    o.salesCount,
    o.SalesCount,
    o.quantity,
    o.Quantity,
    o.count,
    o.Count,
  ]

  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return Math.trunc(c)
    if (typeof c === 'string') {
      const n = Number(c)
      if (Number.isFinite(n)) return Math.trunc(n)
    }
  }

  return 0
}

export async function getSoldQuantity(
  productId: string,
  token?: string
): Promise<number> {
  const id = String(productId)
  const cached = soldQuantityCache.get(id)
  if (cached !== undefined) return cached

  const inFlight = soldQuantityPromiseCache.get(id)
  if (inFlight) return inFlight

  const p = (async () => {
    const isServer = typeof window === 'undefined'
    const url = isServer
      ? `${BACKEND_URL}/api/Products/${id}/sold-quantity`
      : `${getBase()}/api/products/${id}/sold-quantity`

    const res = await fetch(url, {
      headers: getHeaders(token),
      cache: isServer ? 'no-store' : undefined,
    })

    if (!res.ok) {
      throw new Error('Không thể lấy số lượng đã bán')
    }

    const json = await res.json().catch(() => ({}))
    const q = normalizeSoldQuantityJson(json)
    soldQuantityCache.set(id, q)
    return q
  })()

  soldQuantityPromiseCache.set(id, p)
  try {
    return await p
  } finally {
    soldQuantityPromiseCache.delete(id)
  }
}

async function hydrateSoldQuantitiesForProducts(
  products: Product[],
  token?: string
): Promise<Product[]> {
  const targets = products.filter((p) => (p.salesCount ?? 0) <= 0).map((p) => p.id)
  if (targets.length === 0) return products

  const uniqueIds = Array.from(new Set(targets.map(String)))

  // Concurrency limit to avoid blasting the API.
  const CHUNK_SIZE = 10
  const idToQty = new Map<string, number>()

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + CHUNK_SIZE)
    const results = await Promise.all(
      chunk.map(async (id) => {
        try {
          return await getSoldQuantity(id, token)
        } catch {
          return 0
        }
      })
    )
    results.forEach((qty, idx) => {
      idToQty.set(chunk[idx], qty)
    })
  }

  return products.map((p) => {
    const q = idToQty.get(String(p.id))
    if (q === undefined) return p
    return { ...p, salesCount: q }
  })
}

export async function getProducts(params?: GetProductsParams): Promise<GetProductsResult> {
  const pageNumber = params?.pageNumber ?? 1
  const pageSize = params?.pageSize ?? 10
  const categoryId = params?.categoryId
  const providerId = params?.providerId?.trim()
  const isServer = typeof window === 'undefined'
  const search = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  })
  if (categoryId) {
    search.set('categoryId', categoryId)
  }
  if (providerId) {
    search.set('providerId', providerId)
    search.set('provider', providerId)
  }
  const url = isServer
    ? `${BACKEND_URL}/api/Products?${search.toString()}`
    : `${getBase()}/api/products?${search.toString()}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    ...(typeof window === 'undefined' && { next: { revalidate: 60 } }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string
      message?: string
    }
    const msg =
      err.message ||
      err.error ||
      (res.status === 404 ? 'Danh mục không tồn tại' : 'Không thể tải sản phẩm')
    throw new Error(msg)
  }
  const json = (await res.json()) as ApiProductsResponse & { items?: ApiProduct[] }
  const data = json.data
  const items = (data?.items ?? json.items ?? []) as ApiProduct[]
  const mapped = items.map(mapApiProductToProduct)

  const rawData = data ?? json
  const skipHydrate = params?.skipSoldQuantityHydration === true
  const hydrated = skipHydrate ? mapped : await hydrateSoldQuantitiesForProducts(mapped)
  return {
    items: hydrated,
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
  const product = mapApiProductToProduct(apiProduct)

  if ((product.salesCount ?? 0) <= 0) {
    try {
      const sold = await getSoldQuantity(product.id)
      return { ...product, salesCount: sold }
    } catch {
      return product
    }
  }

  return product
}

const SEARCH_CATALOG_TTL_MS = 10 * 60 * 1000
let searchCatalogCache: Product[] | null = null
let searchCatalogLoadedAt = 0
let searchCatalogPromise: Promise<Product[]> | null = null

/** Tải catalog một lần (nhẹ, không hydrate sold-quantity), có TTL. */
async function loadSearchCatalog(): Promise<Product[]> {
  const now = Date.now()
  if (searchCatalogCache && now - searchCatalogLoadedAt < SEARCH_CATALOG_TTL_MS) {
    return searchCatalogCache
  }
  if (searchCatalogPromise) return searchCatalogPromise

  searchCatalogPromise = (async () => {
    const merged: Product[] = []
    let page = 1
    const pageSize = 100

    for (let safety = 0; safety < 20; safety++) {
      const res = await getProducts({
        pageNumber: page,
        pageSize,
        skipSoldQuantityHydration: true,
      })
      merged.push(...res.items)
      const doneByShortPage = res.items.length < pageSize
      const doneByTotal =
        res.totalCount != null && merged.length >= res.totalCount
      if (doneByShortPage || doneByTotal) break
      page += 1
    }

    searchCatalogCache = merged
    searchCatalogLoadedAt = Date.now()
    searchCatalogPromise = null
    return merged
  })()

  return searchCatalogPromise
}

/**
 * Gọi sớm (vd. mount trang tạo công thức) để lần gõ đầu không phải chờ fetch.
 */
export function prefetchProductSearchCatalog(): void {
  void loadSearchCatalog()
}

export async function searchProducts(
  keyword: string,
  limit = 10
): Promise<Product[]> {
  const trimmed = keyword.trim()
  if (!trimmed) return []

  try {
    const items = await loadSearchCatalog()
    const lower = trimmed.toLowerCase()

    const filtered = items.filter((p) => {
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
