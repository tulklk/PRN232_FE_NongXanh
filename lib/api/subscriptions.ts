import type { CreateSubscriptionRequest, SubscriptionModel } from '@/lib/types/api'

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

type SubscriptionCreateResponse =
  | { success?: boolean; data?: SubscriptionModel; message?: string }
  | SubscriptionModel
  | { data?: SubscriptionModel }

type SubscriptionListResponse =
  | { success?: boolean; data?: SubscriptionModel[]; message?: string }
  | SubscriptionModel[]
  | { items?: SubscriptionModel[]; data?: { items?: SubscriptionModel[] } }
  | { data?: SubscriptionModel[] }

export async function createSubscription(
  data: CreateSubscriptionRequest,
  token: string
): Promise<SubscriptionModel> {
  const res = await fetch(`${getBase()}/api/subscriptions`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể tạo subscription'
    )
  }

  const payload = json as unknown as SubscriptionCreateResponse
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const d = (payload as { data?: SubscriptionModel }).data
    if (d) return d
  }
  return payload as SubscriptionModel
}

export async function getMySubscriptions(token: string): Promise<SubscriptionModel[]> {
  const res = await fetch(`${getBase()}/api/subscriptions`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể tải subscriptions'
    )
  }

  const payload = json as unknown as SubscriptionListResponse
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const p = payload as { data?: SubscriptionModel[] }
    if (Array.isArray(p.data)) return p.data
    const p2 = payload as { items?: SubscriptionModel[]; data?: { items?: SubscriptionModel[] } }
    if (Array.isArray(p2.items)) return p2.items
    if (p2.data && Array.isArray(p2.data.items)) return p2.data.items
  }
  return []
}

