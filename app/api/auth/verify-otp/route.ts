import { NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, otp, displayName, phoneNumber } = body

        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Vui lòng nhập email và mã OTP' },
                { status: 400 }
            )
        }

        const verifyRes = await fetch(
            `${API_BASE_URL}/api/auth/email/verify-otp`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, displayName, phoneNumber }),
            }
        )

        if (!verifyRes.ok) {
            const errData = await verifyRes.json().catch(() => ({}))
            const message = (errData as { message?: string }).message || 'Mã OTP không hợp lệ hoặc đã hết hạn'
            return NextResponse.json({ error: message }, { status: verifyRes.status })
        }

        const authData = (await verifyRes.json()) as {
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
            return NextResponse.json({ error: 'Phản hồi xác thực không hợp lệ' }, { status: 500 })
        }

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
        console.error('Verify OTP API error:', error)
        return NextResponse.json({ error: 'Đã có lỗi xảy ra' }, { status: 500 })
    }
}
