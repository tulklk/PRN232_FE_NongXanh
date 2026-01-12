import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Package, Truck, Phone, MessageCircle } from 'lucide-react'
import ProductCard from '@/components/products/ProductCard'
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
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-primary-green">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary-green">
            Trái cây tươi ngon
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg mb-4">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-lg">
                  <Image
                    src={product.image}
                    alt={`${product.name} ${i}`}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 33vw, 16vw"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <RatingStars rating={averageRating} size={20} showNumber />
              <span className="text-sm text-gray-600">
                Xem {product.reviewCount} đánh giá
              </span>
              <span className="text-sm text-gray-600">{product.salesCount} đã bán</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-3xl font-bold text-primary-green">
                  {formatCurrency(product.currentPrice)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <span className="bg-red-500 text-white text-sm font-semibold px-2 py-1 rounded">
                      Giảm {discount}%
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-b border-gray-200 py-4 mb-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vận chuyển đến:</p>
                <p className="font-semibold">Quận 1 - TP. HCM</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phí vận chuyển:</p>
                <p className="font-semibold">35.000 ₫</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold mb-3">Đóng Gói:</p>
              <div className="flex gap-4">
                {['Trái', 'Combo 5 trái', 'Combo 10 Trái'].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="packaging"
                      value={option}
                      defaultChecked={option === 'Trái'}
                      className="mr-2 text-primary-green focus:ring-primary-green"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold mb-3">Số lượng:</p>
              <QuantitySelector defaultValue={1} />
            </div>

            <div className="flex gap-4 mb-6">
              <button className="flex-1 bg-primary-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center justify-center gap-2">
                <ShoppingCart size={20} />
                THÊM VÀO GIỎ HÀNG
              </button>
              <button className="flex-1 bg-primary-green-dark text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-green transition-colors">
                MUA NGAY
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Thông tin thêm:</p>
              <p className="text-sm text-gray-600 mb-3">
                Mua sỉ vui lòng liên hệ chúng tôi:
              </p>
              <div className="flex gap-2">
                <button className="flex-1 bg-primary-green text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-primary-green-dark flex items-center justify-center gap-2">
                  <Phone size={16} />
                  01234567899
                </button>
                <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-blue-600 flex items-center justify-center gap-2">
                  <MessageCircle size={16} />
                  Gửi tin nhắn
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <section className="mb-12">
          <div className="bg-primary-green text-white py-3 px-6 rounded-t-lg">
            <h2 className="text-lg font-semibold">Thông tin sản phẩm</h2>
          </div>
          <div className="border border-gray-200 rounded-b-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="relative w-full aspect-square bg-gray-100 rounded-lg">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">{product.description || product.name}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      Tại Sao Bạn Nên Chọn Dừa Sọ Tươi Của Foodmap?
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Tiện lợi tối đa - Khui là uống</li>
                      <li>• Size L (Từ 450gr) - Nhiều nước & cơm dày</li>
                      <li>• Cam kết vị ngọt thanh chuẩn vị dừa xiêm</li>
                      <li>• An toàn & tươi mới mỗi ngày</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {product.specifications && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold mb-4">Thông số kỹ thuật</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-semibold w-48">{key}:</span>
                      <span className="text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="mb-12">
          <div className="bg-primary-green text-white py-3 px-6 rounded-t-lg">
            <h2 className="text-lg font-semibold">Đánh giá sản phẩm</h2>
          </div>
          <div className="border border-gray-200 rounded-b-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-4xl font-bold text-primary-green mb-2">
                  {averageRating.toFixed(1)}★
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = productReviews.filter((r) => r.rating === star).length
                    const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-sm w-8">{star}★</span>
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <button className="bg-primary-green text-white px-6 py-2 rounded-lg hover:bg-primary-green-dark">
                GỬI ĐÁNH GIÁ CỦA BẠN
              </button>
            </div>
            <div className="space-y-4">
              {productReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-6">
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
          </div>
        </section>

        {/* Related Products */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">CÁC SẢN PHẨM TƯƠNG TỰ</h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </section>
      </div>
    </div>
  )
}
