import Link from 'next/link'
import { CheckCircle, Package } from 'lucide-react'
import ProductGrid from '@/components/products/ProductGrid'
import { products } from '@/data/products'

export default function PaymentSuccessPage() {
  const similarProducts = products.slice(0, 5)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg border-4 border-blue-500 p-12 text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">THANH TOÁN THÀNH CÔNG</h1>
          <p className="text-gray-600 mb-8">
            Cảm ơn bạn đã mua sắm tại Nông Xanh. Đơn hàng của bạn đã được xác nhận và sẽ được xử
            lý sớm nhất.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/orders"
              className="bg-primary-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
            >
              <Package size={20} />
              THEO DÕI ĐƠN HÀNG
            </Link>
            <Link
              href="/products"
              className="bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              TIẾP TỤC MUA SẮM
            </Link>
          </div>
        </div>

        {/* Similar Products */}
        <section>
          <div className="bg-primary-green text-white py-4 px-6 rounded-t-lg">
            <h2 className="text-xl font-bold">CÁC SẢN PHẨM TƯƠNG TỰ</h2>
          </div>
          <div className="bg-white rounded-b-lg p-6">
            <ProductGrid products={similarProducts} columns={5} />
          </div>
        </section>
      </div>
    </div>
  )
}
