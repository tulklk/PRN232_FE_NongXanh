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
  const cart = (extracted ?? null) as ApiCart | null
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

async function enrichCartItems(cart: ApiCart): Promise<ApiCart> {
  if (!cart.cartItems?.length) return cart

  try {
    const [variants, productsMap] = await Promise.all([
      getProductVariants(),
      fetchProductsMap(),
    ])
    const variantMap = new Map(variants.map((v) => [String(v.variantId), v]))
    const productIdSet = new Set<string>()
    for (const item of cart.cartItems!) {
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
    const computedTotal =
      enrichedItems.reduce((sum, i) => sum + (i.subTotal ?? i.priceAtTime * i.quantity), 0)
    return {
      ...cart,
      cartItems: enrichedItems,
      totalAmount: cart.totalAmount > 0 ? cart.totalAmount : computedTotal,
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
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể thêm sản phẩm vào giỏ'
    )
  }
  const raw = (await res.json()) as ApiCart | { data?: ApiCart }
  const cart = (raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw) as ApiCart
  if (cart?.cartItems?.length) {
    return await enrichCartItems(cart)
  }
  return cart
}

export async function updateCartItem(
  cartItemId: number,
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
  cartItemId: number,
  token: string
): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/carts/items/${cartItemId}`,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  )
  if (!res.ok) {
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
