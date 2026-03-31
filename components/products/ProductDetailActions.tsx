"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import QuantitySelector from "@/components/common/QuantitySelector";
import SuccessPopup from "@/components/common/SuccessPopup";
import { useCart } from "@/contexts/CartContext";
import { useUser } from "@/contexts/UserContext";
import { getProductVariants } from "@/lib/api/productVariants";
import type { ApiProductVariant } from "@/lib/types/api";

interface ProductDetailActionsProps {
  productId: string;
  productName: string;
  onVariantPriceChange?: (price: number) => void;
}

export default function ProductDetailActions({
  productId,
  productName,
  onVariantPriceChange,
}: ProductDetailActionsProps) {
  const router = useRouter();
  const { isAuthenticated } = useUser();
  const { addItem, loading } = useCart();
  const [variants, setVariants] = useState<ApiProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [variantsLoading, setVariantsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const selectedVariant =
    variants.find((v) => v.variantId === selectedVariantId) ?? variants[0];
  const selectedStock = Number(selectedVariant?.stockQuantity ?? 0);
  const isOutOfStock = selectedStock <= 0;

  useEffect(() => {
    const price = Number(selectedVariant?.price ?? 0);
    if (!onVariantPriceChange) return;
    if (!Number.isFinite(price) || price <= 0) return;
    onVariantPriceChange(price);
  }, [selectedVariant?.price, onVariantPriceChange]);

  useEffect(() => {
    const load = async () => {
      setVariantsLoading(true);
      try {
        const list = await getProductVariants(
          typeof productId === "string"
            ? Number(productId) || productId
            : productId,
        );
        setVariants(list);
        if (list[0]) setSelectedVariantId(list[0].variantId);
      } catch {
        setVariants([]);
      } finally {
        setVariantsLoading(false);
      }
    };
    load();
  }, [productId]);

  const handleAddToCart = async () => {
    if (isAddingToCart || isBuyingNow) return;
    if (!isAuthenticated) {
      router.push(
        `/login?from=${encodeURIComponent(`/products/${productId}`)}`,
      );
      return;
    }
    const vid = selectedVariantId ?? variants[0]?.variantId;
    if (!vid) {
      setError("Sản phẩm chưa có biến thể");
      return;
    }
    if (isOutOfStock) {
      setError("Biến thể đã hết hàng");
      return;
    }
    setError(null);
    setAddSuccess(false);
    setIsAddingToCart(true);
    try {
      await addItem(vid, quantity);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm vào giỏ");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (isAddingToCart || isBuyingNow) return;
    if (!isAuthenticated) {
      router.push(
        `/login?from=${encodeURIComponent(`/products/${productId}`)}`,
      );
      return;
    }
    const vid = selectedVariantId ?? variants[0]?.variantId;
    if (!vid) {
      setError("Sản phẩm chưa có biến thể");
      return;
    }
    if (isOutOfStock) {
      setError("Biến thể đã hết hàng");
      return;
    }
    setError(null);
    setIsBuyingNow(true);
    try {
      await addItem(vid, quantity);
      router.push("/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm vào giỏ");
    } finally {
      setIsBuyingNow(false);
    }
  };

  return (
    <>
      {variantsLoading ? (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Đóng Gói:</p>
          <span className="text-xs text-gray-500">Đang tải...</span>
        </div>
      ) : variants.length > 0 ? (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Đóng Gói:</p>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((v) => (
              <button
                key={v.variantId}
                type="button"
                onClick={() => setSelectedVariantId(v.variantId)}
                className={`w-full px-2 py-1.5 text-xs border rounded transition-colors ${
                  selectedVariantId === v.variantId
                    ? "border-primary-green text-primary-green bg-green-50"
                    : "border-gray-300 text-gray-700 hover:border-primary-green"
                }`}
              >
                {selectedVariantId === v.variantId && (
                  <span className="text-primary-green mr-1">✓</span>
                )}
                {v.variantName} -{" "}
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(v.price)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Số lượng:</p>
        <QuantitySelector defaultValue={1} onChange={setQuantity} />
        <p className="mt-2 text-sm font-semibold">
          <span className="text-gray-500 mb-2">Trạng thái : </span>
          <span
            className={isOutOfStock ? "text-red-500" : "text-primary-green"}
          >
            {isOutOfStock ? "Hết hàng" : "Còn hàng"}
          </span>
        </p>
      </div>

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      <SuccessPopup
        message="Đã thêm vào giỏ hàng thành công!"
        isOpen={addSuccess}
        onClose={() => setAddSuccess(false)}
        duration={2000}
      />
      <div className="flex gap-2">
        {!isOutOfStock && (
          <>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                loading ||
                isAddingToCart ||
                isBuyingNow ||
                variants.length === 0
              }
              className="flex-1 border border-primary-green text-primary-green py-2 px-4 rounded text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  ĐANG THÊM...
                </>
              ) : (
                "THÊM VÀO GIỎ HÀNG"
              )}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={
                loading ||
                isAddingToCart ||
                isBuyingNow ||
                variants.length === 0
              }
              className="flex-1 bg-primary-green text-white py-2 px-4 rounded text-xs font-medium hover:bg-primary-green-dark transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {isBuyingNow ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  ĐANG XỬ LÝ...
                </>
              ) : (
                "MUA NGAY"
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}
