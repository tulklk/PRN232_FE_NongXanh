'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import SuccessPopup from '@/components/common/SuccessPopup'
import { formatCurrency } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  type CreateProductInput,
  type UpdateProductInput,
  updateProduct,
} from '@/lib/api/products'
import { getCategories } from '@/lib/api/categories'
import { getProviders } from '@/lib/api/providers'
import type { ApiCategory, ApiProduct, ApiProvider } from '@/lib/types/api'

function getStatusDisplay(status?: string | null): 'active' | 'inactive' {
  const s = (status ?? '').toLowerCase()
  if (s === 'active' || s === 'hoạt động' || s === 'còn bán') return 'active'
  return 'inactive'
}

export default function ProductsPage() {
  const { tokens } = useUser()
  const token = tokens?.idToken ?? undefined

  const [products, setProducts] = useState<ApiProduct[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [providers, setProviders] = useState<ApiProvider[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState<ApiProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiProduct | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminProducts(
        1,
        100,
        selectedCategory === 'all' ? undefined : selectedCategory,
        token
      )
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, token])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [cats, provs] = await Promise.all([getCategories(), getProviders(1, 100, token)])
        setCategories(cats)
        setProviders(provs)
      } catch (err) {
        console.error('Failed to load categories/providers', err)
      }
    }
    loadMeta()
  }, [token])

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (p.productName ?? '').toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      (p.origin ?? '').toLowerCase().includes(q) ||
      String(p.basePrice ?? '').includes(searchQuery)
    const matchesCategory =
      selectedCategory === 'all' ||
      (p.categoryId != null && String(p.categoryId) === selectedCategory)

    return matchesSearch && matchesCategory
  })

  const handleCreate = async (data: CreateProductInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await createProduct(data, token)
      setShowAddModal(false)
      await fetchProducts()
      setSuccessMessage('Thêm sản phẩm thành công')
      setShowSuccessPopup(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể tạo sản phẩm')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdate = async (id: number, data: UpdateProductInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await updateProduct(String(id), data, token)
      setEditProduct(null)
      await fetchProducts()
      setSuccessMessage('Cập nhật sản phẩm thành công')
      setShowSuccessPopup(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể cập nhật sản phẩm')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await deleteProduct(String(deleteTarget.productId), token)
      setDeleteTarget(null)
      await fetchProducts()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể xóa sản phẩm')
    } finally {
      setSubmitLoading(false)
    }
  }

  const categoryOptions = categories
  const providerMap = new Map<string | number, string>()
  providers.forEach((p) => {
    providerMap.set(p.providerId, p.providerName)
  })

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
          <button
            onClick={() => {
              setShowAddModal(true)
              setSubmitError(null)
            }}
            className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">TÌM KIẾM SẢN PHẨM</h2>
        <SearchBar
          placeholder="Tìm theo tên, mô tả, xuất xứ hoặc giá bán..."
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
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
        >
          <option value="all">Tất cả danh mục</option>
          {categoryOptions.map((cat) => (
            <option key={cat.categoryId} value={String(cat.categoryId)}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Tất cả sản phẩm ({filteredProducts.length})
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-green" size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="bg-primary-green text-white px-4 py-2 rounded-lg hover:bg-primary-green-dark"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Hình ảnh</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Giá bán</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Danh mục</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Nhà cung cấp</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const primaryImage = product.productImages?.find((i) => i.isPrimary)
                  const imageUrl =
                    primaryImage?.imageUrl || product.productImages?.[0]?.imageUrl || ''
                  const categoryName =
                    categoryOptions.find(
                      (c) => c.categoryId != null && String(c.categoryId) === String(product.categoryId)
                    )?.categoryName ?? '-'
                  const providerName =
                    providerMap.get((product as any).providerId ?? '') ?? product.provider ?? '-'

                  return (
                    <tr
                      key={product.productId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.productName}
                              width={64}
                              height={64}
                              className="object-cover w-16 h-16"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">IMG</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{product.productName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">
                          {formatCurrency(product.basePrice ?? 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={getStatusDisplay(product.status)}>
                          {product.status || 'Không hoạt động'}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{categoryName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{providerName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditProduct(product)}
                            className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <ProductFormModal
            title="Thêm sản phẩm"
            categories={categories}
            providers={providers}
            onClose={() => {
              setShowAddModal(false)
              setSubmitError(null)
            }}
            onSubmit={handleCreate}
            loading={submitLoading}
            error={submitError}
          />,
          document.body
        )}

      {/* Edit Modal */}
      {editProduct &&
        typeof document !== 'undefined' &&
        createPortal(
          <ProductFormModal
            title="Sửa sản phẩm"
            initialData={editProduct}
            categories={categories}
            providers={providers}
            onClose={() => {
              setEditProduct(null)
              setSubmitError(null)
            }}
            onSubmit={(data) => handleUpdate(editProduct.productId, data)}
            loading={submitLoading}
            error={submitError}
          />,
          document.body
        )}

      {/* Delete Confirm */}
      {deleteTarget &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc muốn xóa sản phẩm &quot;
                {deleteTarget.productName}
                &quot;?
              </p>
              {submitError && (
                <p className="text-red-600 text-sm mb-4">{submitError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDeleteTarget(null)
                    setSubmitError(null)
                  }}
                  disabled={submitLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                  Xóa
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      <SuccessPopup
        message={successMessage}
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        duration={2000}
      />
    </div>
  )
}

interface ProductFormModalProps {
  title: string
  initialData?: ApiProduct
  categories: ApiCategory[]
  providers: ApiProvider[]
  onClose: () => void
  onSubmit: (data: CreateProductInput | UpdateProductInput) => void
  loading: boolean
  error: string | null
}

function ProductFormModal({
  title,
  initialData,
  categories,
  providers,
  onClose,
  onSubmit,
  loading,
  error,
}: ProductFormModalProps) {
  const [name, setName] = useState(initialData?.productName ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [origin, setOrigin] = useState(initialData?.origin ?? '')
  const [unit, setUnit] = useState(initialData?.unit ?? '')
  const [basePrice, setBasePrice] = useState(
    initialData?.basePrice != null ? String(initialData.basePrice) : ''
  )
  const [isOrganic, setIsOrganic] = useState<boolean>(initialData?.isOrganic ?? false)
  const [status, setStatus] = useState(initialData?.status ?? 'Active')
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId != null ? String(initialData.categoryId) : ''
  )
  const [providerId, setProviderId] = useState<string>(
    ((initialData as any)?.providerId as string | undefined) ?? ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload: CreateProductInput | UpdateProductInput = {
      name: name.trim(),
      description: description.trim() || null,
      origin: origin.trim() || null,
      unit: unit.trim() || null,
      basePrice: basePrice ? Number(basePrice) : 0,
      isOrganic,
      status: status.trim() || null,
      categoryId: categoryId || null,
      providerId: providerId || null,
    }

    onSubmit(payload)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên sản phẩm
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Khoai tây Đà Lạt"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá cơ bản
              </label>
              <input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="15000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn vị
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Kg, g, bó..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={String(cat.categoryId)}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhà cung cấp
              </label>
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              >
                <option value="">Chọn nhà cung cấp</option>
                {providers.map((p) => (
                  <option key={p.providerId} value={String(p.providerId)}>
                    {p.providerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xuất xứ
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Đà Lạt, Lâm Đồng..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                id="isOrganic"
                type="checkbox"
                checked={isOrganic}
                onChange={(e) => setIsOrganic(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 text-primary-green border-gray-300 rounded"
              />
              <label htmlFor="isOrganic" className="text-sm text-gray-700">
                Sản phẩm hữu cơ (Organic)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              placeholder="Mô tả chi tiết về sản phẩm..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            >
              <option value="Active">Đang bán</option>
              <option value="Inactive">Ngưng bán</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {initialData ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

