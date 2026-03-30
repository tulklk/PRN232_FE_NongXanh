'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { cancelOrder, getOrderById } from '@/lib/api/orders'
import type { ApiOrder } from '@/lib/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getOrderStatusLabel, getVnPayStatusLabel } from '@/lib/orderDisplay'
import ReviewModal from '@/components/reviews/ReviewModal'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { tokens, isAuthenticated } = useUser()
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeReview, setActiveReview] = useState<{
    productId: string
    productName: string
  } | null>(null)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(
    () => new Set()
  )
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const isDelivered = useMemo(() => {
    const s = (order?.status ?? '').trim().toLowerCase()
    return s === 'delivered' || s === 'shipping' || s === 'shipped'
  }, [order?.status])

  const isPending = useMemo(() => {
    const s = (order?.status ?? '').trim().toLowerCase()
    return s === 'pending'
  }, [order?.status])

  async function handleCancelOrder() {
    if (!tokens?.idToken || !id || !isPending) return
    const ok = window.confirm(
      'Bạn có chắc muốn hủy đơn hàng này? Thao tác không thể hoàn tác.'
    )
    if (!ok) return
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelOrder(id, tokens.idToken)
      const updated = await getOrderById(id, tokens.idToken)
      if (updated) setOrder(updated)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Không thể hủy đơn hàng')
    } finally {
      setCancelling(false)
    }
  }

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
        Đơn hàng #{order.orderNumber ?? order.orderId}
      </h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Ngày đặt:</span>
          <span>{formatDate(order.orderDate)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Trạng thái đơn hàng:</span>
          <span className="font-medium">{getOrderStatusLabel(order.status)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Trạng thái thanh toán:</span>
          <span className="font-medium">{getVnPayStatusLabel(order.vnPayStatus)}</span>
        </div>
        {(order.customerDisplayName || order.displayName || order.customerEmail || order.customerPhoneNumber) && (
          <div className="text-sm">
            <h3 className="font-semibold text-gray-900 mb-1">Thông tin khách hàng</h3>
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
                <span className="font-medium break-all">{order.customerEmail}</span>
              </div>
            )}
            {order.customerPhoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500 mr-2">Số điện thoại:</span>
                <span className="font-medium">{order.customerPhoneNumber}</span>
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
              (raw.productImageUrl ?? raw.ProductImageUrl ?? raw.imageUrl ?? raw.ImageUrl) as
              | string
              | undefined
            const productName =
              (raw.productName ?? raw.ProductName ?? detail.variantName ?? 'Sản phẩm') as string
            const productIdRaw = (raw.productId ??
              raw.ProductId ??
              detail.productId) as string | number | null | undefined
            const productId = productIdRaw != null ? String(productIdRaw) : null
            const imageSrc = imageUrl?.startsWith('http') ? imageUrl : '/images/logo.png'
            const canReview =
              isDelivered &&
              !!productId &&
              !reviewedProductIds.has(productId)
            return (
              <div
                key={detail.orderDetailId}
                className="flex gap-3 items-center py-3 border-b border-gray-100"
              >
                <div className="relative w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  <Image
                    src={imageSrc}
                    alt={productName}
                    fill
                    className="object-cover rounded-lg"
                    sizes="56px"
                    unoptimized={imageSrc.startsWith('http')}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{productName}</p>
                  <p className="text-sm text-gray-500">
                    {detail.variantName && `${detail.variantName} • `}x{detail.quantity}
                  </p>
                  {isDelivered && (
                    <div className="mt-2">
                      {productId ? (
                        <button
                          type="button"
                          onClick={() =>
                            canReview &&
                            setActiveReview({ productId, productName })
                          }
                          disabled={!canReview}
                          className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            canReview
                              ? 'bg-[#0A923C] text-white hover:bg-[#087a32]'
                              : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {reviewedProductIds.has(productId)
                            ? 'Đã đánh giá'
                            : 'Đánh giá'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Không thể đánh giá sản phẩm này.
                        </span>
                      )}
                    </div>
                  )}
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
              <span className="text-red-500">-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2">
            <span>Tổng cộng:</span>
            <span className="text-primary-green">
              {formatCurrency(order.finalAmount)}
            </span>
          </div>
          {isPending && (
            <div className="pt-4 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full sm:w-auto rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
              {cancelError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {cancelError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {activeReview && (
        <ReviewModal
          open={true}
          productId={activeReview.productId}
          productName={activeReview.productName}
          onClose={() => setActiveReview(null)}
          onSubmitted={() => {
            setReviewedProductIds((prev) => {
              const next = new Set(prev)
              next.add(activeReview.productId)
              return next
            })
          }}
        />
      )}
    </div>
  )
}
