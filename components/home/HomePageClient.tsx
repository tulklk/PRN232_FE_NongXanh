'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import HotDealCard from '@/components/products/HotDealCard'
import { newsArticles } from '@/data/news'
import type { Product } from '@/data/products'
import { useInView } from '@/lib/hooks/useInView'

interface HomePageClientProps {
  products: Product[]
}

export default function HomePageClient({ products }: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'bestseller'>('new')
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
    const interval = setInterval(handleNextBanner, 3000)
    return () => clearInterval(interval)
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
            <div className="bg-[#0A923C] text-white px-4 py-2 rounded-t-lg font-semibold opacity-0 animate-fadeInUp" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>TIN NỔI BẬT</div>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm opacity-0 animate-fadeInUp hover:shadow-md hover:-translate-y-0.5 transition-all duration-300" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <div className="relative w-full aspect-video bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-float">🎁</div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-800 line-clamp-2">Tuyển sỉ quà Tết 2026 cùng Foodmap - Đồng...</p>
              </div>
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
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
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
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 transition-all duration-600 ${tetSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
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
          <div className={`relative rounded-2xl overflow-hidden min-h-[200px] h-[220px] sm:h-[260px] mb-6 transition-all duration-600 delay-150 ${tetSectionInView.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <Image
              src="/images/homepage/homeimg3.jpg"
              alt="Tuyển chọn hương vị ngày Tết"
              fill
              className="object-contain"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {tetProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={`transition-all duration-500 ${tetSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${200 + i * 50}ms` }}
                >
                  <ProductCard product={product} />
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
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 transition-all duration-600 ${fruitsSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
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
          <div className={`relative rounded-2xl overflow-hidden min-h-[200px] h-[220px] sm:h-[260px] mb-6 transition-all duration-600 delay-150 ${fruitsSectionInView.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <Image
              src="/images/homepage/homeimg4.png"
              alt="Trái cây tươi ngon"
              fill
              className="object-contain"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {fruitProducts.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-500 ${fruitsSectionInView.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${200 + i * 50}ms` }}
              >
                <ProductCard product={product} />
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
                {newsArticles.slice(0, 2).map((article) => (
                  <Link key={article.id} href={`/news/${article.id}`} className="block text-gray-700 hover:text-[#0A923C] text-sm py-2 border-b border-gray-100">
                    {article.title}
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              {newsArticles.slice(0, 4).map((article) => (
                <Link key={article.id} href={`/news/${article.id}`} className="flex gap-3 group">
                  <div className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100"></div>
                  </div>
                  <p className="text-sm text-gray-700 group-hover:text-[#0A923C] line-clamp-2">{article.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
