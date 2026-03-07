'use client'

import { useState, useEffect } from 'react'
import { Copy, Eye, Lock } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'
import { getVouchers } from '@/lib/api/vouchers'

interface Voucher {
    id: string
    code: string
    name: string
    description: string
    type: 'amount' | 'percent'
    value: number
    minOrderValue: number
    maxDiscount: number
    quantity: number
    validFrom: string
    validTo: string
    status: 'public' | 'hidden'
}

export default function StaffVouchersPage() {
    const { tokens } = useUser()
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'public' | 'hidden'>('all')
    const [voucherList, setVoucherList] = useState<Voucher[]>([])
    const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                setLoading(true)
                if (!tokens?.idToken) return

                const data = await getVouchers(1, 100, tokens.idToken)

                const mappedVouchers: Voucher[] = (data || []).map((item: any) => ({
                    id: item.voucherId,
                    code: item.code,
                    name: item.code,
                    description: item.description || '',
                    type: item.discountType === 'Fixed' ? 'amount' : 'percent',
                    value: item.discountValue,
                    minOrderValue: item.minOrderValue || 0,
                    maxDiscount: item.maxDiscount || 0,
                    quantity: item.quantity || 0,
                    validFrom: item.startDate,
                    validTo: item.endDate,
                    status: item.status === 'Active' ? 'public' : 'hidden'
                }))

                setVoucherList(mappedVouchers)
                setError(null)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định'
                setError(errorMessage)
                setVoucherList([])
            } finally {
                setLoading(false)
            }
        }

        fetchVouchers()
    }, [tokens])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-gray-600">Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-red-600">Lỗi: {error}</p>
            </div>
        )
    }

    const filteredVouchers = voucherList.filter((voucher) => {
        const matchesSearch =
            voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            voucher.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filter === 'all' || voucher.status === filter
        return matchesSearch && matchesFilter
    })

    const getSelectedVoucherData = () => {
        return voucherList.find((v) => v.id === selectedVoucher)
    }

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
        // Could add toast notification here
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">DANH SÁCH KHUYẾN MÃI</h1>
                    <p className="text-gray-600">
                        Mã giảm giá - Xem danh sách mã giảm giá đang áp dụng cho cửa hàng.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-500">
                    <Lock size={18} />
                    <span className="text-sm">Chỉ Admin có quyền tạo/sửa voucher</span>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">TÌM KIẾM VOUCHER</h2>
                <div className="space-y-4">
                    <SearchBar
                        placeholder="Tìm theo mã, tên voucher..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'all'
                                    ? 'bg-[#0A923C] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setFilter('public')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'public'
                                    ? 'bg-[#0A923C] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Đang public
                        </button>
                        <button
                            onClick={() => setFilter('hidden')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filter === 'hidden'
                                    ? 'bg-[#0A923C] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Đang ẩn
                        </button>
                    </div>
                </div>
            </div>

            {/* Vouchers Table & Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Danh sách vouchers ({filteredVouchers.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Mã</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Mô tả</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Loại giảm</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Giá trị</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVouchers.map((voucher) => (
                                    <tr
                                        key={voucher.id}
                                        className={`border-b hover:bg-gray-50 cursor-pointer ${selectedVoucher === voucher.id ? 'bg-green-50' : ''
                                            }`}
                                        onClick={() => setSelectedVoucher(voucher.id)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{voucher.code}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleCopyCode(voucher.code)
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-[#0A923C] transition-colors"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-600 text-sm line-clamp-1">{voucher.description}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-600">
                                                {voucher.type === 'amount' ? 'Cố định' : 'Phần trăm'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-semibold text-gray-900">
                                                {voucher.type === 'amount'
                                                    ? formatCurrency(voucher.value)
                                                    : `${voucher.value}%`}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={voucher.status === 'public' ? 'paid' : 'pending'}>
                                                {voucher.status === 'public' ? 'Đang public' : 'Đang ẩn'}
                                            </StatusBadge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedVoucher(voucher.id)
                                                    }}
                                                    className="p-2 text-gray-600 hover:text-[#0A923C] hover:bg-green-50 rounded transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Chi tiết voucher</h2>
                    {selectedVoucher ? (
                        (() => {
                            const voucher = getSelectedVoucherData()
                            if (!voucher) return null

                            return (
                                <div className="space-y-4">
                                    <div className="text-center pb-4 border-b">
                                        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <span className="text-xl font-bold text-[#0A923C]">{voucher.code.charAt(0)}</span>
                                        </div>
                                        <h3 className="font-bold text-lg">{voucher.code}</h3>
                                        <StatusBadge status={voucher.status === 'public' ? 'paid' : 'pending'}>
                                            {voucher.status === 'public' ? 'Đang public' : 'Đang ẩn'}
                                        </StatusBadge>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div>
                                            <p className="font-semibold text-gray-900">Mô tả</p>
                                            <p>{voucher.description}</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">Loại giảm</p>
                                            <p>{voucher.type === 'amount' ? 'Giảm cố định' : 'Giảm phần trăm'}</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">Giá trị</p>
                                            <p className="font-bold text-[#0A923C]">
                                                {voucher.type === 'amount'
                                                    ? formatCurrency(voucher.value)
                                                    : `${voucher.value}%`}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">Đơn tối thiểu</p>
                                            <p>{formatCurrency(voucher.minOrderValue)}</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">Tối đa giảm</p>
                                            <p>{formatCurrency(voucher.maxDiscount)}</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">Hiệu lực</p>
                                            <p>Từ: {formatDate(voucher.validFrom)}</p>
                                            <p>Đến: {formatDate(voucher.validTo)}</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">Số lượng</p>
                                            <p>{voucher.quantity}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Chọn một voucher để xem chi tiết
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
