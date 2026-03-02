'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Trash2 } from 'lucide-react'
import QuantitySelector from '@/components/common/QuantitySelector'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/contexts/CartContext'
import { useUser } from '@/contexts/UserContext'

export default function CartPage() {
  const { isAuthenticated } = useUser()
  const {
    cart,
    loading,
    error,
    refreshCart,
    updateItem,
    removeItem,
  } = useCart()

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart()
    }
  }, [isAuthenticated, refreshCart])

  const items = cart?.cartItems ?? []
  const totalAmount = cart?.totalAmount ?? 0

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
          >
            <ArrowLeft size={20} />
            TIẾP TỤC MUA SẮM
          </Link>
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">
              Đăng nhập để xem giỏ hàng của bạn
            </p>
            <Link
              href="/login"
              className="inline-block bg-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-green-dark"
            >
              ĐĂNG NHẬP
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          TIẾP TỤC MUA SẮM
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6">
            <h2 className="font-semibold mb-6">
              Giỏ hàng ({items.length} sản phẩm)
            </h2>

            {loading && items.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Đang tải giỏ hàng...
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Giỏ hàng trống
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const displayName =
                    [item.productName, item.variantName].filter(Boolean).join(' - ') || 'Sản phẩm'
                  const imageSrc = item.imageUrl?.startsWith('http') ? item.imageUrl : '/images/logo.png'
                  return (
                  <div
                    key={item.cartItemId}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <Image
                        src={imageSrc}
                        alt={displayName}
                        fill
                        className="object-cover rounded-lg"
                        sizes="80px"
                        unoptimized={imageSrc.startsWith('http')}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {displayName}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-green">
                          {formatCurrency(item.priceAtTime)}
                        </span>
                        <div className="flex items-center gap-4">
                          <QuantitySelector
                            defaultValue={item.quantity}
                            onChange={(qty) => updateItem(item.cartItemId, qty)}
                          />
                          <button
                            onClick={() => removeItem(item.cartItemId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Tạm tính: {formatCurrency(item.subTotal)}
                      </p>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-bold mb-4">Thông tin đơn hàng</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Địa điểm</p>
                <Link
                  href="/account/addresses"
                  className="text-primary-green hover:underline font-semibold"
                >
                  Thêm địa chỉ giao hàng
                </Link>
              </div>

              <div className="border-t border-b border-gray-200 py-4 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-semibold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-semibold">
                    Tính tại bước thanh toán
                  </span>
                </div>
              </div>

              {totalAmount === 0 && items.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm font-semibold">
                    QUÝ KHÁCH VUI LÒNG KIỂM TRA LẠI ĐƠN HÀNG.
                  </p>
                </div>
              )}

              <div className="flex justify-between mb-4">
                <span className="text-lg font-bold">Tổng Cộng:</span>
                <span className="text-lg font-bold text-primary-green">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <Link
                href={totalAmount > 0 ? '/checkout' : '#'}
                className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                  totalAmount === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-green text-white hover:bg-primary-green-dark'
                }`}
              >
                XÁC NHẬN ĐẶT HÀNG
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
