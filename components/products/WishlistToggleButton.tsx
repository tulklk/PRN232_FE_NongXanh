'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useState } from 'react'
import SuccessPopup from '@/components/common/SuccessPopup'

interface WishlistToggleButtonProps {
  productId: string
  productHref?: string
  className?: string
}

export default function WishlistToggleButton({
  productId,
  productHref,
  className,
}: WishlistToggleButtonProps) {
  const router = useRouter()
  const { isAuthenticated } = useUser()
  const { wishlistProductIds, toggleWishlist } = useWishlist()
  const [loading, setLoading] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')

  const isWishlisted = wishlistProductIds.has(String(productId))

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      router.push(`/login?from=${encodeURIComponent(productHref ?? `/products/${productId}`)}`)
      return
    }
    setLoading(true)
    try {
      const added = await toggleWishlist(productId)
      setPopupMessage(
        added
          ? 'Bạn đã thêm sản phẩm vào yêu thích'
          : 'Bạn đã xóa sản phẩm khỏi yêu thích'
      )
      setPopupOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const stateClass = isWishlisted
    ? 'border-red-400 text-red-500 bg-red-50'
    : 'border-gray-300 text-gray-500 bg-white hover:border-red-400 hover:text-red-500'

  return (
    <>
      <button
        type="button"
        aria-label={isWishlisted ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
        onClick={handleClick}
        disabled={loading}
        className={`p-1.5 rounded-full border transition-colors disabled:opacity-50 ${stateClass} ${className ?? ''}`}
      >
        <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
      </button>
      <SuccessPopup
        message={popupMessage}
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        duration={2000}
      />
    </>
  )
}
