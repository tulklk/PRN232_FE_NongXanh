'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getBlogs } from '@/lib/api/blogs'
import type { ApiBlog } from '@/lib/types/api'
import { getProducts } from '@/lib/api/products'
import type { Product } from '@/data/products'
import { calculateDiscount, formatCurrency } from '@/lib/utils'

function normalizeExternalUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed || trimmed.toLowerCase() === 'string') return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return null
}

function getBlogExternalHref(blog: ApiBlog): string | null {
  // 1. Ưu tiên field url nếu là link ngoài
  const fromUrl = normalizeExternalUrl(blog.url)
  if (fromUrl) return fromUrl

  // 2. Nếu content là 1 URL (như trong Swagger), dùng luôn
  const content = (blog.content ?? '').trim()
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return content
  }

  return null
}

type ViewedBlog = {
  blogId: string
  title: string
  source?: string | null
  href: string
  thumbnailUrl?: string | null
  viewedAt: number
}

export default function NewsPage() {
  const [blogs, setBlogs] = useState<ApiBlog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [recentBlogs, setRecentBlogs] = useState<ViewedBlog[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getBlogs({ pageNumber: 1, pageSize: 10 })
      .then((res) => {
        if (!cancelled) setBlogs(res.items ?? [])
      })
      .catch((err) => {
        if (!cancelled) {
          setBlogs([])
          setError(err instanceof Error ? err.message : 'Không thể tải tin tức')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setProductsLoading(true)
    setProductsError(null)

    getProducts({ pageNumber: 1, pageSize: 6 })
      .then((res) => {
        if (cancelled) return
        setFeaturedProducts(res.items ?? [])
      })
      .catch((err) => {
        if (cancelled) return
        setFeaturedProducts([])
        setProductsError(err instanceof Error ? err.message : 'Không thể tải sản phẩm nổi bật')
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false)
      })

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('recentBlogs')
        if (raw) {
          const parsed = JSON.parse(raw) as ViewedBlog[]
          parsed.sort((a, b) => b.viewedAt - a.viewedAt)
          setRecentBlogs(parsed.slice(0, 5))
        }
      } catch {
        // ignore
      }
    }

    return () => {
      cancelled = true
    }
  }, [])

  const handleBlogClick = (blog: ApiBlog) => {
    if (typeof window === 'undefined') return
    const href = getBlogExternalHref(blog)
    if (!href) return

    const entry: ViewedBlog = {
      blogId: blog.blogId,
      title: blog.title,
      source: blog.source,
      href,
      thumbnailUrl: blog.thumbnailUrl,
      viewedAt: Date.now(),
    }

    setRecentBlogs((prev) => {
      const filtered = prev.filter((b) => b.blogId === entry.blogId ? false : true)
      const next = [entry, ...filtered].slice(0, 5)
      try {
        window.localStorage.setItem('recentBlogs', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const filteredBlogs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return blogs
    return blogs.filter((b) => {
      const title = (b.title ?? '').toLowerCase()
      const desc = (b.description ?? '').toLowerCase()
      const source = (b.source ?? '').toLowerCase()
      return title.includes(q) || desc.includes(q) || source.includes(q)
    })
  }, [blogs, search])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <nav className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
          <Link href="/" className="hover:text-primary-green">
            Trang chủ
          </Link>
          <span className="mx-1">{'>'}</span>
          <span className="font-medium text-gray-800">Tin tức</span>
        </nav>

        {error && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            Đang tải tin tức...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            Không có bài viết nào.
          </div>
        ) : (
          <>
            {/* Thanh danh mục giống tabs trên hình mẫu */}
            <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
              <div className="flex flex-wrap md:flex-nowrap gap-2 px-4 py-3 text-sm font-medium">
                <button className="px-3 py-1.5 rounded-full bg-primary-green text-white whitespace-nowrap">
                  Nông nghiệp 360
                </button>
                <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                  Tin tức sự kiện
                </button>
                <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                  Kiến thức nông nghiệp
                </button>
                <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                  Báo cáo sinh học
                </button>
                <button className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                  Giá cả thị trường
                </button>
              </div>
            </div>

            {(() => {
              const featured = filteredBlogs.slice(0, 3)
              const others = filteredBlogs.slice(3)

              const renderCard = (blog: ApiBlog, variant: 'featured' | 'normal') => {
                const href = getBlogExternalHref(blog)
                const thumb = normalizeExternalUrl(blog.thumbnailUrl)
                const isDisabled = !href

                const isFeatured = variant === 'featured'

                const CardInner = (
                  <div
                    className={`bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      isFeatured ? 'lg:flex lg:flex-col' : ''
                    }`}
                  >
                    <div
                      className={`relative w-full ${
                        isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'
                      } bg-gray-100 overflow-hidden`}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={blog.title}
                          className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50" />
                      )}
                      {isFeatured && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 py-3">
                          {blog.source && (
                            <p className="text-xs text-gray-200 mb-1 line-clamp-1">
                              {blog.source}
                            </p>
                          )}
                          <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2">
                            {blog.title}
                          </h3>
                        </div>
                      )}
                    </div>
                    {!isFeatured && (
                      <div className="p-4">
                        {blog.source && (
                          <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                            {blog.source}
                          </p>
                        )}
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-green text-sm">
                          {blog.title}
                        </h3>
                        {blog.description && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {blog.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )

                if (isDisabled) {
                  return (
                    <div key={blog.blogId} className="opacity-70">
                      {CardInner}
                    </div>
                  )
                }

                return (
                  <Link
                    key={blog.blogId}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={() => handleBlogClick(blog)}
                  >
                    {CardInner}
                  </Link>
                )
              }

              return (
                <>
                  {/* Hàng tin nổi bật phía trên */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                    {featured.map((blog) => renderCard(blog, 'featured'))}
                  </div>

                  {/* Danh sách tin bên dưới, layout giống cột trái của hình mẫu */}
                  <div className="grid grid-cols-1 lg:grid-cols-[2fr,minmax(260px,1fr)] gap-6">
                    <div className="space-y-4">
                      <h2 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        Nông nghiệp 360
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(others.length > 0 ? others : featured).map((blog) =>
                          renderCard(blog, 'normal')
                        )}
                      </div>
                    </div>

                    {/* Cột phải: sản phẩm nổi bật + tin đã xem */}
                    <div className="space-y-4">
                      {/* Sản phẩm nổi bật */}
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-primary-green text-white px-4 py-2 text-sm font-semibold">
                          Sản phẩm nổi bật
                        </div>
                        <div className="p-3 space-y-3">
                          {productsLoading ? (
                            <div className="text-xs text-gray-500">Đang tải sản phẩm...</div>
                          ) : productsError ? (
                            <div className="text-xs text-red-500">{productsError}</div>
                          ) : featuredProducts.length === 0 ? (
                            <div className="text-xs text-gray-500">
                              Chưa có sản phẩm nổi bật.
                            </div>
                          ) : (
                            (() => {
                              const [hero, ...rest] = featuredProducts
                              const listItems = rest.slice(0, 5)

                              const renderPriceRow = (product: Product) => {
                                const hasDiscount =
                                  product.originalPrice &&
                                  product.originalPrice > product.currentPrice
                                const discountPercent =
                                  hasDiscount && product.originalPrice
                                    ? calculateDiscount(
                                        product.originalPrice,
                                        product.currentPrice
                                      )
                                    : null

                                return (
                                  <div className="mt-1 flex items-center gap-1">
                                    <span className="text-xs font-semibold text-red-600">
                                      {formatCurrency(product.currentPrice)}
                                    </span>
                                    {hasDiscount && product.originalPrice && (
                                      <span className="text-[11px] text-gray-400 line-through">
                                        {formatCurrency(product.originalPrice)}
                                      </span>
                                    )}
                                    {discountPercent && (
                                      <span className="ml-1 text-[10px] text-white bg-red-500 rounded px-1">
                                        -{discountPercent}%
                                      </span>
                                    )}
                                  </div>
                                )
                              }

                              return (
                                <>
                                  {/* Product card lớn phía trên */}
                                  {hero && (
                                    <Link
                                      href={`/products/${hero.id}`}
                                      className="block group rounded-lg overflow-hidden mb-2 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                      <div className="relative w-full h-32 bg-white overflow-hidden flex items-center justify-center">
                                        <img
                                          src={hero.image}
                                          alt={hero.name}
                                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                          loading="lazy"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 py-2">
                                          <p className="text-[11px] text-gray-200 line-clamp-1">
                                            {hero.seller}
                                          </p>
                                          <p className="text-xs font-semibold text-white line-clamp-2">
                                            {hero.name}
                                          </p>
                                          <div className="mt-1">
                                            {renderPriceRow(hero)}
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                  )}

                                  {/* 5 product card nhỏ phía dưới */}
                                  <div className="space-y-2">
                                    {listItems.map((product) => (
                                      <Link
                                        key={product.id}
                                        href={`/products/${product.id}`}
                                        className="flex gap-2 group rounded-md px-1 py-1 transition-all duration-200 hover:bg-green-50 hover:-translate-y-0.5"
                                      >
                                        <div className="w-14 h-14 rounded-md overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
                                          <img
                                            src={product.image}
                                            alt={product.name}
                                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] text-gray-500 line-clamp-1">
                                            {product.seller}
                                          </p>
                                          <p className="text-xs text-gray-700 font-medium line-clamp-2 group-hover:text-primary-green">
                                            {product.name}
                                          </p>
                                          {renderPriceRow(product)}
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </>
                              )
                            })()
                          )}
                        </div>
                      </div>

                      {/* Tin tức đã xem */}
                      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-primary-green text-white px-4 py-2 text-sm font-semibold">
                          Tin tức đã xem
                        </div>
                        <div className="p-3 space-y-3 max-h-[260px] overflow-y-auto">
                          {recentBlogs.length === 0 ? (
                            <div className="text-xs text-gray-500">
                              Bạn chưa xem bài viết nào.
                            </div>
                          ) : (
                            recentBlogs.map((item) => (
                              <Link
                                key={item.blogId}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-2 group"
                              >
                                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                  {normalizeExternalUrl(item.thumbnailUrl) ? (
                                    <img
                                      src={normalizeExternalUrl(item.thumbnailUrl)!}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-50 to-yellow-50" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {item.source && (
                                    <p className="text-[11px] text-gray-500 line-clamp-1">
                                      {item.source}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-800 line-clamp-2 group-hover:text-primary-green">
                                    {item.title}
                                  </p>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}


