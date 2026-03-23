import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export const dynamic = 'force-dynamic'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    let url = `${API_BASE_URL}/api/ProductVariants`
    if (productId) {
      url += `?productId=${productId}`
    }

    const res = await fetch(url, {
      headers: getAuthHeaders(request),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể tải danh sách biến thể sản phẩm',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('ProductVariants GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải biến thể sản phẩm' },
      { status: 500 }
    )
  }
}

function getJsonHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/ProductVariants`, {
      method: 'POST',
      headers: getJsonHeaders(request),
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
  } catch (error: unknown) {
    console.error('ProductVariants POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tạo biến thể sản phẩm' },
      { status: 500 }
    )
  }
}
