import type { ApiVoucher, ApiVouchersPagedResponse } from '@/lib/types/api'

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

interface VouchersApiResponse {
  success?: boolean
  message?: string
  data?: ApiVouchersPagedResponse
}

interface VoucherApiResponse {
  success?: boolean
  message?: string
  data?: ApiVoucher
}

export async function getVouchers(
  pageNumber = 1,
  pageSize = 100,
  token?: string
): Promise<ApiVoucher[]> {
  const res = await fetch(
    `${getBase()}/api/vouchers?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    { headers: getHeaders(token) }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải voucher')
  }
  const json = (await res.json()) as VouchersApiResponse
  const data = json?.data
  if (data?.items) return data.items
  const raw = json as unknown
  if (Array.isArray((raw as { data?: unknown }).data))
    return (raw as { data: ApiVoucher[] }).data
  return []
}

export async function getVoucherById(
  id: string,
  token?: string
): Promise<ApiVoucher | null> {
  const res = await fetch(`${getBase()}/api/vouchers/${id}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    if (res.status === 404) return null
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải voucher')
  }
  const json = (await res.json()) as VoucherApiResponse
  const data = json?.data ?? (json as unknown as ApiVoucher)
  return data && typeof data === 'object' ? (data as ApiVoucher) : null
}

export interface CreateVoucherInput {
  code: string
  description?: string
  discountType: string
  discountValue: number
  minOrderValue?: number
  maxDiscount?: number
  quantity?: number
  startDate?: string
  endDate?: string
}

export async function createVoucher(
  data: CreateVoucherInput,
  token?: string
): Promise<ApiVoucher> {
  const body = {
    code: data.code,
    description: data.description ?? '',
    discountType: data.discountType,
    discountValue: data.discountValue,
    minOrderValue: data.minOrderValue ?? 0,
    maxDiscount: data.maxDiscount ?? 0,
    quantity: data.quantity ?? 0,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
  }
  const res = await fetch(`${getBase()}/api/vouchers`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText, message: res.statusText }))
    throw new Error(
      (err as { message?: string }).message || (err as { error?: string }).error || 'Không thể tạo voucher'
    )
  }
  const json = (await res.json()) as VoucherApiResponse
  const result = json?.data ?? json
  if (!result) throw new Error('Phản hồi không hợp lệ')
  return result as ApiVoucher
}

export interface UpdateVoucherInput {
  voucherId?: number
  description?: string
  discountType?: string
  discountValue?: number
  minOrderValue?: number
  maxDiscount?: number
  quantity?: number
  startDate?: string
  endDate?: string
  status?: string
}

export async function updateVoucher(
  id: string,
  data: UpdateVoucherInput,
  token?: string
): Promise<ApiVoucher> {
  const body = {
    voucherId: data.voucherId ?? Number(id),
    description: data.description ?? '',
    discountType: data.discountType,
    discountValue: data.discountValue,
    minOrderValue: data.minOrderValue ?? 0,
    maxDiscount: data.maxDiscount ?? 0,
    quantity: data.quantity ?? 0,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
    status: data.status,
  }
  const res = await fetch(`${getBase()}/api/vouchers/${id}`, {
    method: 'PUT',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText, message: res.statusText }))
    throw new Error(
      (err as { message?: string }).message || (err as { error?: string }).error || 'Không thể cập nhật voucher'
    )
  }
  const json = (await res.json()) as VoucherApiResponse
  const result = json?.data ?? json
  return (result ?? data) as ApiVoucher
}

export async function deleteVoucher(id: string, token?: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/vouchers/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText, message: res.statusText }))
    throw new Error(
      (err as { message?: string }).message || (err as { error?: string }).error || 'Không thể xóa voucher'
    )
  }
}
