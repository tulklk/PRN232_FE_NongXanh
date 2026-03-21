'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { getOrderById, updateOrderStatus } from '@/lib/api/orders'
import type { ApiOrder } from '@/lib/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { tokens, isAuthenticated, isLoading: authLoading } = useUser()
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextStatus, setNextStatus] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  const getAllowedNextStatuses = (status?: string | null): string[] => {
    const s = (status ?? '').toLowerCase()
    if (s === 'pending' || s === 'processing') return ['confirmed', 'cancelled']
    if (s === 'confirmed') return ['shipped', 'cancelled']
    if (s === 'shipped') return ['delivered']
    return []
  }

  const getStatusLabel = (status?: string | null) => {
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      confirmed: 'Đã xác nhận',
      shipped: 'Đã giao hàng',
      delivered: 'Đã nhận hàng',
      cancelled: 'Đã hủy',
    }
    return labels[(status ?? '').toLowerCase()] ?? status ?? '—'
  }

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !tokens?.idToken || !id) {
      setLoading(false)
      return
    }
    getOrderById(id, tokens.idToken)
      .then((data) => {
        setOrder(data)
        const allowed = getAllowedNextStatuses(data?.status)
        setNextStatus(allowed[0] ?? '')
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : 'Không thể tải đơn hàng'
        )
      )
      .finally(() => setLoading(false))
  }, [authLoading, isAuthenticated, tokens?.idToken, id])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-center py-14 text-gray-500">Đang xác thực...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const allowedNextStatuses = getAllowedNextStatuses(order?.status)
  const isStatusLocked = allowedNextStatuses.length === 0

  const handleUpdateStatus = async () => {
    if (!order || !tokens?.idToken || !nextStatus) return
    setUpdatingStatus(true)
    setStatusError(null)
    setStatusSuccess(null)

    try {
      const updated = await updateOrderStatus(
        order.orderId,
        {
          status: nextStatus,
          shippingAddress: order.shippingAddress ?? undefined,
          vnPayStatus: order.vnPayStatus ?? undefined,
        },
        tokens.idToken
      )

      setOrder((prev) => {
        if (!prev) return updated
        return {
          ...prev,
          ...updated,
          // Một số response PUT chỉ trả về vài field, giữ lại dữ liệu cũ nếu thiếu
          orderDate: updated.orderDate ?? prev.orderDate,
          orderDetails: updated.orderDetails ?? prev.orderDetails,
          customerDisplayName:
            updated.customerDisplayName ?? prev.customerDisplayName,
          customerEmail: updated.customerEmail ?? prev.customerEmail,
          customerPhoneNumber:
            updated.customerPhoneNumber ?? prev.customerPhoneNumber,
        }
      })
      const nextAllowed = getAllowedNextStatuses(updated.status ?? order.status)
      setNextStatus(nextAllowed[0] ?? '')
      setStatusSuccess('Cập nhật trạng thái đơn hàng thành công.')
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái đơn hàng'
      )
    } finally {
      setUpdatingStatus(false)
    }
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
        <p className="text-center py-14 text-red-600">
          {error ?? 'Không tìm thấy đơn hàng'}
        </p>
        <Link
          href="/admin/orders"
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
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
      >
        <ArrowLeft size={20} />
        Quay lại danh sách đơn hàng
      </Link>

      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Đơn hàng #{order.orderNumber ?? order.orderId}
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
        {(order.customerDisplayName ||
          order.displayName ||
          order.customerEmail ||
          order.customerPhoneNumber) && (
          <div className="text-sm">
            <h3 className="font-semibold text-gray-900 mb-1">
              Thông tin khách hàng
            </h3>
            {(order.customerDisplayName || order.displayName) && (
              <div className="flex justify-between">
                <span className="text-gray-500 mr-2">Họ tên:</span>
                <span className="font-medium">
                  {order.customerDisplayName ?? order.displayName}
                </span>
              </div>
            )}
            {order.customerEmail && (
              <div className="flex justify-between">
                <span className="text-gray-500 mr-2">Email:</span>
                <span className="font-medium break-all">
                  {order.customerEmail}
                </span>
              </div>
            )}
            {order.customerPhoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500 mr-2">Số điện thoại:</span>
                <span className="font-medium">
                  {order.customerPhoneNumber}
                </span>
              </div>
            )}
          </div>
        )}
        {order.shippingAddress && (
          <div className="text-sm">
            <span className="text-gray-500">Địa chỉ giao hàng:</span>
            <p className="mt-1 text-gray-900">{order.shippingAddress}</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-900 mb-3">Chi tiết sản phẩm</h3>
        <div className="space-y-3">
          {order.orderDetails?.map((detail) => {
            const raw = detail as unknown as Record<string, unknown>
            const imageUrl =
              (raw.productImageUrl ??
                raw.ProductImageUrl ??
                raw.imageUrl ??
                raw.ImageUrl) as string | undefined
            const productName = (raw.productName ??
              raw.ProductName ??
              detail.variantName ??
              'Sản phẩm') as string
            const imageSrc =
              imageUrl && imageUrl.startsWith('http')
                ? imageUrl
                : '/images/logo.png'

            return (
              <div
                key={detail.orderDetailId}
                className="flex gap-3 items-center py-3 border-b border-gray-100"
              >
                <div className="relative w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={productName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{productName}</p>
                  <p className="text-sm text-gray-500">
                    {detail.variantName && `${detail.variantName} • `}x
                    {detail.quantity}
                  </p>
                </div>
                <span className="font-semibold text-primary-green flex-shrink-0">
                  {formatCurrency(detail.subTotal)}
                </span>
              </div>
            )
          })}
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
              <span className="text-red-500">
                -{formatCurrency(order.discountAmount)}
              </span>
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

      <div className="border-t border-gray-200 pt-4 mt-6">
        <h3 className="font-semibold text-gray-900 mb-3">Cập nhật trạng thái</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Trạng thái hiện tại
            </label>
            <p className="font-medium text-gray-900">{getStatusLabel(order.status)}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Chuyển sang
            </label>
            <select
              value={nextStatus}
              onChange={(e) => {
                setNextStatus(e.target.value)
                setStatusError(null)
                setStatusSuccess(null)
              }}
              disabled={isStatusLocked || updatingStatus}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-60"
            >
              {isStatusLocked ? (
                <option value="">Đơn hàng đã hoàn tất / đã hủy</option>
              ) : (
                allowedNextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={isStatusLocked || updatingStatus || !nextStatus}
              className="w-full md:w-auto px-4 py-2 bg-primary-green text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingStatus ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </div>
        {statusError && <p className="mt-3 text-sm text-red-600">{statusError}</p>}
        {statusSuccess && (
          <p className="mt-3 text-sm text-green-600">{statusSuccess}</p>
        )}
      </div>
    </div>
  )
}

