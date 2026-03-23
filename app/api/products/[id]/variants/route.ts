import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export const dynamic = 'force-dynamic'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const res = await fetch(`${API_BASE_URL}/api/products/${id}/variants`, {
      headers: getAuthHeaders(request),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string; error?: string }).message ||
            (errorData as { message?: string; error?: string }).error ||
            'Không thể tải danh sách biến thể sản phẩm',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Products Variants GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải danh sách biến thể sản phẩm' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/products/${id}/variants`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(request),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (data as { message?: string; error?: string } | null)?.message ||
            (data as { message?: string; error?: string } | null)?.error ||
            'Không thể tạo biến thể sản phẩm',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Products Variants POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tạo biến thể sản phẩm' },
      { status: 500 }
    )
  }
}
