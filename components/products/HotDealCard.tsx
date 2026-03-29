import Link from "next/link";
import Image from "next/image";
import RatingStars from "@/components/common/RatingStars";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/data/products";

interface HotDealCardProps {
  product: Product;
}

export default function HotDealCard({ product }: HotDealCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <Link href={`/products/${product.id}`}>
        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          {/* Logo badge */}
          <div className="absolute top-2 left-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-5 h-5 bg-[#0A923C] rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">N</span>
            </div>
          </div>
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
        <p className="text-base font-bold text-[#0A923C]">
          {formatCurrency(product.currentPrice)}
        </p>
      </div>
    </div>
  );
}
