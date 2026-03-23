'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import HotDealCard from '@/components/products/HotDealCard'
import type { Product } from '@/data/products'
import { useInView } from '@/lib/hooks/useInView'
import { getBlogs } from '@/lib/api/blogs'
import type { ApiBlog } from '@/lib/types/api'

function normalizeExternalUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed || trimmed.toLowerCase() === 'string') return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  return trimmed
}

function getBlogExternalHref(blog: ApiBlog): string | null {
  const fromUrl = normalizeExternalUrl(blog.url)
  if (fromUrl) return fromUrl

  const content = (blog.content ?? '').trim()
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return content
  }

  return null
}

interface HomePageClientProps {
  products: Product[]
}

export default function HomePageClient({ products }: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'bestseller'>('new')
  const [featuredBlog, setFeaturedBlog] = useState<ApiBlog | null>(null)
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const [featuredError, setFeaturedError] = useState<string | null>(null)
  const newProducts = products.slice(0, 8)
  const bestsellerProducts = [...products]
    .sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0))
    .slice(0, 8)
  const tabProducts = activeTab === 'new' ? newProducts : bestsellerProducts

  const tetProducts = products.slice(0, 10)
  const fruitProducts = products.slice(0, 7)

  const banners = [
    '/images/homepage/homebanner1.jpg',
    '/images/homepage/homebanner2.jpg',
    '/images/homepage/homebanner3.jpg',
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  const hotDealsInView = useInView({ threshold: 0.1 })
  const tetSectionInView = useInView({ threshold: 0.1 })
  const fruitsSectionInView = useInView({ threshold: 0.1 })
  const agrishowInView = useInView({ threshold: 0.05 })

  const handleNextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const handlePrevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [banners.length])

  useEffect(() => {
    let cancelled = false
    setFeaturedLoading(true)
    setFeaturedError(null)

    getBlogs({ pageNumber: 1, pageSize: 10 })
      .then((res) => {
        if (cancelled) return
        const items = (res.items ?? []).filter((b) => getBlogExternalHref(b))
        if (items.length > 0) {
          const randomIndex = Math.floor(Math.random() * items.length)
          setFeaturedBlog(items[randomIndex])
        } else {
          setFeaturedBlog(null)
        }
      })
      .catch((err) => {
        if (cancelled) return
        setFeaturedBlog(null)
        setFeaturedError(err instanceof Error ? err.message : 'Không thể tải tin nổi bật')
      })
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="bg-[#F5F5F5]">
      {/* Hero Banner Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 opacity-0 animate-fadeInUp">
            <div className="relative rounded-xl overflow-hidden h-[220px] sm:h-[280px] md:h-[340px] lg:h-[400px]">
              <div className="absolute inset-0">
                <div
                  className="flex h-full w-full transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {banners.map((src) => (
                    <div key={src} className="relative h-full w-full flex-shrink-0">
                      <Image
                        src={src}
                        alt="Nongxanh homepage banner"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handlePrevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleNextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <ChevronRight size={24} className="text-gray-700" />
              </button>
            </div>
          </div>

          <div className="space-y-3 mt-4 lg:mt-0 lg:h-[400px] flex flex-col">
            <div
              className="bg-[#0A923C] text-white px-4 py-2 rounded-t-lg font-semibold opacity-0 animate-fadeInUp"
              style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
            >
              TIN NỔI BẬT
            </div>
            <div
              className="bg-white rounded-lg overflow-hidden shadow-sm opacity-0 animate-fadeInUp hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
            >
              {featuredLoading ? (
                <div className="animate-pulse">
                  <div className="relative w-full aspect-video bg-gray-100" />
                  <div className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ) : featuredBlog && getBlogExternalHref(featuredBlog) ? (
                <a
                  href={getBlogExternalHref(featuredBlog) ?? '#'}
                  className="block"
                >
                  <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                    {normalizeExternalUrl(featuredBlog.thumbnailUrl) ? (
                      <img
                        src={normalizeExternalUrl(featuredBlog.thumbnailUrl) as string}
                        alt={featuredBlog.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50" />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2">
                      {featuredBlog.source && (
                        <p className="text-[11px] text-gray-200 mb-1 line-clamp-1">
                          {featuredBlog.source}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-white mb-1 line-clamp-2">
                        {featuredBlog.title}
                      </p>
                      {featuredBlog.description && (
                        <p className="text-xs text-gray-100 line-clamp-2">
                          {featuredBlog.description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ) : (
                <div>
                  <div className="relative w-full aspect-video bg-gray-100">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {featuredError
                        ? 'Không thể tải tin nổi bật.'
                        : 'Chưa có tin nổi bật.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="relative rounded-lg overflow-hidden shadow-sm opacity-0 animate-fadeInUp hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 flex-1 min-h-[140px]" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <Image
                src="/images/homepage/homeimg1.jpg"
                alt="Hồng treo gió 500G - Tặng hộp 150G - giá 269K"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 400px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* New & Bestseller Tabs Section */}
      <section ref={hotDealsInView.ref} className="bg-white py-4 sm:py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 transition-all duration-700 ${hotDealsInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-[15px] sm:text-lg transition-colors ${
                  activeTab === 'new'
                    ? 'bg-[#0A923C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                SẢN PHẨM MỚI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bestseller')}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-[15px] sm:text-lg transition-colors ${
                  activeTab === 'bestseller'
                    ? 'bg-[#0A923C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                BÁN CHẠY NHẤT
              </button>
            </div>
            <Link
              href={activeTab === 'new' ? '/products?sort=newest' : '/products?sort=bestseller'}
              className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm sm:text-base"
            >
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {tabProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={`transition-all duration-500 ${hotDealsInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${150 + i * 80}ms` }}
                >
                  <HotDealCard product={product} />
                </div>
              ))}
            </div>
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* TET Collections Section */}
      <section ref={tetSectionInView.ref} className="py-6 sm:py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-1 sm:mb-4 transition-all duration-600 ${tetSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">TẾT BÌNH NGỌ COLLECTIONS</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Bánh/Hạt</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Khô/Thịt</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Mứt/Trái cây sấy</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Trà Cà Phê</button>
              <Link href="/products?category=tet" className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className={`relative rounded-2xl overflow-hidden min-h-[200px] h-[220px] sm:h-[260px] mb-0 sm:mb-6 transition-all duration-600 delay-150 ${tetSectionInView.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <Image
              src="/images/homepage/homeimg3.jpg"
              alt="Tuyển chọn hương vị ngày Tết"
              fill
              className="object-contain"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          </div>
          <div className="relative mt-1 sm:mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {tetProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={`transition-all duration-500 ${tetSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${200 + i * 50}ms` }}
                >
                  <ProductCard product={product} showWishlist={false} />
                </div>
              ))}
            </div>
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Fresh Fruits Section */}
      <section ref={fruitsSectionInView.ref} className="py-6 sm:py-8 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-1 sm:mb-4 transition-all duration-600 ${fruitsSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">TRÁI CÂY TƯƠI NGON</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Nội địa</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Nhập khẩu</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Trái cây sấy</button>
              <Link href="/products?category=fruits" className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className={`relative rounded-2xl overflow-hidden min-h-[200px] h-[220px] sm:h-[260px] mb-0 sm:mb-6 transition-all duration-600 delay-150 ${fruitsSectionInView.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <Image
              src="/images/homepage/homeimg4.png"
              alt="Trái cây tươi ngon"
              fill
              className="object-contain"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-1 sm:mt-0">
            {fruitProducts.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-500 ${fruitsSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${200 + i * 50}ms` }}
              >
                <ProductCard product={product} showWishlist={false} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agrishow Section */}
      <section ref={agrishowInView.ref} className="py-8">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 transition-all duration-700 ${agrishowInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="lg:col-span-1">
              <div className="bg-[#0A923C] text-white rounded-lg overflow-hidden">
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-4">AGRISHOW</h3>
                  <ul className="space-y-3">
                    <li><Link href="/agrishow/360" className="text-white/90 hover:text-white text-sm">Nông Nghiệp 360</Link></li>
                    <li><Link href="/agrishow/stories" className="text-white/90 hover:text-white text-sm">Câu Chuyện Và Nhân Vật</Link></li>
                    <li><Link href="/agrishow/podcast" className="text-white/90 hover:text-white text-sm">Podcast - Agrishow</Link></li>
                    <li><Link href="/agrishow/experience" className="text-white/90 hover:text-white text-sm">Trải Nghiệm Nông Nghiệp</Link></li>
                    <li><Link href="/agrishow/agritech" className="text-white/90 hover:text-white text-sm">Agritech</Link></li>
                    <li><Link href="/agrishow/sustainable" className="text-white/90 hover:text-white text-sm">Nông Nghiệp Bền Vững</Link></li>
                    <li><Link href="/agrishow/export" className="text-white/90 hover:text-white text-sm">Xuất Nhập Khẩu</Link></li>
                    <li><Link href="/agrishow/farming" className="text-white/90 hover:text-white text-sm">Trồng Cây Nuôi Con</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative h-[300px] bg-gradient-to-r from-green-100 to-yellow-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">🎁 foodmap.asia</p>
                      <h3 className="text-2xl font-bold text-[#0A923C] mb-2">QUÀ TẾT 2026</h3>
                      <p className="text-lg font-medium text-gray-700">PHÙ ĐỔNG THIÊN VƯƠNG</p>
                      <div className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg inline-block">CHIẾT KHẤU ĐẾN 30%</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Tuyển sĩ quà Tết 2026 cùng Foodmap - Đồng hành cùng doanh nghiệp trong hành trình trao gửi tri ân và giá trị Việt</h4>
                  <p className="text-sm text-gray-500">Đăng bởi <span className="text-[#0A923C]">Vu Vy</span> ngày 22/10/2025</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Link
                  href="/news"
                  className="block text-gray-700 hover:text-[#0A923C] text-sm py-2 border-b border-gray-100"
                >
                  Xem thêm tin tức tại NongXanh
                </Link>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <Link
                href="/news"
                className="flex gap-3 group"
              >
                <div className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100" />
                </div>
                <p className="text-sm text-gray-700 group-hover:text-[#0A923C] line-clamp-2">
                  Khám phá thêm các bài viết mới nhất tại mục Tin tức.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
