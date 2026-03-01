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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cartItemId: string }> }
) {
  try {
    const { cartItemId } = await params
    const headers = getAuthHeaders(request)
    const res = await fetch(
      `${API_BASE_URL}/api/Carts/items/${cartItemId}`,
      {
        method: 'DELETE',
        headers,
      }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể xóa sản phẩm khỏi giỏ',
        },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Carts item DELETE error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi xóa khỏi giỏ' },
      { status: 500 }
    )
  }
}
