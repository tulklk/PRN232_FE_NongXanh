'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, Edit, Trash2 } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import { products } from '@/data/products'
import { formatCurrency } from '@/lib/utils'

export default function StaffProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [productList] = useState(products)

  const filteredProducts = productList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.currentPrice.toString().includes(searchQuery)
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(productList.map((p) => p.category)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QUẢN LÝ SẢN PHẨM</h1>
          <p className="text-gray-600">
            Sản phẩm - Danh sách toàn bộ sản phẩm đang kinh doanh trên cửa hàng.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/products"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Xem trên cửa hàng
          </Link>
          <button className="bg-[#0A923C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#10723A] transition-colors flex items-center gap-2">
            <Plus size={20} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">TÌM KIẾM SẢN PHẨM</h2>
        <SearchBar
          placeholder="Tìm theo tên, giá bán hoặc thương hiệu..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">LỌC THEO DANH MỤC GỐC</h2>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C]"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Hình ảnh</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Giá bán</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tồn kho</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Thương hiệu</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">IMG</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{formatCurrency(product.currentPrice)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-[#0A923C] text-sm font-semibold">
                      50
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{product.seller}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-600 hover:text-[#0A923C] hover:bg-green-50 rounded transition-colors">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-[#0A923C] hover:bg-green-50 rounded transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
