import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

function getHeaders(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('Authorization')
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (auth) headers['Authorization'] = auth
  return headers
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  return res.json().catch(() => null)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/notifications/${encodeURIComponent(params.id)}/read`,
      { method: 'PATCH', headers: getHeaders(request) }
    )

    const payload = await parseJsonSafe(res)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể đánh dấu thông báo đã đọc',
        },
        { status: res.status }
      )
    }

    if (payload !== null) return NextResponse.json(payload)
    return NextResponse.json({ status: 'ok' })
  } catch (error: unknown) {
    console.error('Notification read PATCH error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi đánh dấu thông báo đã đọc' },
      { status: 500 }
    )
  }
}

