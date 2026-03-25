'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

function VnpayReturnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const responseCode = searchParams.get('vnp_ResponseCode')
  const orderId = searchParams.get('orderId') ?? searchParams.get('vnp_TxnRef')
  const orderNumber =
    searchParams.get('orderNumber') ??
    searchParams.get('vnp_OrderInfo') ??
    searchParams.get('vnp_TxnRef')

  const isSuccess = responseCode === '00'
  const hasParams = typeof responseCode === 'string'

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
          <div className="max-w-xl mx-auto bg-white rounded-lg border border-gray-200 p-10 text-center">
            <p className="text-gray-600 mb-8">
              Không có thông tin thanh toán. Vui lòng về trang chủ để tiếp tục mua sắm.
            </p>
            <div className="flex justify-center">
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
        <div className="max-w-xl mx-auto bg-white rounded-lg border border-gray-200 p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <XCircle size={48} className="text-amber-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Bạn đã hủy thanh toán
          </h1>
          <p className="text-gray-600 mb-8">
            Giao dịch VNPay đã được hủy. Vui lòng về trang chủ để tiếp tục mua sắm.
          </p>
          <div className="flex justify-center">
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
