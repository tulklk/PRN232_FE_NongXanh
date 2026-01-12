import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import RatingStars from '@/components/common/RatingStars'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { Product } from '@/data/products'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.currentPrice)
    : 0

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{discount}%
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2 hover:text-primary-green">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mb-2">{product.seller}</p>
        <div className="flex items-center gap-2 mb-2">
          <RatingStars rating={product.rating} size={14} />
          <span className="text-xs text-gray-500">({product.reviewCount})</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{product.salesCount} Đã bán</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary-green">
              {formatCurrency(product.currentPrice)}
            </p>
            {product.originalPrice && (
              <p className="text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </p>
            )}
          </div>
          <button className="p-2 bg-primary-green text-white rounded-full hover:bg-primary-green-dark transition-colors">
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
