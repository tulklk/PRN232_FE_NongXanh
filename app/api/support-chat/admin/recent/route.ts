import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  process.env.SUPPORT_CHAT_BACKEND_URL ||
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (auth) headers['Authorization'] = auth
  return headers
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  return res.json().catch(() => null)
}

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/support-chat/admin/recent`, {
      method: 'GET',
      headers: getHeaders(request),
    })

    const payload = await parseJsonSafe(res)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể tải danh sách chat gần đây',
        },
        { status: res.status }
      )
    }

    if (payload !== null) return NextResponse.json(payload)
    return NextResponse.json({ items: [] })
  } catch (error: unknown) {
    console.error('Support chat admin recent GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải danh sách chat gần đây' },
      { status: 500 }
    )
  }
}

