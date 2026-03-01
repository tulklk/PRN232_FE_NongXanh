'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import QuantitySelector from '@/components/common/QuantitySelector'
import { useCart } from '@/contexts/CartContext'
import { useUser } from '@/contexts/UserContext'
import { getProductVariants } from '@/lib/api/productVariants'
import type { ApiProductVariant } from '@/lib/types/api'

interface ProductDetailActionsProps {
  productId: string
  productName: string
}

export default function ProductDetailActions({
  productId,
  productName,
}: ProductDetailActionsProps) {
  const router = useRouter()
  const { isAuthenticated } = useUser()
  const { addItem, loading } = useCart()
  const [variants, setVariants] = useState<ApiProductVariant[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getProductVariants(
          typeof productId === 'string' ? Number(productId) || productId : productId
        )
        setVariants(list)
        if (list[0]) setSelectedVariantId(list[0].variantId)
      } catch {
        setVariants([])
      }
    }
    load()
  }, [productId])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để thêm vào giỏ')
      return
    }
    const vid = selectedVariantId ?? variants[0]?.variantId
    if (!vid) {
      setError('Sản phẩm chưa có biến thể')
      return
    }
    setError(null)
    setAddSuccess(false)
    try {
      await addItem(vid, quantity)
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm vào giỏ')
    }
  }

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    const vid = selectedVariantId ?? variants[0]?.variantId
    if (!vid) {
      setError('Sản phẩm chưa có biến thể')
      return
    }
    setError(null)
    try {
      await addItem(vid, quantity)
      router.push('/checkout')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm vào giỏ')
    }
  }

  return (
    <>
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Đóng Gói:</p>
        <div className="flex flex-wrap gap-2">
          {variants.length > 0 ? (
            variants.map((v) => (
              <button
                key={v.variantId}
                type="button"
                onClick={() => setSelectedVariantId(v.variantId)}
                className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                  selectedVariantId === v.variantId
                    ? 'border-primary-green text-primary-green bg-green-50'
                    : 'border-gray-300 text-gray-700 hover:border-primary-green'
                }`}
              >
                {selectedVariantId === v.variantId && (
                  <span className="text-primary-green mr-1">✓</span>
                )}
                {v.variantName} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price)}
              </button>
            ))
          ) : (
            <span className="text-xs text-gray-500">Đang tải...</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Số lượng:</p>
        <QuantitySelector defaultValue={1} onChange={setQuantity} />
      </div>

      {error && (
        <p className="text-sm text-red-500 mb-2">{error}</p>
      )}
      {addSuccess && (
        <p className="text-sm text-green-600 mb-2">Đã thêm vào giỏ hàng!</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || variants.length === 0}
          className="flex-1 border border-primary-green text-primary-green py-2 px-4 rounded text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          THÊM VÀO GIỎ HÀNG
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={loading || variants.length === 0}
          className="flex-1 bg-primary-green text-white py-2 px-4 rounded text-xs font-medium hover:bg-primary-green-dark transition-colors disabled:opacity-50"
        >
          MUA NGAY
        </button>
        <button className="p-2 border border-gray-300 rounded hover:border-red-400 hover:text-red-400 transition-colors">
          <Heart size={16} />
        </button>
      </div>
    </>
  )
}
