'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Truck, CreditCard, Wallet, Building2 } from 'lucide-react'
import { formatCurrency, formatPhoneNumber, normalizePhoneNumber } from '@/lib/utils'
import { FIXED_SHIPPING_FEE, PAYMENT_METHODS } from '@/lib/constants'
import { useCart } from '@/contexts/CartContext'
import { useUser } from '@/contexts/UserContext'
import { createOrder } from '@/lib/api/orders'
import { createPayment, createVNPayPaymentUrl } from '@/lib/api/payments'
import { getProvinces, getWardsByProvince, type Province, type Ward } from '@/lib/api/provinces'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, tokens, isAuthenticated } = useUser()
  const { cart, clearCart } = useCart()

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    ward: '',
    address: '',
    addressType: 'home',
  })
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(true)
  const [loadingWards, setLoadingWards] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [discountCode, setDiscountCode] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const cartItems = cart?.cartItems ?? []
  const subtotal = cart?.totalAmount ?? 0
  const shippingFee = FIXED_SHIPPING_FEE
  const total = subtotal + shippingFee

  const hasInitializedForm = useRef(false)
  useEffect(() => {
    if (user && isAuthenticated && !hasInitializedForm.current) {
      hasInitializedForm.current = true
      setFormData((prev) => ({
        ...prev,
        fullName: user.displayName ?? prev.fullName,
        phone: formatPhoneNumber(user.phoneNumber ?? '') || prev.phone,
        email: user.email ?? prev.email,
      }))
    }
  }, [user, isAuthenticated])

  useEffect(() => {
    let cancelled = false
    setLoadingProvinces(true)
    getProvinces()
      .then((data) => {
        if (!cancelled) setProvinces(data)
      })
      .catch(() => {
        if (!cancelled) setProvinces([])
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!formData.province) {
      setWards([])
      setFormData((prev) => ({ ...prev, ward: '' }))
      return
    }
    let cancelled = false
    setLoadingWards(true)
    setFormData((prev) => ({ ...prev, ward: '' }))
    getWardsByProvince(Number(formData.province))
      .then((data) => {
        if (!cancelled) setWards(data)
      })
      .catch(() => {
        if (!cancelled) setWards([])
      })
      .finally(() => {
        if (!cancelled) setLoadingWards(false)
      })
    return () => { cancelled = true }
  }, [formData.province])

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <p className="text-gray-600 mb-4">
            Vui lòng đăng nhập để tiến hành thanh toán
          </p>
          <Link
            href="/login"
            className="inline-block bg-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-green-dark"
          >
            ĐĂNG NHẬP
          </Link>
        </div>
      </div>
    )
  }

  if (!tokens?.idToken || !user?.userId) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart || cartItems.length === 0) {
      setSubmitError('Giỏ hàng trống')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const provinceName = provinces.find((p) => String(p.code) === formData.province)?.name ?? formData.province
      const wardName = wards.find((w) => String(w.code) === formData.ward)?.name ?? formData.ward
      const shippingAddress = [
        formData.fullName,
        normalizePhoneNumber(formData.phone) || formData.phone,
        formData.address,
        wardName,
        provinceName,
      ]
        .filter(Boolean)
        .join(', ')

      const orderDetails = cartItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }))

      const order = await createOrder(
        {
          shippingFee,
          shippingAddress: shippingAddress || undefined,
          userId: user.userId,
          orderDetails,
        },
        tokens.idToken
      )

      if (paymentMethod === 'bank') {
        const { paymentUrl } = await createVNPayPaymentUrl(
          {
            orderId: String(order.orderId),
            clientIp: '',
          },
          tokens.idToken
        )
        await clearCart()
        window.location.href = paymentUrl
        return
      }

      const isOnlinePayment = paymentMethod !== 'cod'
      if (isOnlinePayment) {
        await createPayment(
          {
            paymentMethod,
            orderId: order.orderId,
          },
          tokens.idToken
        )
      }

      await clearCart()
      const orderNumber = order.orderNumber ?? String(order.orderId)
      router.push(`/checkout/success?orderId=${order.orderId}&orderNumber=${encodeURIComponent(orderNumber)}`)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể tạo đơn hàng'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          QUAY LẠI
        </Link>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {submitError}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 sm:p-12 text-center">
            <p className="text-gray-600 mb-4">Giỏ hàng trống</p>
            <Link
              href="/products"
              className="inline-block bg-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-green-dark"
            >
              TIẾP TỤC MUA SẮM
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Information */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl font-bold mb-4">Thông tin nhận hàng</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Đăng nhập để nhận được thông báo về tình trạng đơn hàng
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Họ Tên</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v) setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(v) }))
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Tỉnh/Thành phố</label>
                      <select
                        required
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        disabled={loadingProvinces}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green disabled:opacity-60"
                      >
                        <option value="">
                          {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành'}
                        </option>
                        {provinces.map((p) => (
                          <option key={p.code} value={String(p.code)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Phường/Xã</label>
                      <select
                        required
                        value={formData.ward}
                        onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                        disabled={!formData.province || loadingWards}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green disabled:opacity-60"
                      >
                        <option value="">
                          {!formData.province
                            ? 'Chọn tỉnh trước'
                            : loadingWards
                              ? 'Đang tải...'
                              : 'Chọn phường/xã'}
                        </option>
                        {wards.map((w) => (
                          <option key={w.code} value={String(w.code)}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="addressType"
                        value="home"
                        checked={formData.addressType === 'home'}
                        onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                        className="mr-2 text-primary-green focus:ring-primary-green"
                      />
                      <span>Nhà riêng</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="addressType"
                        value="office"
                        checked={formData.addressType === 'office'}
                        onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                        className="mr-2 text-primary-green focus:ring-primary-green"
                      />
                      <span>Văn phòng</span>
                    </label>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl font-bold mb-4">Hình thức thanh toán</h2>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                          paymentMethod === method.id
                            ? 'border-primary-green bg-primary-green-light'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-4 text-primary-green focus:ring-primary-green"
                        />
                        <div className="flex items-center gap-2">
                          {method.icon === 'truck' && <Truck size={20} />}
                          {method.icon === 'bank' && <Building2 size={20} />}
                          {method.icon === 'card' && <CreditCard size={20} />}
                          {method.icon === 'wallet' && <Wallet size={20} />}
                          <span>{method.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg p-4 sm:p-6 lg:sticky lg:top-4">
                  <h2 className="text-lg font-bold mb-4">Mã giảm giá</h2>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                    />
                    <button
                      type="button"
                      className="bg-primary-green text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-green-dark"
                    >
                      ÁP DỤNG
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h2 className="text-lg font-bold mb-4">Thông tin đơn hàng</h2>
                    <div className="space-y-3 mb-4">
                      {cartItems.map((item) => {
                        const displayName = [item.productName, item.variantName].filter(Boolean).join(' - ') || 'Sản phẩm'
                        const imageSrc = item.imageUrl?.startsWith('http') ? item.imageUrl : '/images/logo.png'
                        return (
                        <div key={item.cartItemId} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                          <div className="relative w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            <Image
                              src={imageSrc}
                              alt={displayName}
                              fill
                              className="object-cover rounded-lg"
                              sizes="48px"
                              unoptimized={imageSrc.startsWith('http')}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{displayName}</h3>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs text-gray-500">Số lượng: {item.quantity}</span>
                              <span className="font-semibold text-primary-green text-sm">
                                {formatCurrency(item.subTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                        )
                      })}
                      <div className="flex justify-between pt-2">
                        <span className="text-gray-600">Tạm tính:</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phí vận chuyển:</span>
                        <span className="font-semibold">{formatCurrency(shippingFee)}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold">Tổng Cộng:</span>
                        <span className="text-lg font-bold text-primary-green">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 mr-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                        />
                        <span className="text-sm text-gray-600">
                          Tôi đã đọc và đồng ý với điều khoản và điều kiện mua hàng của nongxanh
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !agreedToTerms}
                      className="w-full bg-primary-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
