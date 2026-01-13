import Link from 'next/link'
import Image from 'next/image'
import RatingStars from '@/components/common/RatingStars'
import { formatCurrency } from '@/lib/utils'
import { Product } from '@/data/products'

interface HotDealCardProps {
  product: Product
}

export default function HotDealCard({ product }: HotDealCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link href={`/products/${product.id}`}>
        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {/* Logo badge */}
          <div className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-6 h-6 bg-[#0A923C] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
          </div>
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2 hover:text-[#0A923C] transition-colors min-h-[40px]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-2">
          <RatingStars rating={product.rating} size={14} />
          <span className="text-xs text-gray-500">({product.reviewCount})</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">Còn lại ??? sản phẩm</p>
        <div className="mb-3">
          <p className="text-lg font-bold text-[#0A923C]">
            {formatCurrency(product.currentPrice)}
          </p>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="block w-full border-2 border-[#0A923C] text-[#0A923C] text-center py-2.5 px-4 rounded-lg font-semibold hover:bg-[#0A923C] hover:text-white transition-colors text-sm"
        >
          XEM CHI TIẾT
        </Link>
      </div>
    </div>
  )
}
