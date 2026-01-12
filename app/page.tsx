import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import ProductGrid from '@/components/products/ProductGrid'
import HotDealCard from '@/components/products/HotDealCard'
import NewsCard from '@/components/news/NewsCard'
import { products } from '@/data/products'
import { newsArticles, newsCategories } from '@/data/news'

export default function HomePage() {
  const hotDeals = products.slice(0, 4)
  const regionalSpecialties = products.slice(4, 12)
  const featuredNews = newsArticles.slice(0, 2)

  return (
    <div className="bg-white">
      {/* Hero Banner */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">QUÀ TẾT TỰ CHỌN</h1>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Tự do lựa chọn những món quà Tết ý nghĩa cho người thân yêu. Bạn có thể chọn từng
                  món hàng, hương vị, màu sắc hộp và cả thông điệp gửi gắm. Chúng tôi sẽ đóng gói
                  và giao hàng tận nơi.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <Link
                    href="/products?category=tet-gifts"
                    className="bg-primary-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors"
                  >
                    BẮT ĐẦU CHỌN
                  </Link>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  4 Concept quà tặng tùy chỉnh
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <ChevronLeft size={20} />
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="relative w-full aspect-square bg-gradient-to-br from-red-50 to-pink-50 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl">🎁</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured News Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">TIN NỔI BẬT</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full aspect-video bg-gray-100">
                <Image
                  src="/images/persimmon.jpg"
                  alt="Hồng Treo Gió"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">
                  HỒNG TREO GIÓ 5000 TẶNG HỘP 150G
                </h3>
                <p className="text-lg font-bold text-primary-green">269K</p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="relative w-full aspect-video bg-gray-100">
                <Image
                  src="/images/macadamia.jpg"
                  alt="Macadamia"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-2">
                  MACCA TÚI 500G TẶNG 1 KẸO COFFEE AYA LBO
                </h3>
                <p className="text-lg font-bold text-primary-green">199K</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Tuyến sĩ quà Tết 2026 cùng Foodmap - Đồng hành cùng doanh nghiệp trong hành trình
              trao gửi tri ân và giá trị Việt
            </div>
          </div>
        </div>
      </section>

      {/* Hot Deals Section */}
      <section className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">GIÁ SỐC HÔM NAY</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>Bắt đầu sau</span>
                <span className="bg-red-500 text-white px-2 py-1 rounded font-mono">01</span>
                <span className="bg-red-500 text-white px-2 py-1 rounded font-mono">28</span>
                <span className="bg-red-500 text-white px-2 py-1 rounded font-mono">23</span>
              </div>
              <Link href="/products?sort=bestseller" className="text-primary-green hover:underline">
                Xem tất cả &gt;
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hotDeals.map((product) => (
                <HotDealCard key={product.id} product={product} />
              ))}
            </div>
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 border border-gray-200">
              <ChevronLeft size={24} />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 border border-gray-200">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Regional Specialties Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">ĐẶC SẢN VÙNG MIỀN</h2>
          <Link href="/products?category=specialties" className="text-primary-green hover:underline">
            Xem tất cả &gt;
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-bold text-center text-gray-900">
              Đặc sản khắp 63 tỉnh thành
            </h3>
          </div>
          <div className="lg:col-span-3">
            <div className="relative">
              <ProductGrid products={regionalSpecialties} columns={4} />
              <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 border border-gray-200">
                <ChevronLeft size={24} />
              </button>
              <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 border border-gray-200">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">TIN TỨC</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* News Categories Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-bold text-primary-green mb-4">Danh mục tin tức</h3>
                <ul className="space-y-2">
                  {newsCategories.map((category) => (
                    <li key={category}>
                      <Link
                        href={`/news?category=${category}`}
                        className="block py-2 px-3 rounded hover:bg-gray-100 text-sm text-gray-700"
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* News Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsArticles.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
