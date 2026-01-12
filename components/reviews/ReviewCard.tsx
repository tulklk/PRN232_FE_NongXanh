import RatingStars from '@/components/common/RatingStars'
import { formatDate } from '@/lib/utils'
import { Review } from '@/data/reviews'

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border-b border-gray-200 pb-4 mb-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{review.userName}</p>
          <RatingStars rating={review.rating} size={14} className="mt-1" />
        </div>
        <p className="text-xs text-gray-400">{formatDate(review.date)}</p>
      </div>
      <p className="text-sm text-gray-700">{review.comment}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
        <span>0 thảo luận</span>
        <span>•</span>
        <button className="hover:text-primary-green">Trả lời</button>
      </div>
    </div>
  )
}
