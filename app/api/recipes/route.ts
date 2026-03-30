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

function getJsonHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageNumber = searchParams.get('pageNumber')
    const pageSize = searchParams.get('pageSize')

    const qs = new URLSearchParams()
    if (pageNumber) qs.set('pageNumber', pageNumber)
    if (pageSize) qs.set('pageSize', pageSize)

    const url =
      qs.toString().length > 0
        ? `${API_BASE_URL}/api/Recipes?${qs.toString()}`
        : `${API_BASE_URL}/api/Recipes`

    const res = await fetch(url, {
      headers: getAuthHeaders(request),
      cache: 'no-store',
    })

    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message || errorData.error || 'Không thể tải recipes',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(payload ?? { items: [] })
  } catch (error: unknown) {
    console.error('Recipes GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải recipes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Forward raw JSON — tránh parse/stringify làm lệch payload (vd. ingredients).
    const rawBody = await request.text()
    const url = `${API_BASE_URL}/api/Recipes`

    const res = await fetch(url, {
      method: 'POST',
      headers: getJsonHeaders(request),
      body: rawBody.trim() ? rawBody : '{}',
      cache: 'no-store',
    })

    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string; title?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            errorData.title ||
            'Không thể tạo recipe',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(payload ?? { success: true })
  } catch (error: unknown) {
    console.error('Recipes POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tạo recipe' },
      { status: 500 }
    )
  }
}

