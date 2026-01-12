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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 hover:text-primary-green">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <RatingStars rating={product.rating} size={14} />
          <span className="text-xs text-gray-500">({product.reviewCount})</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">Còn lại ??? sản phẩm</p>
        <div className="mb-3">
          <p className="text-lg font-bold text-primary-green">
            {formatCurrency(product.currentPrice)}
          </p>
        </div>
        <Link
          href={`/products/${product.id}`}
          className="block w-full bg-primary-green text-white text-center py-2 px-4 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors text-sm"
        >
          XEM CHI TIẾT
        </Link>
      </div>
    </div>
  )
}
