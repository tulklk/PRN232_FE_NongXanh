import { NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

/**
 * Format phone number to E.164 format (+84...)
 * Handles Vietnamese phone numbers:
 * - 0906337965 -> +84906337965
 * - 0906 337 965 -> +84906337965
 * - +84906337965 -> +84906337965 (already formatted)
 * - 84906337965 -> +84906337965
 */
function formatPhoneToE164(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '')
    
    // If already starts with +84, return as is
    if (cleaned.startsWith('+84')) {
        return cleaned
    }
    
    // If starts with 84 (without +), add +
    if (cleaned.startsWith('84')) {
        return '+' + cleaned
    }
    
    // If starts with 0, replace with +84
    if (cleaned.startsWith('0')) {
        return '+84' + cleaned.substring(1)
    }
    
    // Default: assume it's a Vietnamese number starting with 0
    // If no leading 0, add +84 prefix
    return '+84' + cleaned
}

export async function POST(request: Request) {
    try {
        const { email, password, confirmPassword, displayName, phoneNumber } = await request.json()

        // Validate required fields
        if (!email || !password || !displayName || !phoneNumber) {
            return NextResponse.json(
                { error: 'Vui lòng điền đầy đủ thông tin' },
                { status: 400 }
            )
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'Mật khẩu xác nhận không khớp' },
                { status: 400 }
            )
        }

        // Format phone number to E.164 format before sending to backend
        const formattedPhoneNumber = formatPhoneToE164(phoneNumber)

        // Call backend register API
        const registerRes = await fetch(
            `${API_BASE_URL}/api/auth/register`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    confirmPassword,
                    displayName,
                    phoneNumber: formattedPhoneNumber,
                }),
            }
        )

        const data = (await registerRes.json().catch(() => ({}))) as { message?: string; email?: string }

        // 202 = OTP sent to email for verification
        if (registerRes.status === 202) {
            return NextResponse.json({
                success: true,
                otpSent: true,
                message: data.message || 'Mã OTP đã được gửi đến email của bạn',
                email: data.email || email,
            }, { status: 202 })
        }

        if (!registerRes.ok) {
            return NextResponse.json(
                { error: data.message || 'Đăng ký thất bại' },
                { status: registerRes.status }
            )
        }

        return NextResponse.json({ success: true, message: 'Đăng ký thành công' })

    } catch (error: unknown) {
        console.error('Register API error:', error)
        return NextResponse.json(
            { error: 'Đã có lỗi xảy ra' },
            { status: 500 }
        )
    }
}
