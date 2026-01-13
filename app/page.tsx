'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
import HotDealCard from '@/components/products/HotDealCard'
import { products } from '@/data/products'
import { newsArticles } from '@/data/news'

export default function HomePage() {
  const hotDeals = products.slice(0, 4)
  const tetProducts = products.slice(0, 10)
  const fruitProducts = products.slice(2, 9)
  
  // Countdown timer
  const [countdown, setCountdown] = useState({ hours: 1, minutes: 19, seconds: 33 })
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) {
          seconds = 59
          minutes--
        }
        if (minutes < 0) {
          minutes = 59
          hours--
        }
        if (hours < 0) {
          hours = 23
        }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="bg-[#F5F5F5]">
      {/* Hero Banner Section */}
      <section className="max-w-[1400px] mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Banner */}
          <div className="lg:col-span-3">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-red-800 via-red-700 to-red-600 h-[400px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <p className="text-2xl mb-2">BỘ SƯU TẬP</p>
                  <p className="text-3xl font-bold mb-4">QUÀ TẾT 2026</p>
                  <h1 className="text-5xl font-bold text-yellow-400 mb-6">MÃ ĐÁO THÀNH CÔNG</h1>
                  <div className="flex justify-center gap-4">
                    <div className="w-24 h-24 bg-white/20 rounded-lg"></div>
                    <div className="w-24 h-24 bg-white/20 rounded-lg"></div>
                    <div className="w-24 h-24 bg-white/20 rounded-lg"></div>
                  </div>
                </div>
              </div>
              {/* Navigation arrows */}
              <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <ChevronRight size={24} className="text-white" />
              </button>
            </div>
          </div>

          {/* Sidebar News */}
          <div className="space-y-3">
            <div className="bg-[#0A923C] text-white px-4 py-2 rounded-t-lg font-semibold">
              TIN NỔI BẬT
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="relative w-full aspect-video bg-gray-100">
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🎁</div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-800 line-clamp-2">
                  Tuyển sỉ quà Tết 2026 cùng Foodmap - Đồng...
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="relative bg-red-600 text-white p-3">
                <p className="text-sm font-bold">HỒNG TREO GIÓ 500G</p>
                <p className="text-xs">TẶNG HỘP 150G</p>
                <p className="text-2xl font-bold mt-2">giá 269K</p>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="relative bg-orange-100 p-3">
                <p className="text-sm font-bold text-gray-800">MACCA TÚI 500G</p>
                <p className="text-xs text-gray-600">TẶNG 1 KẸO COFFEE AYA 48G</p>
                <p className="text-2xl font-bold text-[#0A923C] mt-2">giá 199K</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Deals Section - GIÁ SỐC HÔM NAY */}
      <section className="bg-white py-6">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-[#0A923C] text-white px-6 py-3 rounded-full flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="font-bold text-lg">GIÁ SỐC HÔM NAY</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Bắt đầu sau</span>
              <div className="flex items-center gap-1">
                <span className="bg-[#0A923C] text-white px-3 py-2 rounded font-mono font-bold text-lg">
                  {formatTime(countdown.hours)}
                </span>
                <span className="text-[#0A923C] font-bold text-xl">:</span>
                <span className="bg-[#0A923C] text-white px-3 py-2 rounded font-mono font-bold text-lg">
                  {formatTime(countdown.minutes)}
                </span>
                <span className="text-[#0A923C] font-bold text-xl">:</span>
                <span className="bg-[#0A923C] text-white px-3 py-2 rounded font-mono font-bold text-lg">
                  {formatTime(countdown.seconds)}
                </span>
              </div>
              <Link href="/products?sort=hot-deals" className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hotDeals.map((product) => (
                <HotDealCard key={product.id} product={product} />
              ))}
            </div>
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* TET Collections Section */}
      <section className="py-8">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">TẾT BÌNH NGỌ COLLECTIONS</h2>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Bánh/Hạt</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Khô/Thịt</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Mứt/Trái cây sấy</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Trà Cà Phê</button>
              <Link href="/products?category=tet" className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-100 via-orange-50 to-amber-100 h-[150px] mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-4xl font-bold text-amber-700">TUYỂN CHỌN</h3>
                <p className="text-3xl font-bold text-amber-600">HƯƠNG VỊ NGÀY TẾT</p>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {tetProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 border border-gray-200">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Fresh Fruits Section - TRÁI CÂY TƯƠI NGON */}
      <section className="py-8 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">TRÁI CÂY TƯƠI NGON</h2>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Nội địa</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Nhập khẩu</button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">Trái cây sấy</button>
              <Link href="/products?category=fruits" className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm">
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Banner */}
          <div className="relative rounded-[40px] overflow-hidden bg-[#0A923C] h-[120px] mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <h3 className="text-4xl font-bold text-white tracking-wider">TRÁI CÂY TƯƠI NGON</h3>
            </div>
            {/* Decorative elements */}
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-6xl opacity-20">🍃</div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-6xl opacity-20">🍃</div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {fruitProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Agrishow Section */}
      <section className="py-8">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Agrishow Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[#0A923C] text-white rounded-lg overflow-hidden">
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-4">AGRISHOW</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/agrishow/360" className="text-white/90 hover:text-white text-sm">
                        Nông Nghiệp 360
                      </Link>
                    </li>
                    <li>
                      <Link href="/agrishow/stories" className="text-white/90 hover:text-white text-sm">
                        Câu Chuyện Và Nhân Vật
                      </Link>
                    </li>
                    <li>
                      <Link href="/agrishow/podcast" className="text-white/90 hover:text-white text-sm">
                        Podcast - Agrishow
                      </Link>
                    </li>
                    <li>
                      <Link href="/agrishow/experience" className="text-white/90 hover:text-white text-sm">
                        Trải Nghiệm Nông Nghiệp
                      </Link>
                    </li>
                    <li>
                      <Link href="/agrishow/agritech" className="text-white/90 hover:text-white text-sm">
                        Agritech
                      </Link>
                    </li>
                    <li>
                      <Link href="/agrishow/sustainable" className="text-white/90 hover:text-white text-sm">
                        Nông Nghiệp Bền Vững
                      </Link>
                    </li>
                    <li>
                      <Link href="/agrishow/export" className="text-white/90 hover:text-white text-sm">
                        Xuất Nhập Khẩu
                      </Link>
                    </li>
                    <li>
                      <Link href="/agrishow/farming" className="text-white/90 hover:text-white text-sm">
                        Trồng Cây Nuôi Con
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Main News */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="relative h-[300px] bg-gradient-to-r from-green-100 to-yellow-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">🎁 foodmap.asia</p>
                      <h3 className="text-2xl font-bold text-[#0A923C] mb-2">QUÀ TẾT 2026</h3>
                      <p className="text-lg font-medium text-gray-700">PHÙ ĐỔNG THIÊN VƯƠNG</p>
                      <div className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg inline-block">
                        CHIẾT KHẤU ĐẾN 30%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Tuyển sĩ quà Tết 2026 cùng Foodmap - Đồng hành cùng doanh nghiệp trong hành trình trao gửi tri ân và giá trị Việt
                  </h4>
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

            {/* Side News */}
            <div className="lg:col-span-1 space-y-4">
              {newsArticles.slice(0, 4).map((article) => (
                <Link key={article.id} href={`/news/${article.id}`} className="flex gap-3 group">
                  <div className="w-20 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100"></div>
                  </div>
                  <p className="text-sm text-gray-700 group-hover:text-[#0A923C] line-clamp-2">
                    {article.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
