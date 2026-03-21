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
    const res = await fetch(`${API_BASE_URL}/api/product-variants/${id}`, {
      headers: getAuthHeaders(request),
      next: { revalidate: 30 },
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (data as { message?: string; error?: string } | null)?.message ||
            (data as { message?: string; error?: string } | null)?.error ||
            'Không thể tải chi tiết biến thể sản phẩm',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('ProductVariant GET by id error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải chi tiết biến thể sản phẩm' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/product-variants/${id}`, {
      method: 'PUT',
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
            'Không thể cập nhật biến thể sản phẩm',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('ProductVariant PUT error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi cập nhật biến thể sản phẩm' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const res = await fetch(`${API_BASE_URL}/api/product-variants/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(request),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (data as { message?: string; error?: string } | null)?.message ||
            (data as { message?: string; error?: string } | null)?.error ||
            'Không thể xóa biến thể sản phẩm',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(data ?? { success: true }, { status: res.status || 200 })
  } catch (error) {
    console.error('ProductVariant DELETE error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi xóa biến thể sản phẩm' },
      { status: 500 }
    )
  }
}
