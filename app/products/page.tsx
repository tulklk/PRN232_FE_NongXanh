'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CategorySidebar from '@/components/products/CategorySidebar'
import ProductGrid from '@/components/products/ProductGrid'
import NewsCard from '@/components/news/NewsCard'
import { newsArticles } from '@/data/news'
import { SORT_OPTIONS } from '@/lib/constants'
import { getProducts } from '@/lib/api/products'
import type { Product } from '@/data/products'

function ProductsContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'all'
  const [sortBy, setSortBy] = useState('newest')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 12

  useEffect(() => {
    setLoading(true)
    getProducts({
      pageNumber,
      pageSize,
      categoryId: category !== 'all' ? category : undefined,
    })
      .then((res) => {
        setProducts(res.items)
        setTotalPages(res.totalPages ?? (Math.ceil((res.totalCount ?? 0) / pageSize) || 1))
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [category, pageNumber])

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]
    switch (sortBy) {
      case 'bestseller':
        filtered.sort((a, b) => b.salesCount - a.salesCount)
        break
      case 'price-low':
        filtered.sort((a, b) => a.currentPrice - b.currentPrice)
        break
      case 'price-high':
        filtered.sort((a, b) => b.currentPrice - a.currentPrice)
        break
      case 'newest':
      default:
        break
    }
    return filtered
  }, [products, sortBy])

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
            {loading ? (
              <div className="py-12 text-center text-gray-500">Đang tải sản phẩm...</div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-500">Không tìm thấy sản phẩm.</div>
            ) : (
              <ProductGrid products={filteredAndSortedProducts} columns={4} />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Trang {pageNumber} / {totalPages}
              </span>
              <button
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                disabled={pageNumber >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>

            {/* Recently Viewed Products */}
            {products.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SẢN PHẨM ĐÃ XEM</h2>
                <ProductGrid products={products.slice(0, 4)} columns={4} />
              </section>
            )}

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
