"use client";

import { useCallback, useMemo, useState } from "react";
import { calculateDiscount, formatCurrency } from "@/lib/utils";
import ProductDetailActions from "@/components/products/ProductDetailActions";

interface ProductPurchasePanelProps {
  productId: string;
  productName: string;
  providerName?: string | null;
  sellerFallback?: string | null;
  initialCurrentPrice: number;
  originalPrice?: number | null;
}

export default function ProductPurchasePanel({
  productId,
  productName,
  providerName,
  sellerFallback,
  initialCurrentPrice,
  originalPrice,
}: ProductPurchasePanelProps) {
  const [displayPrice, setDisplayPrice] = useState<number>(initialCurrentPrice);

  const handleVariantPrice = useCallback((price: number) => {
    setDisplayPrice(price);
  }, []);

  const discount = useMemo(() => {
    const baseOriginal = Number(originalPrice ?? 0);
    const baseCurrent = Number(displayPrice ?? 0);
    if (!Number.isFinite(baseOriginal) || baseOriginal <= 0) return 0;
    if (!Number.isFinite(baseCurrent) || baseCurrent <= 0) return 0;
    return calculateDiscount(baseOriginal, baseCurrent);
  }, [originalPrice, displayPrice]);

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-xl font-bold text-primary-green">
            {formatCurrency(displayPrice)}
          </span>
          {originalPrice ? (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(originalPrice)}
            </span>
          ) : null}
        </div>
        {discount > 0 && (
          <div className="inline-block">
            <span className="border border-gray-300 text-gray-600 text-xs px-2 py-0.5 rounded">
              Giảm {discount}%
            </span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm text-gray-600 shrink-0">Nhà cung cấp:</span>
          <span className="text-base font-semibold text-primary-green leading-tight">
            {providerName || sellerFallback || "Nông Xanh"}
          </span>
        </div>
      </div>

      <ProductDetailActions
        productId={productId}
        productName={productName}
        onVariantPriceChange={handleVariantPrice}
      />
    </>
  );
}

