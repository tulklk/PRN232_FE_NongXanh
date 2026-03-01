import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const headers = getAuthHeaders(request)
    const res = await fetch(
      `${API_BASE_URL}/api/Payments/order/${orderId}`,
      { headers }
    )

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'Không tìm thấy thanh toán' },
          { status: 404 }
        )
      }
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể tải thông tin thanh toán',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Payment by order GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải thanh toán' },
      { status: 500 }
    )
  }
}
