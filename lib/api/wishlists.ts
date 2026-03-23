import type { AddWishlistRequest, ApiWishlistItem, ApiWishlistListResponse } from '@/lib/types/api'
import { getProductById } from '@/lib/api/products'

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

function toNumberOrUndefined(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function normalizeWishlistItem(raw: Record<string, unknown>): ApiWishlistItem | null {
  const productId =
    raw.productId ??
    raw.ProductId ??
    (raw.product as Record<string, unknown> | undefined)?.productId ??
    (raw.product as Record<string, unknown> | undefined)?.ProductId

  if (productId == null || String(productId).trim() === '') return null

  const productObj = (raw.product as Record<string, unknown> | undefined) ?? undefined
  const imageFromProductImages = Array.isArray(productObj?.productImages)
    ? (productObj?.productImages as Array<Record<string, unknown>>).find((i) => i?.isPrimary)?.imageUrl ??
      (productObj?.productImages as Array<Record<string, unknown>>)[0]?.imageUrl
    : undefined

  return {
    wishlistId: (raw.wishlistId ?? raw.WishlistId ?? raw.id ?? raw.Id) as
      | number
      | string
      | undefined,
    userId: String(raw.userId ?? raw.UserId ?? '') || undefined,
    productId: String(productId),
    productName: String(
      raw.productName ??
        raw.ProductName ??
        productObj?.productName ??
        productObj?.ProductName ??
        ''
    ) || undefined,
    imageUrl: String(
      raw.imageUrl ??
        raw.ImageUrl ??
        imageFromProductImages ??
        productObj?.imageUrl ??
        ''
    ) || undefined,
    price: toNumberOrUndefined(raw.price ?? raw.Price ?? productObj?.basePrice),
    originalPrice: toNumberOrUndefined(
      raw.originalPrice ?? raw.OriginalPrice ?? productObj?.originalPrice
    ),
  }
}

function parseWishlistItems(json: unknown): ApiWishlistItem[] {
  const raw = json as ApiWishlistListResponse | ApiWishlistItem[] | Record<string, unknown>
  let arr: unknown[] = []

  if (Array.isArray(raw)) arr = raw
  else if (raw && typeof raw === 'object') {
    if (Array.isArray((raw as ApiWishlistListResponse).items)) {
      arr = (raw as ApiWishlistListResponse).items ?? []
    } else if (Array.isArray((raw as ApiWishlistListResponse).data)) {
      arr = (raw as ApiWishlistListResponse).data as ApiWishlistItem[]
    } else if (
      (raw as ApiWishlistListResponse).data &&
      typeof (raw as ApiWishlistListResponse).data === 'object' &&
      Array.isArray(((raw as ApiWishlistListResponse).data as { items?: ApiWishlistItem[] }).items)
    ) {
      arr = ((raw as ApiWishlistListResponse).data as { items?: ApiWishlistItem[] }).items ?? []
    }
  }

  const list: ApiWishlistItem[] = []
  arr.forEach((row) => {
    if (!row || typeof row !== 'object') return
    const normalized = normalizeWishlistItem(row as Record<string, unknown>)
    if (normalized) list.push(normalized)
  })
  return list
}

async function hydrateWishlistItems(items: ApiWishlistItem[]): Promise<ApiWishlistItem[]> {
  const hydrated = await Promise.all(
    items.map(async (item) => {
      const needsHydration =
        !item.productName || !item.imageUrl || item.price == null || Number.isNaN(item.price)
      if (!needsHydration) return item

      try {
        const product = await getProductById(String(item.productId))
        if (!product) return item
        return {
          ...item,
          productName: item.productName || product.name,
          imageUrl: item.imageUrl || product.image,
          price: item.price ?? product.currentPrice,
          originalPrice: item.originalPrice ?? product.originalPrice,
        }
      } catch {
        return item
      }
    })
  )
  return hydrated
}

export async function getMyWishlist(token: string): Promise<ApiWishlistItem[]> {
  const res = await fetch(`${getBase()}/api/wishlists/my`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải wishlist')
  }
  const json = await res.json()
  const parsed = parseWishlistItems(json)
  return hydrateWishlistItems(parsed)
}

export async function addWishlist(
  data: AddWishlistRequest,
  token: string
): Promise<void> {
  const res = await fetch(`${getBase()}/api/wishlists`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify({ productId: String(data.productId) }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể thêm yêu thích')
  }
}

export async function removeWishlist(productId: number | string, token: string): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/wishlists/${encodeURIComponent(String(productId))}`,
    {
      method: 'DELETE',
      headers: getHeaders(token),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể xóa yêu thích')
  }
}
