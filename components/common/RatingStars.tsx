import { Star } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: number
  showNumber?: boolean
  className?: string
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 16,
  showNumber = false,
  className = '',
}: RatingStarsProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showNumber && <span className="text-sm font-semibold mr-1">{rating.toFixed(1)}</span>}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} size={size} className="fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star size={size} className="text-gray-300" />
          <Star
            size={size}
            className="fill-yellow-400 text-yellow-400 absolute top-0 left-0 overflow-hidden"
            style={{ clipPath: 'inset(0 50% 0 0)' }}
          />
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-300" />
      ))}
    </div>
  )
}
