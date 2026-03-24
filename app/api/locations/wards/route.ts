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
    const districtId = searchParams.get('districtId')
    if (!districtId) {
      return NextResponse.json(
        { error: 'Thiếu tham số districtId' },
        { status: 400 }
      )
    }

    const res = await fetch(
      `${API_BASE_URL}/api/locations/wards?districtId=${encodeURIComponent(districtId)}`,
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
            'Không thể tải danh sách phường/xã',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Locations wards GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải phường/xã' },
      { status: 500 }
    )
  }
}
