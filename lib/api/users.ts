import type { ApiUser, ApiUsersPagedResponse } from '@/lib/types/api'

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

interface UsersApiResponse {
  success?: boolean
  message?: string
  data?: ApiUsersPagedResponse
}

interface UserApiResponse {
  success?: boolean
  message?: string
  data?: ApiUser
}

export async function getUsers(
  pageNumber = 1,
  pageSize = 100,
  token?: string
): Promise<ApiUser[]> {
  const res = await fetch(
    `${getBase()}/api/users?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    { headers: getHeaders(token) }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error ||
        'Không thể tải danh sách người dùng'
    )
  }
  const json = (await res.json()) as UsersApiResponse & {
    items?: ApiUser[]
    data?: ApiUsersPagedResponse | ApiUser[]
  }
  const data = json?.data
  if (data && typeof data === 'object' && 'items' in data && Array.isArray(data.items))
    return data.items
  // Backend may return { items, totalCount, pageNumber, pageSize } directly
  if (Array.isArray(json?.items)) return json.items
  const raw = json as unknown
  if (Array.isArray((raw as { data?: unknown }).data))
    return (raw as { data: ApiUser[] }).data
  // Fallback: response might be the array directly
  if (Array.isArray(raw)) return raw as ApiUser[]
  return []
}

export async function getUserById(
  id: string,
  token?: string
): Promise<ApiUser | null> {
  const res = await fetch(`${getBase()}/api/users/${id}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    if (res.status === 404) return null
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error ||
        'Không thể tải thông tin người dùng'
    )
  }
  const json = (await res.json()) as UserApiResponse
  const data = json?.data ?? (json as unknown as ApiUser)
  return data && typeof data === 'object' ? (data as ApiUser) : null
}

export interface CreateUserInput {
  email?: string
  phoneNumber?: string
  displayName?: string
  provider: string
  isActive?: boolean
}

export async function createUser(
  data: CreateUserInput,
  token?: string
): Promise<ApiUser> {
  const body = {
    email: data.email ?? null,
    phoneNumber: data.phoneNumber ?? null,
    displayName: data.displayName ?? null,
    provider: data.provider,
    isActive: data.isActive ?? true,
  }
  const res = await fetch(`${getBase()}/api/users`, {
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
        'Không thể tạo người dùng'
    )
  }
  const json = (await res.json()) as UserApiResponse
  const result = json?.data ?? json
  if (!result) throw new Error('Phản hồi không hợp lệ')
  return result as ApiUser
}

export interface UpdateUserInput {
  email?: string
  phoneNumber?: string
  displayName?: string
  isActive?: boolean
}

export async function updateUser(
  id: string,
  data: UpdateUserInput,
  token?: string
): Promise<ApiUser> {
  const body: Record<string, unknown> = {
    email: data.email ?? null,
    phoneNumber: data.phoneNumber ?? null,
    displayName: data.displayName ?? null,
  }
  if (data.isActive !== undefined) body.isActive = data.isActive
  const res = await fetch(`${getBase()}/api/users/${id}`, {
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
        'Không thể cập nhật người dùng'
    )
  }
  const json = (await res.json()) as UserApiResponse
  const result = json?.data ?? json
  return (result ?? { id, ...data }) as ApiUser
}

export async function deleteUser(id: string, token?: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/users/${id}`, {
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
        'Không thể xóa người dùng'
    )
  }
}
