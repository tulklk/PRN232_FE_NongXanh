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
  { params }: { params: { cartItemId: string } }
) {
  try {
    const cartItemId = decodeURIComponent(params.cartItemId)
    const res = await fetch(
      `${API_BASE_URL}/api/Carts/items/${encodeURIComponent(cartItemId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(request),
      }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            'Không thể xóa sản phẩm khỏi giỏ',
        },
        { status: res.status }
      )
    }

    // Endpoint delete có thể trả 204 (no content), tránh parse JSON lỗi.
    if (res.status === 204) {
      return NextResponse.json({ success: true })
    }

    const data = await res.json().catch(() => ({ success: true }))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Carts item DELETE error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi xóa khỏi giỏ' },
      { status: 500 }
    )
  }
}
