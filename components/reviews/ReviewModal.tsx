'use client'

import { useEffect, useMemo, useState } from 'react'
import { Star, X } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { createReview } from '@/lib/api/reviews'

interface ReviewModalProps {
  open: boolean
  productId: string
  productName: string
  onClose: () => void
  onSubmitted?: () => void
}

export default function ReviewModal({
  open,
  productId,
  productName,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const { user, tokens } = useUser()
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return Boolean(
      !submitting &&
        tokens?.idToken &&
        user?.userId &&
        productId &&
        rating >= 1 &&
        rating <= 5 &&
        comment.trim().length >= 3
    )
  }, [submitting, tokens?.idToken, user?.userId, productId, rating, comment])

  useEffect(() => {
    if (!open) return
    setError(null)
    setSubmitting(false)
    setRating(5)
    setHoverRating(null)
    setComment('')
  }, [open, productId])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const handleSubmit = async () => {
    if (!tokens?.idToken || !user?.userId) {
      setError('Vui lòng đăng nhập để đánh giá sản phẩm.')
      return
    }
    const trimmed = comment.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      await createReview(
        {
          rating,
          comment: trimmed,
          userId: String(user.userId),
          productId: String(productId),
        },
        tokens.idToken
      )
      onSubmitted?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const displayRating = hoverRating ?? rating

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-[101] w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between bg-[#0A923C] px-4 py-3 text-white">
          <div>
            <p className="text-sm font-semibold">Đánh giá sản phẩm</p>
            <p className="text-[11px] text-green-100 line-clamp-1">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-white/15 transition-colors"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900 mb-2">Chọn số sao</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, idx) => {
                const starValue = idx + 1
                const active = starValue <= displayRating
                return (
                  <button
                    key={starValue}
                    type="button"
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(starValue)}
                    className="p-1"
                    aria-label={`${starValue} sao`}
                  >
                    <Star
                      size={22}
                      className={
                        active ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }
                    />
                  </button>
                )
              })}
              <span className="ml-2 text-sm font-semibold text-gray-700">
                {displayRating}/5
              </span>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900 mb-2">Nhận xét</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#0A923C] focus:ring-2 focus:ring-[#0A923C]/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Tối thiểu 3 ký tự.
            </p>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-10 px-4 rounded-lg bg-[#0A923C] text-white text-sm font-semibold hover:bg-[#087a32] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

