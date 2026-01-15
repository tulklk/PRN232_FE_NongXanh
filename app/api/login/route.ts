import { NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        // STEP 1: Lấy idToken từ DevAuth
        const devAuthRes = await fetch(
            `${API_BASE_URL}/api/DevAuth/firebase-token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            }
        )

        if (!devAuthRes.ok) {
            return NextResponse.json({ error: 'Sai email hoặc mật khẩu' }, { status: 401 })
        }

        const devAuthData = await devAuthRes.json()
        const idToken = devAuthData.idToken

        if (!idToken) {
            return NextResponse.json({ error: 'Không lấy được idToken' }, { status: 400 })
        }

        // STEP 2: Xác thực với backend
        const authRes = await fetch(
            `${API_BASE_URL}/api/Auth/firebase-login`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            }
        )

        if (!authRes.ok) {
            return NextResponse.json({ error: 'Xác thực backend thất bại' }, { status: 401 })
        }

        const authData = await authRes.json()
        return NextResponse.json(authData)

    } catch (error: any) {
        console.error('Login API error:', error)
        return NextResponse.json({ error: 'Đã có lỗi xảy ra' }, { status: 500 })
    }
} 