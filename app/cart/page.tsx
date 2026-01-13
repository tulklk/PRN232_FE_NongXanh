'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Trash2 } from 'lucide-react'
import QuantitySelector from '@/components/common/QuantitySelector'
import { formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  name: string
  image: string
  packaging: string
  price: number
  quantity: number
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Nông Trại Gà Đủ Lạc Không Hạt - Đậu Ngon Lành',
      image: '/images/peanuts.jpg',
      packaging: 'Hộp 500g',
      price: 257000,
      quantity: 1,
    },
  ])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(['1']))

  const subtotal = items
    .filter((item) => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0)

  const shippingFee = 0
  const total = subtotal + shippingFee

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map((item) => item.id)))
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                checked={selectedItems.size === items.length && items.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary-green focus:ring-primary-green"
              />
              <span className="font-semibold">
                Chọn tất cả ({items.length} sản phẩm)
              </span>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => {
                      const newSet = new Set(selectedItems)
                      if (newSet.has(item.id)) {
                        newSet.delete(item.id)
                      } else {
                        newSet.add(item.id)
                      }
                      setSelectedItems(newSet)
                    }}
                    className="mt-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                  />
                  <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Đóng gói: {item.packaging}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-green">
                        {formatCurrency(item.price)}
                      </span>
                      <div className="flex items-center gap-4">
                        <QuantitySelector
                          defaultValue={item.quantity}
                          onChange={(qty) => handleQuantityChange(item.id, qty)}
                        />
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-bold mb-4">Thông tin đơn hàng</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Địa điểm</p>
                <p className="text-red-500 font-semibold">Chưa có địa chỉ giao hàng!</p>
              </div>

              <div className="border-t border-b border-gray-200 py-4 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-semibold">{formatCurrency(shippingFee)}</span>
                </div>
              </div>

              {subtotal === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm font-semibold">
                    QUÝ KHÁCH VUI LÒNG KIỂM TRA LẠI ĐƠN HÀNG VÌ SẢN PHẨM (TẠM TÍNH) ĐANG CÓ GIÁ
                    TRỊ 0 ĐỒNG. VUI LÒNG CHỌN SẢN PHẨM ĐỂ TIẾN HÀNH THANH TOÁN.
                  </p>
                </div>
              )}

              <div className="flex justify-between mb-4">
                <span className="text-lg font-bold">Tổng Cộng:</span>
                <span className="text-lg font-bold text-primary-green">
                  {formatCurrency(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                  subtotal === 0
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
