import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getJsonHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.text()
    const headers = getJsonHeaders(request)
    const res = await fetch(
      `${API_BASE_URL}/api/Payments/${id}/status`,
      {
        method: 'PATCH',
        headers,
        body: body || '""',
      }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể cập nhật trạng thái thanh toán',
        },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Payment status PATCH error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi cập nhật thanh toán' },
      { status: 500 }
    )
  }
}
