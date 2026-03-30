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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await fetch(
      `${API_BASE_URL}/api/Recipes/${encodeURIComponent(id)}/add-to-cart`,
      {
        method: 'POST',
        headers: getAuthHeaders(request),
      }
    )

    const payload = await res.json().catch(() => null)
    if (!res.ok) {
      const errorData = (payload ?? {}) as { message?: string; error?: string }
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Không thể thêm nguyên liệu vào giỏ',
        },
        { status: res.status }
      )
    }

    return NextResponse.json(payload ?? true)
  } catch (error: unknown) {
    console.error('Recipes add-to-cart POST error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi thêm nguyên liệu vào giỏ' },
      { status: 500 }
    )
  }
}

