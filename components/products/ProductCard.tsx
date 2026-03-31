import Link from "next/link";
import Image from "next/image";
import RatingStars from "@/components/common/RatingStars";
import AddToCartButton from "@/components/products/AddToCartButton";
import WishlistToggleButton from "@/components/products/WishlistToggleButton";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  showCart?: boolean;
  showWishlist?: boolean;
  /** Use for above-the-fold images to improve LCP */
  imagePriority?: boolean;
}

export default function ProductCard({
  product,
  showCart = true,
  showWishlist = true,
  imagePriority = false,
}: ProductCardProps) {
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.currentPrice)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden group">
      <Link href={`/products/${product.id}`}>
        <div className="relative w-full aspect-square bg-white overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-2 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={imagePriority}
          />
          {/* Logo badge */}
          <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-5 h-5 bg-[#0A923C] rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">N</span>
            </div>
          </div>
          {discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded">
              -{discount}%
            </div>
          )}
          {showWishlist && (
            <div className="absolute bottom-2 right-2 z-10">
              <WishlistToggleButton
                productId={product.id}
                productHref={`/products/${product.id}`}
              />
            </div>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-sm text-gray-900 mb-1.5 line-clamp-2 hover:text-[#0A923C] transition-colors min-h-[40px]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-1">
          <RatingStars rating={product.rating} size={14} showNumber />
          <span className="text-xs text-gray-500">({product.reviewCount})</span>
        </div>
        <p className="text-xs text-gray-500 mb-1.5">
          {product.salesCount} Đã bán
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-base font-bold text-[#0A923C]">
              {formatCurrency(product.currentPrice)}
            </p>
            {product.originalPrice && (
              <>
                <p className="text-xs text-gray-400 line-through">
                  {formatCurrency(product.originalPrice)}
                </p>
                <span className="text-xs text-red-500 font-medium">
                  -{discount}%
                </span>
              </>
            )}
          </div>
          {showCart && <AddToCartButton productId={product.id} />}
        </div>
      </div>
    </div>
  );
}
