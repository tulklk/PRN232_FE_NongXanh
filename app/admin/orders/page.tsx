'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { useUser } from '@/contexts/UserContext'
import { getOrders } from '@/lib/api/orders'
import type { ApiOrder } from '@/lib/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrdersPage() {
  const { tokens, isAuthenticated } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    getOrders(1, 30, tokens.idToken)
      .then((res) => setOrders(res.items ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [isAuthenticated, tokens?.idToken])

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true

    return (
      String(order.orderId).includes(q) ||
      String(order.orderNumber ?? '').toLowerCase().includes(q) ||
      order.userId?.toLowerCase().includes(q) ||
      order.displayName?.toLowerCase().includes(q) ||
      order.customerDisplayName?.toLowerCase().includes(q) ||
      String(order.finalAmount).includes(q) ||
      (order.shippingAddress?.toLowerCase().includes(q) ?? false)
    )
  })

  const getStatusLabel = (status?: string | null) => {
    const labels: Record<string, string> = {
      processing: 'Đang xử lý',
      confirmed: 'Đã xác nhận',
      shipped: 'Đã giao hàng',
      delivered: 'Đã nhận hàng',
      cancelled: 'Đã hủy',
    }
    return labels[status ?? ''] ?? status ?? '—'
  }

  const getPaymentLabel = (status?: string | null) => {
    const labels: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
    }
    return labels[status ?? ''] ?? status ?? '—'
  }

  const mapStatusForBadge = (status?: string | null) => {
    const map: Record<string, 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'> = {
      processing: 'processing',
      confirmed: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    }
    return map[status ?? ''] ?? 'processing'
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
          placeholder="Tìm theo mã đơn, userId, địa chỉ hoặc tổng tiền"
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {loading ? (
          <p className="py-8 text-center text-gray-500">Đang tải đơn hàng...</p>
        ) : (
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
                  <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">#{order.orderNumber ?? order.orderId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {order.customerDisplayName ??
                          order.displayName ??
                          order.userId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(order.finalAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={mapStatusForBadge(order.status)}>
                        {getStatusLabel(order.status)}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={order.vnPayStatus === 'paid' ? 'paid' : 'pending'}
                      >
                        {getPaymentLabel(order.vnPayStatus)}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{formatDate(order.orderDate)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end">
                        <a
                          href={`/admin/orders/${order.orderId}`}
                          className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition-colors text-sm font-semibold"
                        >
                          Xem
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredOrders.length === 0 && (
          <p className="py-8 text-center text-gray-500">Không có đơn hàng nào</p>
        )}
      </div>
    </div>
  )
}
