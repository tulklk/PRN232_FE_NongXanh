'use client'

import { useState } from 'react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { mockOrders } from '@/data/admin'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function StaffOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [orderList] = useState(mockOrders)

  const filteredOrders = orderList.filter(
    (order) =>
      order.orderNumber.includes(searchQuery) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.total.toString().includes(searchQuery)
  )

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      processing: 'Đang xử lý',
      confirmed: 'Đã xác nhận',
      shipped: 'Đã giao hàng',
      delivered: 'Đã nhận hàng',
      cancelled: 'Đã hủy',
    }
    return labels[status] || status
  }

  const getPaymentLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đơn hàng</h1>
        <p className="text-gray-600">Tìm kiếm và quản lý tất cả đơn hàng trong hệ thống</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">TÌM KIẾM ĐƠN HÀNG</h2>
        <SearchBar
          placeholder="Tìm theo mã đơn, khách hàng hoặc tổng tiền"
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Mã đơn hàng</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Khách hàng</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tổng tiền</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Thanh toán</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ngày tạo</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{order.orderNumber}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={order.status as 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'}>
                      {getStatusLabel(order.status)}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={order.paymentStatus === 'paid' ? 'paid' : 'pending'}
                    >
                      {getPaymentLabel(order.paymentStatus)}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">
                      {formatDate(order.createdAt)
                        .replace(/\//g, ' tháng ')
                        .replace(/(\d{2})\/(\d{4})/, '$1, $2')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-2 bg-[#0A923C] text-white rounded-lg hover:bg-[#10723A] transition-colors text-sm font-semibold">
                        Xem
                      </button>
                      <button className="px-3 py-2 bg-[#10723A] text-white rounded-lg hover:bg-[#0A923C] transition-colors text-sm font-semibold">
                        Cập nhật
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
