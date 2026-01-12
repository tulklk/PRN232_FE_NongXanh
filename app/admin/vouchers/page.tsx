'use client'

import { useState } from 'react'
import { Plus, Copy, Edit, Trash2 } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { mockVouchers } from '@/data/admin'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function VouchersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'public' | 'hidden'>('all')
  const [voucherList] = useState(mockVouchers)

  const filteredVouchers = voucherList.filter((voucher) => {
    const matchesSearch =
      voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || voucher.status === filter
    return matchesSearch && matchesFilter
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // Could add toast notification here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QUẢN LÝ KHUYẾN MÃI</h1>
          <p className="text-gray-600">
            Mã giảm giá - Danh sách mã giảm giá đang áp dụng cho cửa hàng.
          </p>
        </div>
        <button className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2">
          <Plus size={20} />
          Tạo mã giảm giá
        </button>
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
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('public')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'public'
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang public
            </button>
            <button
              onClick={() => setFilter('hidden')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'hidden'
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang ẩn
            </button>
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Mã</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Loại giảm</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Giá trị</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Đơn tối thiểu</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tối đa giảm</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Hiệu lực</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((voucher) => (
                <tr key={voucher.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{voucher.code}</span>
                      <button
                        onClick={() => handleCopyCode(voucher.code)}
                        className="p-1 text-gray-400 hover:text-primary-green transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{voucher.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">
                      {voucher.type === 'amount' ? '% Amount' : '% Percent'}
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
                    <span className="text-gray-600">-</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">-</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      <div>
                        Từ:{' '}
                        {formatDate(voucher.validFrom)
                          .replace(/\//g, ' tháng ')
                          .replace(/(\d{2})\/(\d{4})/, '$1, $2')}
                      </div>
                      <div>
                        Đến:{' '}
                        {formatDate(voucher.validTo)
                          .replace(/\//g, ' tháng ')
                          .replace(/(\d{2})\/(\d{4})/, '$2')}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={voucher.status}>
                      {voucher.status === 'public' ? 'Đang public' : 'Đang ẩn'}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
