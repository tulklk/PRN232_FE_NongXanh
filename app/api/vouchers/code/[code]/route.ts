import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Mã giảm giá không hợp lệ' },
        { status: 400 }
      )
    }

    const headers = getAuthHeaders(request)
    const res = await fetch(
      `${API_BASE_URL}/api/Vouchers/code/${encodeURIComponent(code)}`,
      { headers }
    )

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' },
          { status: 404 }
        )
      }
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể kiểm tra mã giảm giá',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Voucher by code GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi kiểm tra mã giảm giá' },
      { status: 500 }
    )
  }
}
