import { NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        // Gọi API login trực tiếp (hỗ trợ admin & user local)
        const authRes = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            }
        )

        if (!authRes.ok) {
            const errData = await authRes.json().catch(() => ({}))
            const message = (errData as { message?: string }).message || 'Sai email hoặc mật khẩu'
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
            }
        }

        const { accessToken, user: apiUser } = authData
        if (!accessToken || !apiUser) {
            return NextResponse.json({ error: 'Phản hồi đăng nhập không hợp lệ' }, { status: 500 })
        }

        // Map sang format FE mong đợi
        const userData = {
            userId: apiUser.id,
            firebaseUid: apiUser.id,
            email: apiUser.email ?? '',
            phoneNumber: apiUser.phoneNumber ?? '',
            displayName: apiUser.displayName ?? '',
            provider: apiUser.provider ?? 'Local',
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
        console.error('Login API error:', error)
        return NextResponse.json({ error: 'Đã có lỗi xảy ra' }, { status: 500 })
    }
} 