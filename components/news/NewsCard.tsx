import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'
import { NewsArticle } from '@/data/news'

interface NewsCardProps {
  article: NewsArticle
  size?: 'small' | 'large'
}

export default function NewsCard({ article, size = 'small' }: NewsCardProps) {
  return (
    <Link href={`/news/${article.id}`} className="block">
      <div className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
        size === 'large' ? 'h-full' : ''
      }`}>
        <div className={`relative w-full ${
          size === 'large' ? 'aspect-video' : 'aspect-[4/3]'
        } bg-gray-100 flex items-center justify-center`}>
          <div className="text-4xl text-gray-300">⛰️☀️</div>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1">{article.category}</p>
          <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-green ${
            size === 'large' ? 'text-lg' : 'text-sm'
          }`}>
            {article.title}
          </h3>
          <p className="text-xs text-gray-400">{formatDate(article.date)}</p>
        </div>
      </div>
    </Link>
  )
}
