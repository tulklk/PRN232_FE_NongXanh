import type { ApiPayment, CreatePaymentRequest } from '@/lib/types/api'

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

export async function getPaymentByOrderId(
  orderId: number | string,
  token?: string
): Promise<ApiPayment | null> {
  const res = await fetch(
    `${getBase()}/api/payments/order/${orderId}`,
    { headers: getHeaders(token) }
  )
  if (!res.ok) {
    if (res.status === 404) return null
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải thông tin thanh toán'
    )
  }
  return (await res.json()) as ApiPayment
}

export async function createPayment(
  data: CreatePaymentRequest,
  token: string
): Promise<ApiPayment> {
  const res = await fetch(`${getBase()}/api/payments`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tạo thanh toán'
    )
  }
  return (await res.json()) as ApiPayment
}

export async function updatePaymentStatus(
  id: number | string,
  status: string,
  token: string
): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/payments/${id}/status`,
    {
      method: 'PATCH',
      headers: getJsonHeaders(token),
      body: JSON.stringify(status),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể cập nhật trạng thái thanh toán'
    )
  }
}
