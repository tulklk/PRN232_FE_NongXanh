import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export const dynamic = 'force-dynamic'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageNumber = searchParams.get('pageNumber') || '1'
    const pageSize = searchParams.get('pageSize') || '10'
    const categoryId = searchParams.get('categoryId') || searchParams.get('category')
    const providerId =
      searchParams.get('providerId') || searchParams.get('provider') || ''

    let url = `${API_BASE_URL}/api/Products?pageNumber=${pageNumber}&pageSize=${pageSize}`
    if (categoryId) {
      const encoded = encodeURIComponent(categoryId)
      url += `&categoryId=${encoded}`
    }
    if (providerId) {
      const enc = encodeURIComponent(providerId)
      url += `&providerId=${enc}&provider=${enc}`
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
            'Không thể tải sản phẩm',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải sản phẩm' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/Products`, {
      method: 'POST',
      headers: getJsonHeaders(request),
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể tạo sản phẩm',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Products POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tạo sản phẩm' },
      { status: 500 }
    )
  }
}
