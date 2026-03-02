import type {
  ApiOrder,
  ApiOrdersPagedResponse,
  CreateOrderRequest,
} from '@/lib/types/api'

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

export async function getOrders(
  pageNumber = 1,
  pageSize = 10,
  token?: string
): Promise<ApiOrdersPagedResponse> {
  const res = await fetch(
    `${getBase()}/api/orders?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    { headers: getHeaders(token) }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải danh sách đơn hàng'
    )
  }
  const json = (await res.json()) as { data?: ApiOrdersPagedResponse } & ApiOrdersPagedResponse
  const data = json?.data ?? json
  const items = (data?.items ?? json?.items ?? []) as ApiOrder[]
  return {
    items,
    totalCount: data?.totalCount ?? items.length,
    pageNumber: data?.pageNumber ?? pageNumber,
    pageSize: data?.pageSize ?? pageSize,
    totalPages: data?.totalPages,
  }
}

export async function getOrderById(
  id: number | string,
  token?: string
): Promise<ApiOrder | null> {
  const res = await fetch(`${getBase()}/api/orders/${id}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    if (res.status === 404) return null
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải đơn hàng'
    )
  }
  const json = (await res.json()) as { data?: ApiOrder } & ApiOrder
  const order = (json?.data ?? json) as ApiOrder
  return order
}

export async function createOrder(
  data: CreateOrderRequest,
  token: string
): Promise<ApiOrder> {
  const res = await fetch(`${getBase()}/api/orders`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tạo đơn hàng'
    )
  }
  const json = (await res.json()) as { data?: ApiOrder } & ApiOrder
  const order = (json?.data ?? json) as ApiOrder
  return order
}
