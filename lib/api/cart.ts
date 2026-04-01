import type {
  ApiCart,
  ApiCartItem,
  ApiProduct,
  AddCartItemRequest,
  UpdateCartItemRequest,
} from '@/lib/types/api'
import { getProductVariants } from './productVariants'

const getBase = () =>
  typeof window !== 'undefined'
    ? ''
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

const CACHE_TTL_MS = 10 * 60 * 1000
let variantsCache:
  | { loadedAt: number; items: Awaited<ReturnType<typeof getProductVariants>> }
  | null = null
let variantsPromise: Promise<Awaited<ReturnType<typeof getProductVariants>>> | null =
  null

let productsMapCache: { loadedAt: number; map: Map<string, ApiProduct> } | null =
  null
let productsMapPromise: Promise<Map<string, ApiProduct>> | null = null

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function getJsonHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function pickValueCI(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (k in obj) return obj[k]
  }
  const lower = new Map<string, string>()
  for (const k of Object.keys(obj)) lower.set(k.toLowerCase(), k)
  for (const k of keys) {
    const hit = lower.get(k.toLowerCase())
    if (hit) return obj[hit]
  }
  return undefined
}

function normalizeComboItems(value: unknown): ApiCartItem['comboItems'] {
  if (!Array.isArray(value)) return null
  return value
    .map((raw) => {
      if (!isRecord(raw)) return null
      const productId = String(pickValueCI(raw, ['productId', 'ProductId']) ?? '').trim()
      if (!productId) return null
      const productName = pickValueCI(raw, ['productName', 'ProductName']) as
        | string
        | null
        | undefined
      const variantId = pickValueCI(raw, ['variantId', 'VariantId']) as
        | string
        | null
        | undefined
      const variantName = pickValueCI(raw, ['variantName', 'VariantName']) as
        | string
        | null
        | undefined
      const quantity = Number(pickValueCI(raw, ['quantity', 'Quantity']) ?? 0)
      const unit = pickValueCI(raw, ['unit', 'Unit']) as string | null | undefined
      const unitPrice = Number(pickValueCI(raw, ['unitPrice', 'UnitPrice']) ?? 0)
      const lineTotal = Number(pickValueCI(raw, ['lineTotal', 'LineTotal']) ?? 0)
      const imageUrl = pickValueCI(raw, ['imageUrl', 'ImageUrl']) as
        | string
        | null
        | undefined
      const origin = pickValueCI(raw, ['origin', 'Origin']) as string | null | undefined
      return {
        productId,
        productName: productName ?? null,
        variantId: variantId != null ? String(variantId) : null,
        variantName: variantName ?? null,
        quantity: Number.isFinite(quantity) ? Math.trunc(quantity) : 0,
        unit: unit ?? null,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
        lineTotal: Number.isFinite(lineTotal) ? lineTotal : 0,
        imageUrl: imageUrl ?? null,
        origin: origin ?? null,
      }
    })
    .filter(Boolean) as NonNullable<ApiCartItem['comboItems']>
}

function normalizeCart(cart: ApiCart | null): ApiCart | null {
  if (!cart || !Array.isArray(cart.cartItems)) return cart
  const items = cart.cartItems.map((it) => {
    const raw = it as unknown as Record<string, unknown>
    const comboItemsRaw = raw.comboItems ?? raw.ComboItems
    const comboItems = normalizeComboItems(comboItemsRaw)
    if (!comboItems) return it
    return { ...it, comboItems }
  })
  return { ...cart, cartItems: items }
}

export async function getCart(token: string): Promise<ApiCart | null> {
  const res = await fetch(`${getBase()}/api/carts`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    if (res.status === 404) return null
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải giỏ hàng'
    )
  }
  const raw = (await res.json()) as ApiCart | { data?: ApiCart }
  const extracted =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as { data?: ApiCart }).data
      : (raw as ApiCart)
  const cart = normalizeCart((extracted ?? null) as ApiCart | null)
  if (cart?.cartItems?.length) {
    return await enrichCartItems(cart)
  }
  return cart
}

function getProductImageUrl(product: { productImages?: Array<{ imageUrl?: string; isPrimary?: boolean }> } | null | undefined): string | null {
  if (!product?.productImages?.length) return null
  const primary = product.productImages.find((i) => i.isPrimary)
  return primary?.imageUrl || product.productImages[0]?.imageUrl || null
}

async function fetchProductById(productId: string): Promise<ApiProduct | null> {
  try {
    const res = await fetch(`${getBase()}/api/products/${productId}`)
    if (!res.ok) return null
    const raw = (await res.json()) as ApiProduct | { data?: ApiProduct }
    const p = (raw && typeof raw === 'object' && 'data' in raw ? (raw as { data?: ApiProduct }).data : raw) as ApiProduct
    return p?.productId != null ? p : null
  } catch {
    return null
  }
}

async function fetchProductsMap(): Promise<Map<string, ApiProduct>> {
  const base = getBase()
  const res = await fetch(`${base}/api/products?pageNumber=1&pageSize=200`)
  if (!res.ok) return new Map()
  const raw = (await res.json()) as Record<string, unknown>
  let list: ApiProduct[] = []
  const items = (raw?.items ?? (raw?.data as Record<string, unknown>)?.items ?? (Array.isArray(raw?.data) ? raw.data : null)) as unknown
  if (Array.isArray(items)) list = items
  const map = new Map<string, ApiProduct>()
  for (const p of list) {
    if (p?.productId != null) map.set(String(p.productId), p)
  }
  return map
}

async function getCachedVariants(): Promise<Awaited<ReturnType<typeof getProductVariants>>> {
  const now = Date.now()
  if (variantsCache && now - variantsCache.loadedAt < CACHE_TTL_MS) {
    return variantsCache.items
  }
  if (variantsPromise) return variantsPromise

  variantsPromise = (async () => {
    const items = await getProductVariants()
    variantsCache = { loadedAt: Date.now(), items }
    variantsPromise = null
    return items
  })().catch((e) => {
    variantsPromise = null
    throw e
  })

  return variantsPromise
}

async function getCachedProductsMap(): Promise<Map<string, ApiProduct>> {
  const now = Date.now()
  if (productsMapCache && now - productsMapCache.loadedAt < CACHE_TTL_MS) {
    return productsMapCache.map
  }
  if (productsMapPromise) return productsMapPromise

  productsMapPromise = (async () => {
    const map = await fetchProductsMap()
    productsMapCache = { loadedAt: Date.now(), map }
    productsMapPromise = null
    return map
  })().catch((e) => {
    productsMapPromise = null
    throw e
  })

  return productsMapPromise
}

async function enrichCartItems(cart: ApiCart): Promise<ApiCart> {
  if (!cart.cartItems?.length) return cart

  try {
    const [variants, productsMap] = await Promise.all([
      getCachedVariants(),
      getCachedProductsMap(),
    ])
    const variantMap = new Map(variants.map((v) => [String(v.variantId), v]))
    const productIdSet = new Set<string>()
    for (const item of cart.cartItems!) {
      if (item.mealComboId) continue
      if (item.variantId == null) continue
      const v = variantMap.get(String(item.variantId))
      if (v?.productId != null) productIdSet.add(String(v.productId))
    }
    const missingIds = Array.from(productIdSet).filter((id) => !productsMap.has(id))
    if (missingIds.length > 0) {
      const extras = await Promise.all(missingIds.map((id) => fetchProductById(id)))
      extras.forEach((p) => {
        if (p?.productId != null) productsMap.set(String(p.productId), p)
      })
    }
    const enrichedItems: ApiCartItem[] = cart.cartItems!.map((item) => {
      if (item.mealComboId) {
        return item
      }
      if (item.variantId == null) {
        return item
      }
      const key = String(item.variantId)
      const v = variantMap.get(key)
      const productId = v?.productId != null ? String(v.productId) : null
      const product = v?.product ?? (productId ? productsMap.get(productId) : null)
      const productName = product?.productName ?? v?.product?.productName ?? item.productName
      const variantName = v?.variantName ?? item.variantName
      const imageUrl = getProductImageUrl(product ?? v?.product) ?? item.imageUrl
      return {
        ...item,
        variantName,
        productName: productName || item.productName,
        imageUrl: imageUrl || item.imageUrl,
      }
    })
    const computedTotal = enrichedItems.reduce((sum, i) => {
      const sub = Number(i.subTotal)
      if (Number.isFinite(sub) && sub >= 0) return sum + sub
      const unit = Number(i.priceAtTime)
      const qty = Number(i.quantity)
      return sum + (Number.isFinite(unit) && Number.isFinite(qty) ? unit * qty : 0)
    }, 0)

    const backendTotal = Number(cart.totalAmount)
    const shouldTrustBackendTotal =
      Number.isFinite(backendTotal) &&
      backendTotal >= 0 &&
      // chỉ tin backend khi tổng khớp (tránh case BE trả sai chỉ 1 item)
      Math.abs(backendTotal - computedTotal) < 1
    return {
      ...cart,
      cartItems: enrichedItems,
      totalAmount: shouldTrustBackendTotal ? backendTotal : computedTotal,
    }
  } catch {
    return cart
  }
}

export async function addCartItem(
  data: AddCartItemRequest,
  token: string
): Promise<ApiCart> {
  const res = await fetch(`${getBase()}/api/carts/items`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errBody = await res
      .json()
      .catch(() => ({ error: res.statusText })) as { error?: string; message?: string }
    const message =
      errBody.error || errBody.message || 'Không thể thêm sản phẩm vào giỏ'
    const error = new Error(message) as Error & { status?: number }
    error.status = res.status
    throw error
  }
  const raw = (await res.json()) as ApiCart | { data?: ApiCart }
  const cart = (raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw) as ApiCart
  if (cart?.cartItems?.length) {
    return await enrichCartItems(cart)
  }
  return cart
}

export async function updateCartItem(
  cartItemId: number | string,
  quantity: number,
  token: string
): Promise<ApiCart> {
  const res = await fetch(`${getBase()}/api/carts/items`, {
    method: 'PUT',
    headers: getJsonHeaders(token),
    body: JSON.stringify({ cartItemId, quantity } satisfies UpdateCartItemRequest),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể cập nhật giỏ hàng'
    )
  }
  const raw = (await res.json()) as ApiCart | { data?: ApiCart }
  const cart = (raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw) as ApiCart
  if (cart?.cartItems?.length) {
    return await enrichCartItems(cart)
  }
  return cart
}

export async function removeCartItem(
  cartItemId: number | string,
  token: string
): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/carts/items/${encodeURIComponent(String(cartItemId))}`,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  )
  if (!res.ok) {
    // Idempotent delete: item đã bị xóa trước đó.
    if (res.status === 404) return
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể xóa sản phẩm khỏi giỏ'
    )
  }
}

export async function clearCart(token: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/carts/clear`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể xóa giỏ hàng'
    )
  }
}
