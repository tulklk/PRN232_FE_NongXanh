export interface CreateReviewRequest {
  rating: number
  comment: string
  userId: string
  productId: string
}

export interface ReviewDto {
  id?: string
  rating?: number
  comment?: string
  userId?: string
  productId?: string
  createdAt?: string
  [k: string]: unknown
}

/** Shape returned by GET /api/Reviews/product/{productId} (backend + proxy). */
export interface ProductReviewApiItem {
  reviewId?: string
  id?: string
  rating?: number
  comment?: string
  createdAt?: string
  userDisplayName?: string
  userId?: string
  productId?: string
  productName?: string
  status?: string
  [k: string]: unknown
}

/** Normalized model for `ReviewCard` and product detail stats. */
export interface ReviewCardModel {
  id: string
  userName: string
  rating: number
  comment: string
  date: string
}

function unwrapReviewsPayload(json: unknown): ProductReviewApiItem[] {
  if (Array.isArray(json)) return json as ProductReviewApiItem[]
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    const data = o.data
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      if (Array.isArray(d.items)) return d.items as ProductReviewApiItem[]
    }
    if (Array.isArray(o.items)) return o.items as ProductReviewApiItem[]
  }
  return []
}

export function mapApiReviewToCardModel(
  item: ProductReviewApiItem,
  index: number
): ReviewCardModel {
  const raw = Number(item.rating)
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0
  return {
    id: String(item.reviewId ?? item.id ?? `review-${index}`),
    userName: String(item.userDisplayName || 'Khách hàng'),
    rating,
    comment: String(item.comment ?? ''),
    date: String(item.createdAt ?? new Date().toISOString()),
  }
}

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

export async function createReview(
  data: CreateReviewRequest,
  token: string
): Promise<ReviewDto> {
  const res = await fetch(`${getBase()}/api/reviews`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) || (json.message as string) || 'Không thể gửi đánh giá'
    )
  }
  return json as ReviewDto
}

export async function getReviewsByProduct(
  productId: string,
  token?: string
): Promise<ProductReviewApiItem[]> {
  const res = await fetch(
    `${getBase()}/api/reviews/product/${encodeURIComponent(productId)}`,
    { headers: getHeaders(token), cache: 'no-store' }
  )
  const json = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    const err = json as { error?: string; message?: string }
    throw new Error(err.error || err.message || 'Không thể tải đánh giá sản phẩm')
  }
  return unwrapReviewsPayload(json)
}

