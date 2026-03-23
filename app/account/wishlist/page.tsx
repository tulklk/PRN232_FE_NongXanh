'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import AddToCartButton from '@/components/products/AddToCartButton'
import { formatCurrency } from '@/lib/utils'

export default function WishlistPage() {
  const { wishlistItems, loading, removeFromWishlist } = useWishlist()

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
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <p className="text-base text-gray-500">Đang tải danh sách yêu thích...</p>
        </div>
      ) : wishlistItems.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {wishlistItems.map((item) => (
            <div
              key={`${item.wishlistId ?? item.productId}`}
              className="grid grid-cols-4 gap-5 py-5 items-center"
            >
              <div className="flex justify-center">
                <div className="relative w-24 h-24 rounded-md overflow-hidden">
                  <Image
                    src={item.imageUrl || '/images/logo.png'}
                    alt={item.productName || 'Sản phẩm yêu thích'}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              </div>
              <div className="text-center">
                <Link
                  href={`/products/${item.productId}`}
                  className="text-xs text-gray-700 hover:text-[#0A923C] line-clamp-2"
                >
                  {item.productName || `Sản phẩm #${item.productId}`}
                </Link>
              </div>
              <div className="text-center">
                {item.price != null ? (
                  <p className="text-xs font-bold text-[#0A923C]">
                    {formatCurrency(item.price)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Liên hệ</p>
                )}
                {item.originalPrice != null && item.originalPrice > 0 && (
                  <p className="text-[10px] text-gray-400 line-through">
                    {formatCurrency(item.originalPrice)}
                  </p>
                )}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => removeFromWishlist(item.productId)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Xóa khỏi yêu thích"
                >
                  <Trash2 size={16} />
                </button>
                <AddToCartButton productId={String(item.productId)} />
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
