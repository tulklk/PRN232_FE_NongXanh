'use client'

import Image from 'next/image'
import { Trash2, ShoppingCart } from 'lucide-react'

const wishlistItems = [
  {
    id: '1',
    name: 'Trà Lá Mãng Cầu Sấy Lạnh - Indochine Blends',
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200',
    currentPrice: 63000,
    originalPrice: 89000,
  },
]

export default function WishlistPage() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-5 pb-4 border-b border-gray-200">
        <div className="text-xs text-gray-500 font-medium text-center">Hình ảnh</div>
        <div className="text-xs text-gray-500 font-medium text-center">Sản phẩm</div>
        <div className="text-xs text-gray-500 font-medium text-center">Giá</div>
        <div className="text-xs text-gray-500 font-medium text-center">Hành động</div>
      </div>

      {/* Table Body */}
      {wishlistItems.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {wishlistItems.map((item) => (
            <div key={item.id} className="grid grid-cols-4 gap-5 py-5 items-center">
              <div className="flex justify-center">
                <div className="relative w-24 h-24 rounded-md overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-700">{item.name}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-[#0A923C]">
                  {formatCurrency(item.currentPrice)}
                </p>
                <p className="text-[10px] text-gray-400 line-through">
                  {formatCurrency(item.originalPrice)}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
                <button className="p-2 border border-gray-200 rounded-md text-gray-400 hover:text-[#0A923C] hover:border-[#0A923C] transition-colors">
                  <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-14">
          <p className="text-base text-gray-500">Bạn chưa có sản phẩm yêu thích nào!</p>
        </div>
      )}
    </div>
  )
}
