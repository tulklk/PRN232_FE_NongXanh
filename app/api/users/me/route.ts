import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getAuthHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
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
    const headers = getAuthHeaders(request)
    const res = await fetch(`${API_BASE_URL}/api/users/me`, { headers })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: 'Không tìm thấy người dùng' },
          { status: 404 }
        )
      }
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            'Không thể tải thông tin người dùng',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Current user GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải thông tin người dùng' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = getJsonHeaders(request)
    const res = await fetch(`${API_BASE_URL}/api/users/me`, {
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
            'Không thể cập nhật người dùng',
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Current user PUT error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi cập nhật người dùng' },
      { status: 500 }
    )
  }
}

