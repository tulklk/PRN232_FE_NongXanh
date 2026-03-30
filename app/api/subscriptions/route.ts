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
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

export async function GET(request: NextRequest) {
  try {
    // Nếu BE có GET /api/Subscriptions, route này sẽ hoạt động.
    // Nếu không hỗ trợ, FE sẽ fallback UI.
    const res = await fetch(`${API_BASE_URL}/api/Subscriptions`, {
      headers: getAuthHeaders(request),
      cache: 'no-store',
    })

    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể tải subscriptions',
        },
        { status: res.status }
      )
    }
    return NextResponse.json(payload ?? { items: [] })
  } catch (error: unknown) {
    console.error('Subscriptions GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/Subscriptions`, {
      method: 'POST',
      headers: getJsonHeaders(request),
      body: JSON.stringify(body),
    })

    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể tạo subscription',
        },
        { status: res.status }
      )
    }
    return NextResponse.json(payload ?? {})
  } catch (error: unknown) {
    console.error('Subscriptions POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tạo subscription' },
      { status: 500 }
    )
  }
}

