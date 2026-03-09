'use client'

import { useMemo, useState } from 'react'
import NewsCard from '@/components/news/NewsCard'
import { newsArticles, newsCategories } from '@/data/news'

export default function AgrishowPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(
    () =>
      newsArticles.filter((article) => {
        const matchesSearch =
          !search.trim() ||
          article.title.toLowerCase().includes(search.toLowerCase()) ||
          article.category.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = category === 'all' || article.category === category
        return matchesSearch && matchesCategory
      }),
    [search, category]
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tin tức</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Cập nhật câu chuyện nông nghiệp, kinh nghiệm canh tác và những chương trình mới nhất từ
            Nông Xanh.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm kiếm bài viết
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập tiêu đề hoặc danh mục tin tức..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              >
                <option value="all">Tất cả danh mục</option>
                {newsCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            Không tìm thấy bài viết phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

