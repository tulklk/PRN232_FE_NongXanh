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

async function parseJsonSafe(res: Response): Promise<unknown> {
  return res.json().catch(() => null)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: getJsonHeaders(request),
      body: JSON.stringify(body),
    })

    const payload = await parseJsonSafe(res)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể gửi tin nhắn tới AI chat',
        },
        { status: res.status }
      )
    }

    if (payload !== null) return NextResponse.json(payload)
    return NextResponse.json({ message: '' })
  } catch (error: unknown) {
    console.error('Chat POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi gọi AI chat' },
      { status: 500 }
    )
  }
}

