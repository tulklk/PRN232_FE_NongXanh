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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ error: 'Thiếu id combo' }, { status: 400 })
    }

    const url = `${API_BASE_URL}/api/MealCombos/${encodeURIComponent(id)}`
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
            errorData.message || errorData.error || 'Không thể tải combo',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(payload ?? {})
  } catch (error: unknown) {
    console.error('MealCombos detail GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi tải combo' },
      { status: 500 }
    )
  }
}

