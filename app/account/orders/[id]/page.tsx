'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { getOrderById } from '@/lib/api/orders'
import type { ApiOrder } from '@/lib/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { tokens, isAuthenticated } = useUser()
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken || !id) {
      setLoading(false)
      return
    }
    getOrderById(id, tokens.idToken)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải đơn hàng'))
      .finally(() => setLoading(false))
  }, [isAuthenticated, tokens?.idToken, id])

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-center py-14 text-gray-500">Đang tải đơn hàng...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-center py-14 text-red-600">{error ?? 'Không tìm thấy đơn hàng'}</p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-primary-green hover:underline"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
      >
        <ArrowLeft size={20} />
        Quay lại đơn hàng
      </Link>

      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Đơn hàng #{order.orderId}
      </h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ngày đặt:</span>
          <span>{formatDate(order.orderDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Trạng thái:</span>
          <span className="font-medium">{order.status ?? '—'}</span>
        </div>
        {order.shippingAddress && (
          <div className="text-sm">
            <span className="text-gray-500">Địa chỉ giao hàng:</span>
            <p className="mt-1 text-gray-900">{order.shippingAddress}</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-900 mb-3">Chi tiết sản phẩm</h3>
        <div className="space-y-2">
          {order.orderDetails?.map((detail) => (
            <div
              key={detail.orderDetailId}
              className="flex justify-between items-center py-2 border-b border-gray-100"
            >
              <div>
                <span className="font-medium">{detail.variantName ?? 'Sản phẩm'}</span>
                <span className="text-gray-500 text-sm ml-2">x{detail.quantity}</span>
              </div>
              <span className="font-semibold text-primary-green">
                {formatCurrency(detail.subTotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Tạm tính:</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phí vận chuyển:</span>
            <span>{formatCurrency(order.shippingFee)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Giảm giá:</span>
              <span className="text-red-500">-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2">
            <span>Tổng cộng:</span>
            <span className="text-primary-green">
              {formatCurrency(order.finalAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
