import type {
  ApiOrder,
  ApiOrdersPagedResponse,
  CheckoutOrderRequest,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  CreateOrderRequest,
  ShipmentInfo,
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

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function getOrders(
  pageNumber = 1,
  pageSize = 10,
  token?: string
): Promise<ApiOrdersPagedResponse> {
  const url = `${getBase()}/api/orders?pageNumber=${pageNumber}&pageSize=${pageSize}`
  let res: Response
  try {
    res = await fetchWithTimeout(url, { headers: getHeaders(token) }, 10000)
  } catch {
    // Retry nhẹ một lần để giảm ảnh hưởng mạng/cold start
    res = await fetchWithTimeout(url, { headers: getHeaders(token) }, 12000)
  }
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
  const res = await fetchWithTimeout(
    `${getBase()}/api/orders/${id}`,
    { headers: getHeaders(token) },
    10000
  )
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

export async function syncOrderShipment(
  orderId: number | string,
  token: string
): Promise<void> {
  const res = await fetch(`${getBase()}/api/orders/${orderId}/shipment/sync`, {
    method: 'POST',
    headers: getJsonHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể đồng bộ giao hàng nhanh'
    )
  }
}

export interface UpdateOrderStatusInput {
  status: string
  shippingAddress?: string | null
  vnPayStatus?: string | null
}

export async function updateOrderStatus(
  orderId: number | string,
  data: UpdateOrderStatusInput,
  token: string
): Promise<ApiOrder> {
  const res = await fetch(`${getBase()}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể cập nhật trạng thái đơn hàng'
    )
  }

  const json = (await res.json()) as { data?: ApiOrder } & ApiOrder
  return (json?.data ?? json) as ApiOrder
}

export async function previewCheckout(
  data: CheckoutPreviewRequest,
  token: string
): Promise<CheckoutPreviewResponse> {
  const res = await fetch(`${getBase()}/api/orders/checkout/preview`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể xem trước checkout'
    )
  }

  const json = (await res.json()) as
    | { data?: CheckoutPreviewResponse }
    | CheckoutPreviewResponse
  return (json as { data?: CheckoutPreviewResponse }).data ?? (json as CheckoutPreviewResponse)
}

export async function checkoutOrder(
  data: CheckoutOrderRequest,
  token: string
): Promise<ApiOrder> {
  const res = await fetch(`${getBase()}/api/orders/checkout`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể checkout đơn hàng'
    )
  }

  const json = (await res.json()) as { data?: ApiOrder } & ApiOrder
  return (json?.data ?? json) as ApiOrder
}

export async function getOrderShipment(
  orderId: number | string,
  token: string
): Promise<ShipmentInfo> {
  const res = await fetch(`${getBase()}/api/orders/${orderId}/shipment`, {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể lấy thông tin vận chuyển'
    )
  }

  const json = (await res.json()) as { data?: ShipmentInfo } | ShipmentInfo
  return (json as { data?: ShipmentInfo }).data ?? (json as ShipmentInfo)
}

export async function syncAllShipments(token: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/orders/shipments/sync-all`, {
    method: 'POST',
    headers: getJsonHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể đồng bộ tất cả vận đơn'
    )
  }
}
