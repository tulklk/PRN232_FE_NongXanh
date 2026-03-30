'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { getOrders } from '@/lib/api/orders'
import type { ApiOrder } from '@/lib/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getOrderStatusLabel, getVnPayStatusLabel } from '@/lib/orderDisplay'

export default function OrdersPage() {
  const { tokens, isAuthenticated } = useUser()
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        const res = await getOrders(1, 20, tokens.idToken)
        setOrders(res.items ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải đơn hàng')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isAuthenticated, tokens?.idToken])

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
        <p className="text-base text-gray-500 text-center py-10 sm:py-14">
          Vui lòng đăng nhập để xem đơn hàng
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
        <p className="text-base text-gray-500 text-center py-10 sm:py-14">
          Đang tải đơn hàng...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
        <p className="text-base text-red-600 text-center py-10 sm:py-14">{error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-center py-10 sm:py-14">
          <p className="text-base text-gray-500">
            Bạn chưa đặt bất kỳ đơn đặt hàng nào.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
      <h2 className="text-base font-bold text-gray-900 mb-5">Đơn hàng của tôi</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.orderId}
            href={`/account/orders/${order.orderId}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-primary-green transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-sm">
                <span className="font-semibold text-gray-900">
                  Đơn hàng #{order.orderNumber ?? order.orderId}
                </span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-sm text-gray-600">
                  {formatDate(order.orderDate)}
                </span>
              </div>
              <div className="text-right text-sm space-y-1.5">
                <div className="font-bold text-primary-green">
                  {formatCurrency(order.finalAmount)}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  <span
                    className={
                      (order.status ?? '').trim().toLowerCase() === 'cancelled'
                        ? 'px-2 py-0.5 rounded text-xs bg-red-50 text-red-700 border border-red-100'
                        : 'px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700'
                    }
                    title="Trạng thái đơn hàng"
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-100"
                    title="Trạng thái thanh toán "
                  >
                    {getVnPayStatusLabel(order.vnPayStatus)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
