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

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function unwrapOrderPayload(json: unknown): Record<string, unknown> {
  let cur: unknown = json
  for (let depth = 0; depth < 5; depth++) {
    if (!isNonEmptyObject(cur)) break
    const o = cur as Record<string, unknown>

    const hasOrderLikeId =
      'orderId' in o ||
      'OrderId' in o ||
      'id' in o ||
      'Id' in o ||
      'order_id' in o
    if (hasOrderLikeId) return o

    if (isNonEmptyObject(o.data)) {
      cur = o.data
      continue
    }
    if (isNonEmptyObject(o.order)) {
      cur = o.order
      continue
    }
    if (isNonEmptyObject(o.item)) {
      cur = o.item
      continue
    }
    if (isNonEmptyObject(o.value)) {
      cur = o.value
      continue
    }
    if (isNonEmptyObject(o.result)) {
      cur = o.result
      continue
    }
    break
  }
  return isNonEmptyObject(cur) ? cur : {}
}

/** Map backend PascalCase / mixed JSON to ApiOrder fields */
function normalizeApiOrder(raw: ApiOrder & Record<string, unknown>): ApiOrder {
  const orderIdValue =
    raw.orderId ??
    (raw.OrderId as number | string | undefined) ??
    (raw as { id?: number | string }).id ??
    (raw as { Id?: number | string }).Id ??
    (raw as { order_id?: number | string }).order_id
  const orderNumberValue =
    raw.orderNumber ??
    (raw.OrderNumber as string | null | undefined) ??
    (raw as { code?: string | null }).code
  const vn =
    raw.vnPayStatus ??
    (raw.VnPayStatus as string | null | undefined) ??
    (raw as { vnpayStatus?: string | null }).vnpayStatus
  const st = raw.status ?? (raw.Status as string | null | undefined)
  return {
    ...raw,
    orderId: orderIdValue as number | string,
    orderNumber: orderNumberValue ?? raw.orderNumber,
    status: st ?? raw.status,
    vnPayStatus: vn ?? raw.vnPayStatus,
  }
}

function ensureOrderHasId(order: ApiOrder): ApiOrder {
  const value = String(order.orderId ?? '').trim().toLowerCase()
  if (
    order.orderId === undefined ||
    order.orderId === null ||
    value === '' ||
    value === 'undefined' ||
    value === 'null' ||
    value === 'nan'
  ) {
    throw new Error('Không lấy được orderId từ phản hồi tạo đơn hàng')
  }
  return order
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

type OrdersCacheEntry = {
  savedAt: number
  value: ApiOrdersPagedResponse
}

const ORDERS_CACHE_TTL_MS = 2 * 60 * 1000
function ordersCacheKey(pageNumber: number, pageSize: number): string {
  return `nx_orders_${pageNumber}_${pageSize}`
}

function readOrdersCache(
  pageNumber: number,
  pageSize: number
): ApiOrdersPagedResponse | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(ordersCacheKey(pageNumber, pageSize))
    if (!raw) return null
    const parsed = JSON.parse(raw) as OrdersCacheEntry
    if (!parsed || typeof parsed !== 'object') return null
    if (Date.now() - Number(parsed.savedAt ?? 0) > ORDERS_CACHE_TTL_MS) return null
    return parsed.value ?? null
  } catch {
    return null
  }
}

function writeOrdersCache(
  pageNumber: number,
  pageSize: number,
  value: ApiOrdersPagedResponse
): void {
  if (typeof window === 'undefined') return
  try {
    const entry: OrdersCacheEntry = { savedAt: Date.now(), value }
    window.sessionStorage.setItem(ordersCacheKey(pageNumber, pageSize), JSON.stringify(entry))
  } catch {
    // ignore
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
    // On client: return cache immediately if available, and also race a quick fetch.
    const cached = readOrdersCache(pageNumber, pageSize)
    if (cached) {
      // fire-and-forget refresh in background
      void (async () => {
        try {
          const rr = await fetchWithTimeout(url, { headers: getHeaders(token) }, 4500)
          if (!rr.ok) return
          const jj = (await rr.json()) as { data?: ApiOrdersPagedResponse } & ApiOrdersPagedResponse
          const dd = jj?.data ?? jj
          const rawItems = (dd?.items ?? jj?.items ?? []) as (ApiOrder & Record<string, unknown>)[]
          const items = rawItems.map((o) => normalizeApiOrder(o))
          writeOrdersCache(pageNumber, pageSize, {
            items,
            totalCount: dd?.totalCount ?? items.length,
            pageNumber: dd?.pageNumber ?? pageNumber,
            pageSize: dd?.pageSize ?? pageSize,
            totalPages: dd?.totalPages,
          })
        } catch {
          // ignore
        }
      })()
      return cached
    }

    // No cache: do a faster attempt; then fall back to a longer attempt.
    res = await fetchWithTimeout(url, { headers: getHeaders(token) }, 4500)
  } catch {
    // Retry: longer timeout for cold start / slow network
    res = await fetchWithTimeout(url, { headers: getHeaders(token) }, 10000)
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải danh sách đơn hàng'
    )
  }
  const json = (await res.json()) as { data?: ApiOrdersPagedResponse } & ApiOrdersPagedResponse
  const data = json?.data ?? json
  const rawItems = (data?.items ?? json?.items ?? []) as (ApiOrder & Record<string, unknown>)[]
  const items = rawItems.map((o) => normalizeApiOrder(o))
  const result = {
    items,
    totalCount: data?.totalCount ?? items.length,
    pageNumber: data?.pageNumber ?? pageNumber,
    pageSize: data?.pageSize ?? pageSize,
    totalPages: data?.totalPages,
  }
  writeOrdersCache(pageNumber, pageSize, result)
  return result
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
  const orderRaw = (json?.data ?? json) as ApiOrder & Record<string, unknown>
  return normalizeApiOrder(orderRaw)
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
  const json = (await res.json()) as unknown
  const orderRaw = unwrapOrderPayload(json) as ApiOrder & Record<string, unknown>
  const order = normalizeApiOrder(orderRaw)
  return ensureOrderHasId(order)
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

export async function confirmOrder(
  orderId: number | string,
  token: string
): Promise<void> {
  const res = await fetch(`${getBase()}/api/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: getJsonHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể xác nhận đơn hàng'
    )
  }
}

export async function cancelOrder(
  orderId: number | string,
  token: string
): Promise<void> {
  const res = await fetch(`${getBase()}/api/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: getJsonHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể hủy đơn hàng'
    )
  }
}

export async function createOrderShipping(
  orderId: number | string,
  token: string
): Promise<void> {
  const res = await fetch(`${getBase()}/api/orders/${orderId}/create-shipping`, {
    method: 'POST',
    headers: getJsonHeaders(token),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tạo vận chuyển'
    )
  }
}

/** BE Swagger: cartItemIds là Guid string[] */
function cartItemIdsAsStrings(ids: readonly (number | string)[]): string[] {
  return ids.map((id) => String(id))
}

/** JSON number nguyên cho province/district (không gửi string) */
function toApiInt(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.trunc(n)
}

/**
 * POST /api/Orders/checkout/preview — đúng Swagger:
 * cartItemIds, provinceId, toDistrictId, towardCode, insuranceValue, voucherCode
 */
function buildCheckoutPreviewBody(data: CheckoutPreviewRequest): Record<string, unknown> {
  const ward = String(data.toWardCode ?? '').trim()
  const voucher =
    data.voucherCode != null && String(data.voucherCode).trim() !== ''
      ? String(data.voucherCode).trim()
      : ''

  const body: Record<string, unknown> = {
    cartItemIds: cartItemIdsAsStrings(data.cartItemIds),
    provinceId: toApiInt(data.provinceId),
    towardCode: ward,
    insuranceValue: toApiInt(data.insuranceValue ?? 0),
    voucherCode: voucher,
  }

  // BE có thể không còn bắt buộc district nữa; chỉ gửi khi FE có giá trị.
  if (data.toDistrictId != null) {
    body.toDistrictId = toApiInt(data.toDistrictId)
  }

  return body
}

/** BE thường trả { success, data: { shippingFee, finalAmount, ... } } */
function unwrapCheckoutPreviewJson(json: unknown): CheckoutPreviewResponse {
  let cur: unknown = json
  for (let depth = 0; depth < 4; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) break
    const o = cur as Record<string, unknown>
    const hasFees =
      'shippingFee' in o ||
      'finalAmount' in o ||
      'discountAmount' in o ||
      'totalAmount' in o
    if (hasFees) return o as CheckoutPreviewResponse
    if ('data' in o && o.data != null && typeof o.data === 'object') {
      cur = o.data
      continue
    }
    break
  }
  return (cur ?? {}) as CheckoutPreviewResponse
}

export async function previewCheckout(
  data: CheckoutPreviewRequest,
  token: string,
  options?: { signal?: AbortSignal }
): Promise<CheckoutPreviewResponse> {
  const res = await fetch(`${getBase()}/api/orders/checkout/preview`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(buildCheckoutPreviewBody(data)),
    signal: options?.signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể xem trước checkout'
    )
  }

  const json = await res.json()
  return unwrapCheckoutPreviewJson(json)
}

/**
 * POST /api/Orders/checkout — Swagger: dùng `toWardCode` (khác preview là `towardCode`).
 */
function buildCheckoutOrderBody(data: CheckoutOrderRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    cartItemIds: cartItemIdsAsStrings(data.cartItemIds),
    shippingAddress: data.shippingAddress,
    shippingMethod: data.shippingMethod,
    paymentMethod: data.paymentMethod,
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    provinceCode: data.provinceCode,
    provinceId: data.provinceId,
    toWardCode: String(data.toWardCode ?? '').trim(),
    insuranceValue: data.insuranceValue ?? 0,
  }
  if (data.toDistrictId != null && Number.isFinite(data.toDistrictId)) {
    body.toDistrictId = data.toDistrictId
  }
  // Cho phép gửi cả chuỗi rỗng '' để đủ field theo Swagger/GHN.
  if (data.voucherCode != null) body.voucherCode = String(data.voucherCode)
  return body
}

export async function checkoutOrder(
  data: CheckoutOrderRequest,
  token: string
): Promise<ApiOrder> {
  const res = await fetch(`${getBase()}/api/orders/checkout`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(buildCheckoutOrderBody(data)),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể checkout đơn hàng'
    )
  }

  const json = (await res.json()) as unknown
  const orderRaw = unwrapOrderPayload(json) as ApiOrder & Record<string, unknown>
  const order = normalizeApiOrder(orderRaw)
  return ensureOrderHasId(order)
}

export async function getOrderShipment(
  orderId: number | string,
  token: string
): Promise<ShipmentInfo | null> {
  const res = await fetch(`${getBase()}/api/orders/${orderId}/shipment`, {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    if (res.status === 404) return null
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
