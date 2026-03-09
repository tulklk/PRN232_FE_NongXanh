import type { ApiBlog, ApiBlogsPagedResponse } from '@/lib/types/api'

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

export interface GetBlogsParams {
  pageNumber?: number
  pageSize?: number
}

export async function getBlogs(
  params?: GetBlogsParams,
  token?: string
): Promise<ApiBlogsPagedResponse> {
  const pageNumber = params?.pageNumber ?? 1
  const pageSize = params?.pageSize ?? 10

  const res = await fetch(
    `${getBase()}/api/blogs?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    { headers: getHeaders(token) }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải danh sách tin tức'
    )
  }

  const json = (await res.json()) as
    | { data?: ApiBlogsPagedResponse }
    | ApiBlogsPagedResponse
    | { items?: ApiBlog[]; totalCount?: number; pageNumber?: number; pageSize?: number; totalPages?: number }

  const data =
    (json && typeof json === 'object' && 'data' in json ? (json as any).data : json) as
      | ApiBlogsPagedResponse
      | undefined

  const items = (data?.items ?? (json as any).items ?? []) as ApiBlog[]

  return {
    items,
    totalCount: data?.totalCount ?? (json as any).totalCount ?? items.length,
    pageNumber: data?.pageNumber ?? (json as any).pageNumber ?? pageNumber,
    pageSize: data?.pageSize ?? (json as any).pageSize ?? pageSize,
    totalPages: data?.totalPages ?? (json as any).totalPages,
  }
}

