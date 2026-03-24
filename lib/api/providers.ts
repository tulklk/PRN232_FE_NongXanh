import type { ApiProvider, ApiProvidersPagedResponse } from '@/lib/types/api'

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

interface ProvidersApiResponse {
  success?: boolean
  message?: string
  data?: ApiProvidersPagedResponse | ApiProvider[] | ApiProvider
  items?: ApiProvider[]
}

interface ProviderApiResponse {
  success?: boolean
  message?: string
  data?: ApiProvider
}

export async function getProviders(
  pageNumber = 1,
  pageSize = 100,
  token?: string
): Promise<ApiProvider[]> {
  const res = await fetch(
    `${getBase()}/api/providers?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    { headers: getHeaders(token) }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error ||
        'Không thể tải danh sách nhà cung cấp'
    )
  }
  const json = (await res.json()) as ProvidersApiResponse
  const data = json?.data
  if (data && Array.isArray((data as ApiProvidersPagedResponse).items)) {
    return (data as ApiProvidersPagedResponse).items
  }
  if (Array.isArray(json.items)) return json.items
  if (Array.isArray(data)) return data as ApiProvider[]
  if (Array.isArray(json as unknown)) return json as unknown as ApiProvider[]
  return []
}

export async function getProviderById(
  id: string | number,
  token?: string
): Promise<ApiProvider | null> {
  const res = await fetch(`${getBase()}/api/providers/${id}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    if (res.status === 404) return null
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error ||
        'Không thể tải thông tin nhà cung cấp'
    )
  }
  const json = (await res.json()) as ProviderApiResponse | ApiProvider
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as ProviderApiResponse).data ?? null
  }
  return json as ApiProvider
}

export interface CreateProviderInput {
  providerName: string
  imageUrl?: string | null
  description?: string | null
  phoneNumber?: string | null
  email?: string | null
  address?: string | null
  status?: string | null
}

export async function createProvider(
  data: CreateProviderInput,
  token?: string
): Promise<ApiProvider> {
  const body = {
    providerName: data.providerName,
    imageUrl: data.imageUrl ?? null,
    description: data.description ?? null,
    phoneNumber: data.phoneNumber ?? null,
    email: data.email ?? null,
    address: data.address ?? null,
    status: data.status ?? null,
  }
  const res = await fetch(`${getBase()}/api/providers`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText,
      message: res.statusText,
    }))
    throw new Error(
      (err as { message?: string }).message ||
        (err as { error?: string }).error ||
        'Không thể tạo nhà cung cấp'
    )
  }
  const json = (await res.json()) as ProviderApiResponse | ApiProvider
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as ProviderApiResponse).data as ApiProvider
  }
  return json as ApiProvider
}

export interface UpdateProviderInput {
  providerName?: string
  imageUrl?: string | null
  description?: string | null
  phoneNumber?: string | null
  email?: string | null
  address?: string | null
  status?: string | null
}

export async function updateProvider(
  id: string | number,
  data: UpdateProviderInput,
  token?: string
): Promise<ApiProvider> {
  const body: Record<string, unknown> = {}
  if (data.providerName !== undefined) body.providerName = data.providerName
  if (data.imageUrl !== undefined) body.imageUrl = data.imageUrl
  if (data.description !== undefined) body.description = data.description
  if (data.phoneNumber !== undefined) body.phoneNumber = data.phoneNumber
  if (data.email !== undefined) body.email = data.email
  if (data.address !== undefined) body.address = data.address
  if (data.status !== undefined) body.status = data.status

  const res = await fetch(`${getBase()}/api/providers/${id}`, {
    method: 'PUT',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText,
      message: res.statusText,
    }))
    throw new Error(
      (err as { message?: string }).message ||
        (err as { error?: string }).error ||
        'Không thể cập nhật nhà cung cấp'
    )
  }
  const json = (await res.json()) as ProviderApiResponse | ApiProvider
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as ProviderApiResponse).data as ApiProvider
  }
  return json as ApiProvider
}

export async function deleteProvider(
  id: string | number,
  token?: string
): Promise<void> {
  const res = await fetch(`${getBase()}/api/providers/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: res.statusText,
      message: res.statusText,
    }))
    throw new Error(
      (err as { message?: string }).message ||
        (err as { error?: string }).error ||
        'Không thể xóa nhà cung cấp'
    )
  }
}

