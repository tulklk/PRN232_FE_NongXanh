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
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  const getPaginationItems = () => {
    const safeTotal = Math.max(1, totalPages)
    const cur = Math.min(Math.max(1, pageNumber), safeTotal)
    const range = 2

    const pageSet = new Set<number>()
    pageSet.add(1)
    pageSet.add(safeTotal)
    for (let p = cur - range; p <= cur + range; p++) {
      if (p >= 1 && p <= safeTotal) pageSet.add(p)
    }

    const sortedPages = Array.from(pageSet).sort((a, b) => a - b)
    const items: Array<number | '...'> = []
    for (let i = 0; i < sortedPages.length; i++) {
      const p = sortedPages[i]
      const prev = sortedPages[i - 1]
      if (i > 0 && prev != null && p - prev > 1) items.push('...')
      items.push(p)
    }
    return items
  }

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    getOrders(pageNumber, pageSize, tokens.idToken)
      .then((res) => {
        setOrders(res.items ?? [])
        const fallbackTotalPages = Math.ceil(
          (res.totalCount ?? res.items?.length ?? 0) / pageSize
        )
        const computedTotalPages = res.totalPages ?? fallbackTotalPages ?? 1
        setTotalPages(computedTotalPages || 1)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [isAuthenticated, tokens?.idToken, pageNumber])

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
      pending: 'Đang xử lý',
      processing: 'Đang xử lý',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      shipped: 'Đang giao',
      delivered: 'Đã nhận hàng',
      cancelled: 'Đã hủy',
    }
    const key = (status ?? '').toLowerCase()
    return labels[key] ?? status ?? '—'
  }

  const getPaymentLabel = (status?: string | null) => {
    const labels: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
      notapplicable: 'Chưa thanh toán',
    }
    const key = (status ?? '').toLowerCase()
    return labels[key] ?? status ?? '—'
  }

  const mapStatusForBadge = (status?: string | null) => {
    const map: Record<string, 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'> = {
      pending: 'processing',
      processing: 'processing',
      confirmed: 'confirmed',
      shipping: 'shipped',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    }
    const key = (status ?? '').toLowerCase()
    return map[key] ?? 'processing'
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
          onChange={(v) => {
            setPageNumber(1)
            setSearchQuery(v)
          }}
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

        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber === 1}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang trước
            </button>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {getPaginationItems().map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                      ...
                    </span>
                  )
                }
                const p = item
                const isActive = p === pageNumber
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPageNumber(p)}
                    disabled={isActive}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isActive
                        ? 'bg-primary-green text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              disabled={pageNumber === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
