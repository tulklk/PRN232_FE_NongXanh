'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { CheckCircle, Package, CreditCard } from 'lucide-react'
import ProductGrid from '@/components/products/ProductGrid'
import { products } from '@/data/products'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const orderNumber = searchParams.get('orderNumber')
  const payment = searchParams.get('payment')
  const isVNPay = payment === 'vnpay'
  const displayCode = orderNumber || orderId
  const similarProducts = products.slice(0, 5)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Success Message */}
        <div className={`max-w-2xl mx-auto bg-white rounded-xl border-2 p-8 sm:p-12 text-center mb-10 sm:mb-12 shadow-sm ${isVNPay ? 'border-[#0A923C]' : 'border-blue-500'}`}>
          <div className="flex justify-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isVNPay ? 'bg-[#0A923C]/10' : 'bg-green-100'}`}>
              <CheckCircle size={52} className={isVNPay ? 'text-[#0A923C]' : 'text-green-500'} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">THANH TOÁN THÀNH CÔNG</h1>
          {isVNPay && (
            <p className="text-[#0A923C] font-semibold mb-4 flex items-center justify-center gap-2">
              <CreditCard size={20} />
              Thanh toán qua VNPay đã hoàn tất
            </p>
          )}
          <p className="text-gray-600 mb-8">
            Cảm ơn bạn đã mua sắm tại Nông Xanh. Đơn hàng của bạn đã được xác nhận và sẽ được xử
            lý sớm nhất.
            {displayCode && (
              <span className="block mt-2 font-semibold text-gray-900">
                Mã đơn hàng: #{displayCode}
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/account/orders"
              className="bg-primary-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
            >
              <Package size={20} />
              THEO DÕI ĐƠN HÀNG
            </Link>
            <Link
              href="/products"
              className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              TIẾP TỤC MUA SẮM
            </Link>
          </div>
        </div>

        {/* Similar Products */}
        <section>
          <div className="bg-primary-green text-white py-3 sm:py-4 px-4 sm:px-6 rounded-t-lg">
            <h2 className="text-lg sm:text-xl font-bold">CÁC SẢN PHẨM TƯƠNG TỰ</h2>
          </div>
          <div className="bg-white rounded-b-lg p-6">
            <ProductGrid products={similarProducts} columns={5} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Đang tải...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
