import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const res = await fetch(`${API_BASE_URL}/api/Products/${id}`, {
            headers: { Accept: 'application/json' },
        })

        if (!res.ok) {
            if (res.status === 404) {
                return NextResponse.json(
                    { error: 'Không tìm thấy sản phẩm' },
                    { status: 404 }
                )
            }
            const errorData = await res.json().catch(() => ({}))
            return NextResponse.json(
                { error: errorData.message || 'Không thể tải chi tiết sản phẩm' },
                { status: res.status }
            )
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Product detail API error:', error)
        return NextResponse.json(
            { error: 'Đã có lỗi xảy ra khi tải chi tiết sản phẩm' },
            { status: 500 }
        )
    }
}
