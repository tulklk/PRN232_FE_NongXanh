import type { ApiCategory, ApiCategoriesResponse } from '@/lib/types/api'

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

export async function getCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${getBase()}/api/categories`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải danh mục')
  }
  const json = (await res.json()) as ApiCategoriesResponse
  const data = json.data ?? (Array.isArray(json) ? json : [])
  return Array.isArray(data) ? data : []
}

export async function getCategoryById(id: string, token?: string): Promise<ApiCategory | null> {
  const res = await fetch(`${getBase()}/api/categories/${id}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    if (res.status === 404) return null
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error || 'Không thể tải danh mục')
  }
  const json = await res.json()
  const data = json?.data ?? json
  return data && typeof data === 'object' ? (data as ApiCategory) : null
}

export interface CreateCategoryInput {
  categoryName: string
  description?: string
  parentId?: number
}

export async function createCategory(
  data: CreateCategoryInput,
  token?: string
): Promise<ApiCategory> {
  const body = {
    name: data.categoryName,
    categoryName: data.categoryName,
    description: data.description ?? '',
    parentId: data.parentId ?? null,
  }
  const res = await fetch(`${getBase()}/api/categories`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText, message: res.statusText }))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Không thể tạo danh mục')
  }
  const json = await res.json()
  const result = json?.data ?? json
  if (!result) throw new Error('Phản hồi không hợp lệ')
  return result as ApiCategory
}

export interface UpdateCategoryInput {
  categoryName: string
  description?: string
  parentId?: number | null
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryInput,
  token?: string
): Promise<ApiCategory> {
  const body = {
    name: data.categoryName,
    categoryName: data.categoryName,
    description: data.description ?? '',
    parentId: data.parentId ?? null,
  }
  const res = await fetch(`${getBase()}/api/categories/${id}`, {
    method: 'PUT',
    headers: getJsonHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText, message: res.statusText }))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Không thể cập nhật danh mục')
  }
  const json = await res.json()
  const result = json?.data ?? json
  return (result ?? data) as ApiCategory
}

export async function deleteCategory(id: string, token?: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText, message: res.statusText }))
    throw new Error((err as { message?: string }).message || (err as { error?: string }).error || 'Không thể xóa danh mục')
  }
}
