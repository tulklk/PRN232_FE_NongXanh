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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Body không hợp lệ' },
        { status: 400 }
      )
    }
    // Swagger: payload có thể có cả variantId + mealComboId; combo thì variantId nên là null.
    if (
      body &&
      typeof body === 'object' &&
      'mealComboId' in body &&
      !('variantId' in body)
    ) {
      ;(body as Record<string, unknown>).variantId = null
    }
    const headers = getJsonHeaders(request)
    const res = await fetch(`${API_BASE_URL}/api/Carts/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      const contentType = res.headers.get('content-type') || ''
      const errorData =
        contentType.includes('application/json')
          ? await res.json().catch(() => ({}))
          : await res.text().catch(() => '')
      return NextResponse.json(
        {
          error:
            (typeof errorData === 'string' ? errorData : null) ||
            (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            'Không thể thêm sản phẩm vào giỏ',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Carts items POST error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Đã có lỗi xảy ra khi thêm vào giỏ',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = getJsonHeaders(request)
    const res = await fetch(`${API_BASE_URL}/api/Carts/items`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể cập nhật giỏ hàng',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Carts items PUT error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi cập nhật giỏ hàng' },
      { status: 500 }
    )
  }
}
