import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export const dynamic = 'force-dynamic'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query') ?? ''
    const limit = searchParams.get('limit') ?? '20'

    const qs = new URLSearchParams()
    qs.set('query', query)
    qs.set('limit', limit)

    const res = await fetch(`${API_BASE_URL}/api/products/lookup?${qs.toString()}`, {
      headers: getAuthHeaders(request),
      cache: 'no-store',
    })

    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể tìm kiếm sản phẩm',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(payload ?? [])
  } catch (error) {
    console.error('Products lookup GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tìm kiếm sản phẩm' },
      { status: 500 }
    )
  }
}

