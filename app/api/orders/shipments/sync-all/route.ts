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
    const res = await fetch(`${API_BASE_URL}/api/Orders/shipments/sync-all`, {
      method: 'POST',
      headers: getJsonHeaders(request),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            'Không thể đồng bộ tất cả vận đơn',
        },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Order shipments sync-all POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi đồng bộ tất cả vận đơn' },
      { status: 500 }
    )
  }
}

