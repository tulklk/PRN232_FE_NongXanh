'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CategorySidebar from '@/components/products/CategorySidebar'
import ProductGrid from '@/components/products/ProductGrid'
import NewsCard from '@/components/news/NewsCard'
import { products } from '@/data/products'
import { newsArticles } from '@/data/news'
import { SORT_OPTIONS } from '@/lib/constants'

function ProductsContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'all'
  const [sortBy, setSortBy] = useState('newest')

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter((p) => p.category === category)
    }

    // Sort products
    switch (sortBy) {
      case 'bestseller':
        filtered = [...filtered].sort((a, b) => b.salesCount - a.salesCount)
        break
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.currentPrice - b.currentPrice)
        break
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.currentPrice - a.currentPrice)
        break
      case 'newest':
      default:
        // Keep original order for newest
        break
    }

    return filtered
  }, [category, sortBy])

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <CategorySidebar activeCategory={category} />

          {/* Main Content */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary-green mb-6">
              TRÁI CÂY TƯƠI NGON
            </h1>

            {/* Sort Options */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      sortBy === option.value
                        ? 'bg-primary-green text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                />
              </div>
            </div>

            {/* Product Grid */}
            <ProductGrid products={filteredAndSortedProducts} columns={4} />

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                Trước
              </button>
              <button className="px-4 py-2 bg-primary-green text-white rounded-lg">1</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                Sau
              </button>
            </div>

            {/* Recently Viewed Products */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">SẢN PHẨM ĐÃ XEM</h2>
              <ProductGrid products={products.slice(0, 4)} columns={4} />
            </section>

            {/* Related News */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">TIN TỨC LIÊN QUAN</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {newsArticles.slice(0, 3).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
