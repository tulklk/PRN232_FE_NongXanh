'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Truck, CreditCard, Wallet, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DELIVERY_METHODS, PAYMENT_METHODS } from '@/lib/constants'

export default function CheckoutPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    addressType: 'home',
  })
  const [deliveryMethod, setDeliveryMethod] = useState(DELIVERY_METHODS[0].id)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [discountCodes, setDiscountCodes] = useState(['', '', ''])

  const cartItems = [
    {
      id: '1',
      name: 'Hồng Trà Đào Dải Lát Không Hạt - Đào Đen Ngâm Lạnh',
      image: '/images/tea.jpg',
      quantity: 1,
      price: 136000,
    },
  ]

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const selectedDelivery = DELIVERY_METHODS.find((m) => m.id === deliveryMethod)!
  const shippingFee = selectedDelivery.price
  const total = subtotal + shippingFee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/checkout/success')
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          QUAY LẠI
        </Link>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg p-6">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tỉnh/Thành phố</label>
                    <select
                      required
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      <option value="hcm">TP. Hồ Chí Minh</option>
                      <option value="hn">Hà Nội</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Quận/Huyện</label>
                    <select
                      required
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                    >
                      <option value="">Chọn quận/huyện</option>
                      <option value="q1">Quận 1</option>
                      <option value="q2">Quận 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Phường/Xã</label>
                    <select
                      required
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                    >
                      <option value="">Chọn phường/xã</option>
                      <option value="p1">Phường 1</option>
                      <option value="p2">Phường 2</option>
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

              {/* Delivery Method */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Hình thức giao hàng</h2>
                <div className="space-y-4">
                  {DELIVERY_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer ${
                        deliveryMethod === method.id
                          ? 'border-primary-green bg-primary-green-light'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value={method.id}
                        checked={deliveryMethod === method.id}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="mt-1 mr-4 text-primary-green focus:ring-primary-green"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{formatCurrency(method.price)}</span>
                          <span className="text-sm text-gray-600">{method.name}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Dự kiến giao: {new Date(Date.now() + method.estimatedDays * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="freeShipping"
                    className="mr-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                  />
                  <label htmlFor="freeShipping" className="text-sm text-gray-600">
                    Miễn phí vận chuyển (Đơn hàng trên 500.000đ)
                  </label>
                </div>
              </div>

              {/* Cart Items */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Giỏ hàng của bạn</h2>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Số lượng: {item.quantity}</span>
                        <span className="font-semibold text-primary-green">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg p-6">
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
              <div className="bg-white rounded-lg p-6 sticky top-4">
                <h2 className="text-lg font-bold mb-4">Mã giảm giá</h2>
                <div className="space-y-2 mb-4">
                  {discountCodes.map((code, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                          const newCodes = [...discountCodes]
                          newCodes[index] = e.target.value
                          setDiscountCodes(newCodes)
                        }}
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
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h2 className="text-lg font-bold mb-4">Thông tin đơn hàng</h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
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
                        required
                        className="mt-1 mr-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                      />
                      <span className="text-sm text-gray-600">
                        Tôi đã đọc và đồng ý với điều khoản và điều kiện mua hàng của nongxanh
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors"
                  >
                    ĐẶT HÀNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
