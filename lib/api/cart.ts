import type {
  ApiCart,
  ApiCartItem,
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

async function enrichCartItems(cart: ApiCart): Promise<ApiCart> {
  const needsEnrichment = cart.cartItems!.some((i) => !i.variantName && i.variantId)
  if (!needsEnrichment) return cart

  try {
    const variants = await getProductVariants()
    const variantMap = new Map(variants.map((v) => [v.variantId, v]))
    const enrichedItems: ApiCartItem[] = cart.cartItems!.map((item) => {
      if (!item.variantName && item.variantId) {
        const v = variantMap.get(item.variantId)
        if (v) {
          return {
            ...item,
            variantName: v.variantName,
            productName: v.product?.productName ?? item.productName,
          }
        }
      }
      return item
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
