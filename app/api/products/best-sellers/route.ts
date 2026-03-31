import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export const dynamic = 'force-dynamic'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth) headers.Authorization = auth
  return headers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const top = searchParams.get('top') ?? '10'
    const lastDays = searchParams.get('lastDays') ?? ''

    const qs = new URLSearchParams()
    if (top) qs.set('top', top)
    if (lastDays) qs.set('lastDays', lastDays)

    const res = await fetch(`${API_BASE_URL}/api/Products/best-sellers?${qs.toString()}`, {
      headers: getAuthHeaders(request),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            'Không thể tải sản phẩm bán chạy nhất',
        },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Products best-sellers GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải sản phẩm bán chạy nhất' },
      { status: 500 }
    )
  }
}

