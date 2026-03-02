import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const pageNumber = searchParams.get('pageNumber') || '1'
        const pageSize = searchParams.get('pageSize') || '10'
        const categoryId = searchParams.get('categoryId')

        let url = `${API_BASE_URL}/api/Products?pageNumber=${pageNumber}&pageSize=${pageSize}`
        if (categoryId) {
            url += `&categoryId=${categoryId}`
        }
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 60 },
        })

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            return NextResponse.json(
                { error: errorData.message || 'Không thể tải sản phẩm' },
                { status: res.status }
            )
        }

        const data = await res.json()
        return NextResponse.json(data)
    } catch (error: unknown) {
        console.error('Products API error:', error)
        return NextResponse.json(
            { error: 'Đã có lỗi xảy ra khi tải sản phẩm' },
            { status: 500 }
        )
    }
}
