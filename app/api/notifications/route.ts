import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth) headers['Authorization'] = auth
  return headers
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  return res.json().catch(() => null)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qs = new URLSearchParams()
    const pageNumber = searchParams.get('pageNumber')
    const pageSize = searchParams.get('pageSize')
    if (pageNumber) qs.set('pageNumber', pageNumber)
    if (pageSize) qs.set('pageSize', pageSize)

    const url = `${API_BASE_URL}/api/notifications${
      qs.toString() ? `?${qs.toString()}` : ''
    }`
    const res = await fetch(url, { method: 'GET', headers: getHeaders(request) })

    const payload = await parseJsonSafe(res)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể tải thông báo',
        },
        { status: res.status }
      )
    }

    if (payload !== null) return NextResponse.json(payload)
    return NextResponse.json({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10 })
  } catch (error: unknown) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải thông báo' },
      { status: 500 }
    )
  }
}

