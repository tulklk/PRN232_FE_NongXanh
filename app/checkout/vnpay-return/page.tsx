'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { CheckCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { createVNPayPaymentUrl } from '@/lib/api/payments'

function VnpayReturnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tokens } = useUser()
  const [retryLoading, setRetryLoading] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  const responseCode = searchParams.get('vnp_ResponseCode')
  const orderId = searchParams.get('orderId') ?? searchParams.get('vnp_TxnRef')
  const orderNumber =
    searchParams.get('orderNumber') ??
    searchParams.get('vnp_OrderInfo') ??
    searchParams.get('vnp_TxnRef')

  const isSuccess = responseCode === '00'
  const hasParams = typeof responseCode === 'string'
  const canRetry = Boolean(orderId && tokens?.idToken)

  const handleRetryVNPay = async () => {
    if (!orderId || !tokens?.idToken) return
    setRetryError(null)
    setRetryLoading(true)
    try {
      const { paymentUrl } = await createVNPayPaymentUrl(
        { orderId: String(orderId), clientIp: '' },
        tokens.idToken
      )
      window.location.href = paymentUrl
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Không thể tạo link thanh toán')
      setRetryLoading(false)
    }
  }

  useEffect(() => {
    if (!hasParams) return
    if (isSuccess && orderId) {
      const q = new URLSearchParams()
      q.set('orderId', orderId)
      if (orderNumber) q.set('orderNumber', orderNumber)
      q.set('payment', 'vnpay')
      router.replace(`/checkout/success?${q.toString()}`)
    }
  }, [hasParams, isSuccess, orderId, orderNumber, router])

  if (!hasParams) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
          <div className="max-w-lg mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-6">
              Không có thông tin thanh toán. Vui lòng quay lại trang thanh toán.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center gap-2 bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark"
              >
                <ArrowLeft size={20} />
                Quay lại thanh toán
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <p className="text-gray-600">Đang chuyển đến trang xác nhận đơn hàng...</p>
          {!orderId && (
            <Link
              href="/checkout/success"
              className="mt-4 inline-block text-primary-green font-semibold hover:underline"
            >
              Nhấn vào đây nếu không tự chuyển
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-lg mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-amber-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Bạn đã hủy thanh toán
          </h1>
          <p className="text-gray-600 mb-6">
            Giao dịch VNPay đã được hủy. Bạn có thể thanh toán lại đơn hàng bằng
            VNPay hoặc quay lại trang thanh toán để chọn phương thức khác.
          </p>
          {retryError && (
            <p className="text-red-600 text-sm mb-4">{retryError}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canRetry && (
              <button
                type="button"
                onClick={handleRetryVNPay}
                disabled={retryLoading}
                className="inline-flex items-center justify-center gap-2 bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retryLoading ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Đang tạo link...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Thanh toán lại bằng VNPay
                  </>
                )}
              </button>
            )}
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              <ArrowLeft size={20} />
              Quay lại thanh toán
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Về trang chủ
            </Link>
          </div>
          {!canRetry && orderId && (
            <p className="text-sm text-gray-500 mt-4">
              Đăng nhập để sử dụng thanh toán lại bằng VNPay.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VnpayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Đang xử lý...</p>
        </div>
      }
    >
      <VnpayReturnContent />
    </Suspense>
  )
}
