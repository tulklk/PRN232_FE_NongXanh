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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const peopleCount = searchParams.get('peopleCount') ?? ''
    const days = searchParams.get('days') ?? ''
    const dietType = searchParams.get('dietType') ?? ''

    const qs = new URLSearchParams()
    if (peopleCount) qs.set('peopleCount', peopleCount)
    if (days) qs.set('days', days)
    if (dietType) qs.set('dietType', dietType)

    const url = `${API_BASE_URL}/api/MealCombos/suggestions?${qs.toString()}`
    const res = await fetch(url, {
      headers: getAuthHeaders(request),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      return NextResponse.json(
        {
          error:
            (errorData as { message?: string }).message ||
            (errorData as { error?: string }).error ||
            'Không thể lấy gợi ý combo',
        },
        { status: res.status }
      )
    }

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('MealCombos suggestions GET error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi lấy gợi ý combo' },
      { status: 500 }
    )
  }
}

