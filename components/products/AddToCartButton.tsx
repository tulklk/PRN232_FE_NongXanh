'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useUser } from '@/contexts/UserContext'
import { getProductVariants } from '@/lib/api/productVariants'

interface AddToCartButtonProps {
  productId: string | number
  variantId?: number
  className?: string
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export default function AddToCartButton({
  productId,
  variantId: prefetchedVariantId,
  className = '',
  size = 'sm',
  showIcon = true,
}: AddToCartButtonProps) {
  const { isAuthenticated } = useUser()
  const { addItem, loading } = useCart()
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập')
      return
    }
    setError(null)
    try {
      let variantId = prefetchedVariantId
      if (variantId == null) {
        const variants = await getProductVariants(
          typeof productId === 'string' ? Number(productId) || productId : productId
        )
        const first = variants[0]
        if (!first) {
          setError('Sản phẩm chưa có biến thể')
          return
        }
        variantId = first.variantId
      }
      await addItem(variantId, 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm vào giỏ')
    }
  }

  const sizeClass = size === 'sm' ? 'p-1.5' : 'py-2 px-4'
  const iconSize = size === 'sm' ? 18 : 20

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`bg-[#0A923C] text-white rounded-md hover:bg-[#087a32] transition-colors shadow-sm disabled:opacity-50 ${sizeClass} ${className}`}
      >
        {showIcon ? <ShoppingCart size={iconSize} /> : 'Thêm vào giỏ'}
      </button>
      {error && (
        <span className="text-xs text-red-500 mt-1">{error}</span>
      )}
    </div>
  )
}
