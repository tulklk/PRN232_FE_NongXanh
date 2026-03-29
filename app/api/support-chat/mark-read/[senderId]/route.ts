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

export async function POST(
  request: NextRequest,
  { params }: { params: { senderId: string } }
) {
  try {
    const senderId = params.senderId
    const res = await fetch(
      `${API_BASE_URL}/api/support-chat/mark-read/${encodeURIComponent(senderId)}`,
      { method: 'POST', headers: getHeaders(request) }
    )

    const payload = await parseJsonSafe(res)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể đánh dấu đã đọc',
        },
        { status: res.status }
      )
    }

    if (payload !== null) return NextResponse.json(payload)
    return NextResponse.json({ status: 'ok' })
  } catch (error: unknown) {
    console.error('Support chat mark-read POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi đánh dấu đã đọc' },
      { status: 500 }
    )
  }
}

