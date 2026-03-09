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
import { getCategories } from '@/lib/api/categories'
import type { ApiCategory } from '@/lib/types/api'

function flattenCategories(cats: ApiCategory[]): ApiCategory[] {
  const result: ApiCategory[] = []
  for (const c of cats) {
    if (!c.isDeleted) {
      result.push(c)
      if (c.children?.length) {
        result.push(...flattenCategories(c.children))
      }
    }
  }
  return result
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'all'
  const sortParam = searchParams.get('sort')
  const keyword = searchParams.get('q')?.trim() ?? ''
  const [sortBy, setSortBy] = useState('newest')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const pageSize = 12

  useEffect(() => {
    if (sortParam === 'bestseller' || sortParam === 'price-low' || sortParam === 'price-high' || sortParam === 'newest') {
      setSortBy(sortParam)
    }
  }, [sortParam])

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setPageNumber(1)
  }, [category])

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

  const allCategories = useMemo(
    () => flattenCategories(categories),
    [categories]
  )

  const activeCategoryObj =
    category !== 'all'
      ? allCategories.find((c) => String(c.categoryId) === category)
      : null

  const pageTitle =
    activeCategoryObj?.categoryName?.toUpperCase() ??
    (category === 'all' ? 'TẤT CẢ SẢN PHẨM' : 'SẢN PHẨM')

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    if (keyword) {
      const lower = keyword.toLowerCase()
      filtered = filtered.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(lower)
        const descMatch = p.description
          ? p.description.toLowerCase().includes(lower)
          : false
        return nameMatch || descMatch
      })
    }

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
  }, [products, sortBy, keyword])

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar (desktop) */}
          <div className="hidden md:block">
            <CategorySidebar activeCategory={category} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile category / filter bar */}
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <h1 className="text-xl font-bold text-primary-green">
                {pageTitle}
              </h1>
              <button
                type="button"
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white flex items-center gap-2"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Bộ lọc
              </button>
            </div>

            {/* Desktop page title */}
            <h1 className="hidden lg:block text-3xl font-bold text-primary-green mb-2">
              {pageTitle}
            </h1>
            {keyword && (
              <p className="mb-4 text-sm text-gray-600">
                Kết quả tìm kiếm cho "<span className="font-medium">{keyword}</span>" ({filteredAndSortedProducts.length}{' '}
                sản phẩm)
              </p>
            )}

            {/* Sort Options */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
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
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green text-sm"
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
