import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Phone, MessageCircle, Heart } from 'lucide-react'
import ProductGrid from '@/components/products/ProductGrid'
import RatingStars from '@/components/common/RatingStars'
import QuantitySelector from '@/components/common/QuantitySelector'
import ReviewCard from '@/components/reviews/ReviewCard'
import { products } from '@/data/products'
import { reviews } from '@/data/reviews'
import { formatCurrency, calculateDiscount } from '@/lib/utils'

interface ProductDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const product = products.find((p) => p.id === id)

  if (!product) {
    notFound()
  }

  const productReviews = reviews.filter((r) => r.productId === product.id)
  const averageRating =
    productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
      : product.rating

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.currentPrice)
    : 0

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-8 py-5">
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-600 mb-4">
          <Link href="/" className="hover:text-primary-green">
            Trang chủ
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/products" className="hover:text-primary-green">
            Trái cây tươi ngon
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Product Images */}
          <div className="lg:col-span-5">
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg mb-3">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded cursor-pointer hover:ring-2 hover:ring-primary-green">
                  <Image
                    src={product.image}
                    alt={`${product.name} ${i}`}
                    fill
                    className="object-cover rounded"
                    sizes="(max-width: 768px) 25vw, 10vw"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5">
            <h1 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 mb-3 text-xs">
              <RatingStars rating={averageRating} size={14} showNumber />
              <span className="text-gray-400">|</span>
              <Link href="#reviews" className="text-primary-green hover:underline">
                Xem {product.reviewCount} đánh giá
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{product.salesCount} đã bán</span>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-xl font-bold text-primary-green">
                  {formatCurrency(product.currentPrice)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  </>
                )}
              </div>
              {discount > 0 && (
                <div className="inline-block">
                  <span className="border border-gray-300 text-gray-600 text-xs px-2 py-0.5 rounded">
                    Giảm {discount}%
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 text-xs mb-4">
              <div className="flex">
                <span className="text-gray-500 w-28">Vận chuyển đến:</span>
                <Link href="#" className="text-primary-green hover:underline">Quận 1 - Tp. HCM &gt;</Link>
              </div>
              <div className="flex">
                <span className="text-gray-500 w-28">Phí vận chuyển:</span>
                <span className="text-primary-green font-medium">35.000 ₫</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Đóng Gói:</p>
              <div className="flex flex-wrap gap-2">
                {['Combo 5 Gói', 'Combo 10 gói', 'Gói 70Gram', 'Combo 15 gói'].map((option, idx) => (
                  <button
                    key={option}
                    className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                      idx === 3
                        ? 'border-primary-green text-primary-green bg-green-50'
                        : 'border-gray-300 text-gray-700 hover:border-primary-green'
                    }`}
                  >
                    {idx === 3 && <span className="text-primary-green mr-1">✓</span>}
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Số lượng:</p>
              <QuantitySelector defaultValue={1} />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 border border-primary-green text-primary-green py-2 px-4 rounded text-xs font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5">
                THÊM VÀO GIỎ HÀNG
              </button>
              <button className="flex-1 bg-primary-green text-white py-2 px-4 rounded text-xs font-medium hover:bg-primary-green-dark transition-colors">
                MUA NGAY
              </button>
              <button className="p-2 border border-gray-300 rounded hover:border-red-400 hover:text-red-400 transition-colors">
                <Heart size={16} />
              </button>
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold mb-1.5">Thông tin thêm:</p>
              <p className="text-xs text-gray-500 mb-3">
                Mua sỉ vui lòng liên hệ chúng tôi:
              </p>
              <div className="space-y-2">
                <button className="w-full bg-primary-green text-white py-1.5 px-2 rounded text-xs font-medium hover:bg-primary-green-dark flex items-center justify-center gap-1.5">
                  <Phone size={12} />
                  028 777 02 614
                </button>
                <button className="w-full border border-primary-green text-primary-green py-1.5 px-2 rounded text-xs font-medium hover:bg-green-50 flex items-center justify-center gap-1.5">
                  <MessageCircle size={12} />
                  Gửi tin nhắn
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <section className="mb-8">
          <div className="bg-primary-green text-white py-2 px-4 rounded-t-lg">
            <h2 className="text-sm font-semibold">Thông tin sản phẩm</h2>
          </div>
          <div className="border border-gray-200 rounded-b-lg p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div>
                <h3 className="text-base font-bold mb-3">{product.description || product.name}</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-1.5">
                      Tại Sao Bạn Nên Chọn Sản Phẩm Của Nông Xanh?
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      <li>• Tiện lợi tối đa - Khui là uống</li>
                      <li>• Size L (Từ 450gr) - Nhiều nước & cơm dày</li>
                      <li>• Cam kết vị ngọt thanh chuẩn vị</li>
                      <li>• An toàn & tươi mới mỗi ngày</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {product.specifications && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold mb-3">Thông số kỹ thuật</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium w-36 text-gray-600">{key}:</span>
                      <span className="text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="mb-8">
          <div className="bg-primary-green text-white py-2 px-4 rounded-t-lg">
            <h2 className="text-sm font-semibold">Đánh giá sản phẩm</h2>
          </div>
          <div className="border border-gray-200 rounded-b-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-primary-green mb-1.5">
                  {averageRating.toFixed(1)}★
                </div>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = productReviews.filter((r) => r.rating === star).length
                    const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-1.5 text-xs">
                        <span className="w-6">{star}★</span>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-gray-500 w-6">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <button className="bg-primary-green text-white px-4 py-1.5 rounded text-xs hover:bg-primary-green-dark">
                GỬI ĐÁNH GIÁ CỦA BẠN
              </button>
            </div>
            <div className="space-y-3">
              {productReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <button className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">
                Trước
              </button>
              <button className="px-3 py-1 bg-primary-green text-white rounded text-xs">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-100">
                Sau
              </button>
            </div>
          </div>
        </section>

        {/* Related Products */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">CÁC SẢN PHẨM TƯƠNG TỰ</h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </section>
      </div>
    </div>
  )
}
