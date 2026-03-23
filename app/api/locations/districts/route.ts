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
    const provinceId = searchParams.get('provinceId')
    if (!provinceId) {
      return NextResponse.json(
        { error: 'Thiếu tham số provinceId' },
        { status: 400 }
      )
    }

    const res = await fetch(
      `${API_BASE_URL}/api/locations/districts?provinceId=${encodeURIComponent(provinceId)}`,
      {
        headers: getAuthHeaders(request),
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            'Không thể tải danh sách quận/huyện',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Locations districts GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải quận/huyện' },
      { status: 500 }
    )
  }
}
