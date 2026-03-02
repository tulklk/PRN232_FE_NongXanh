import { NextResponse } from 'next/server'

const API_BASE_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, state, redirectUri } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Thiếu tham số code' },
        { status: 400 }
      )
    }

    const stateVal =
      state && typeof state === 'string' && state.length > 0
        ? state
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const authRes = await fetch(
      `${API_BASE_URL}/api/auth/google/callback`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          state: stateVal,
          redirectUri: redirectUri || null,
        }),
      }
    )

    if (!authRes.ok) {
      const errData = await authRes.json().catch(() => ({}))
      const err = errData as { message?: string; error?: string; title?: string }
      const message =
        err?.message || err?.error || err?.title || 'Đăng nhập Google thất bại'
      console.warn('[Google callback] Backend error:', authRes.status, errData)
      return NextResponse.json({ error: message }, { status: authRes.status })
    }

    const authData = (await authRes.json()) as {
      accessToken?: string
      user?: {
        id: string
        email?: string
        phoneNumber?: string | null
        displayName?: string
        provider?: string
        role?: string
        createdAt?: string
      }
    }

    const { accessToken, user: apiUser } = authData
    if (!accessToken || !apiUser) {
      return NextResponse.json(
        { error: 'Phản hồi đăng nhập không hợp lệ' },
        { status: 500 }
      )
    }

    const userData = {
      userId: apiUser.id,
      firebaseUid: apiUser.id,
      email: apiUser.email ?? '',
      phoneNumber: apiUser.phoneNumber ?? '',
      displayName: apiUser.displayName ?? '',
      provider: apiUser.provider ?? 'Google',
      role: apiUser.role ?? '',
      accessToken,
    }

    return NextResponse.json({
      ...userData,
      tokens: {
        idToken: accessToken,
        refreshToken: '',
        expiresIn: 3600,
      },
    })
  } catch (error: unknown) {
    console.error('Google callback API error:', error)
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi đăng nhập Google' },
      { status: 500 }
    )
  }
}
