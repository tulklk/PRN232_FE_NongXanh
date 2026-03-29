import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId
    const res = await fetch(
      `${API_BASE_URL}/api/Reviews/product/${encodeURIComponent(productId)}`,
      { headers: getHeaders(request) }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            'Không thể tải đánh giá sản phẩm',
        },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => ([]))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Reviews product GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải đánh giá sản phẩm' },
      { status: 500 }
    )
  }
}

