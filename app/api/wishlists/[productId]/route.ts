import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export const dynamic = 'force-dynamic'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth) headers.Authorization = auth
  return headers
}

export async function DELETE(
  request: NextRequest,
  context: { params: { productId: string } }
) {
  try {
    const productId = context.params.productId
    if (!productId) {
      return NextResponse.json({ error: 'Thiếu productId' }, { status: 400 })
    }

    const res = await fetch(
      `${API_BASE_URL}/api/wishlists/${encodeURIComponent(productId)}`,
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
            'Không thể xóa wishlist',
        },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Wishlists DELETE error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi xóa wishlist' },
      { status: 500 }
    )
  }
}
