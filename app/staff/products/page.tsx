'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import { formatCurrency } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'
import { getAdminProducts } from '@/lib/api/products'

export default function StaffProductsPage() {
    const { tokens } = useUser()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [productList, setProductList] = useState<any[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                const items = await getAdminProducts(1, 100, undefined, tokens?.idToken)
                setProductList((items as any) || [])
                setError(null)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định'
                setError(errorMessage)
                setProductList([])
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [tokens])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-gray-600">Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-red-600">Lỗi: {error}</p>
            </div>
        )
    }

    const filteredProducts = productList.filter((product) => {
        const matchesSearch =
            (product.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.providerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.basePrice || 0).toString().includes(searchQuery)
        const matchesCategory = selectedCategory === 'all' || product.categoryName === selectedCategory
        return matchesSearch && matchesCategory
    })

    const categories = Array.from(new Set(productList.map((p) => p.categoryName).filter(Boolean)))

    const selectedProductData = productList.find((p) => p.productId === selectedProduct) || null

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

            {/* Products Table & Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Danh sách sản phẩm ({filteredProducts.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Hình ảnh</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Giá</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Loại</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Thương hiệu</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.productId}
                                        className={`border-b hover:bg-gray-50 cursor-pointer ${selectedProduct === product.productId ? 'bg-green-50' : ''
                                            }`}
                                        onClick={() => setSelectedProduct(product.productId)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                {product.productImages?.[0]?.imageUrl ? (
                                                    <img src={product.productImages[0].imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-gray-400 text-xs">IMG</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-gray-900 line-clamp-1">{product.productName}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-900 font-semibold">{formatCurrency(product.basePrice)}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-600 text-sm">{product.categoryName}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-600">{product.providerName || 'N/A'}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedProduct(product.productId)
                                                    }}
                                                    className="p-2 text-gray-600 hover:text-[#0A923C] hover:bg-green-50 rounded transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Chi tiết sản phẩm</h2>
                    {selectedProductData ? (
                        <div className="space-y-4">
                            <div className="text-center pb-4 border-b">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
                                    {selectedProductData.productImages?.[0]?.imageUrl ? (
                                        <img src={selectedProductData.productImages[0].imageUrl} alt={selectedProductData.productName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400">IMG</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg line-clamp-2">{selectedProductData.productName}</h3>
                                <p className="text-sm text-gray-600">{selectedProductData.categoryName}</p>
                            </div>

                            <div className="space-y-3 text-sm text-gray-600">
                                <div>
                                    <p className="font-semibold text-gray-900">Giá bán</p>
                                    <p className="font-bold text-[#0A923C] text-lg">{formatCurrency(selectedProductData.basePrice)}</p>
                                </div>

                                {selectedProductData.description && (
                                    <div>
                                        <p className="font-semibold text-gray-900">Mô tả</p>
                                        <p className="text-sm">{selectedProductData.description}</p>
                                    </div>
                                )}

                                {selectedProductData.origin && (
                                    <div>
                                        <p className="font-semibold text-gray-900">Nguồn gốc</p>
                                        <p>{selectedProductData.origin}</p>
                                    </div>
                                )}

                                {selectedProductData.unit && (
                                    <div>
                                        <p className="font-semibold text-gray-900">Đơn vị</p>
                                        <p>{selectedProductData.unit}</p>
                                    </div>
                                )}

                                {selectedProductData.status && (
                                    <div>
                                        <p className="font-semibold text-gray-900">Trạng thái</p>
                                        <p>{selectedProductData.status}</p>
                                    </div>
                                )}

                                {selectedProductData.isOrganic !== undefined && (
                                    <div>
                                        <p className="font-semibold text-gray-900">Hữu cơ</p>
                                        <p>{selectedProductData.isOrganic ? 'Có' : 'Không'}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="font-semibold text-gray-900">Nhà cung cấp</p>
                                    <p>{selectedProductData.providerName || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Chọn một sản phẩm để xem chi tiết
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
