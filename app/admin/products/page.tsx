'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { uploadMultipleImages } from '@/lib/api/cloudinary'
import { getCategories } from '@/lib/api/categories'
import { getProviders } from '@/lib/api/providers'
import type { ApiCategory, ApiProduct, ApiProvider } from '@/lib/types/api'
import ProductVariantsModal from '@/components/products/ProductVariantsModal'

function getStatusDisplay(status?: string | null): 'active' | 'inactive' {
  const s = (status ?? '').toLowerCase()
  if (s === 'active' || s === 'hoạt động' || s === 'còn bán') return 'active'
  return 'inactive'
}

function getChildCategoryOptions(categories: ApiCategory[]): ApiCategory[] {
  const active = categories.filter((cat) => !cat.isDeleted)
  const byId = new Map<string, ApiCategory>()

  const add = (cat: ApiCategory) => {
    const key = String(cat.categoryId ?? '')
    if (!key) return
    byId.set(key, cat)
  }

  // Trường hợp API trả dạng phẳng: cate con có parentId
  active
    .filter((cat) => cat.parentId != null && cat.parentId !== 0)
    .forEach(add)

  // Trường hợp API trả dạng cây: cate con nằm trong children
  const collectChildren = (nodes: ApiCategory[]) => {
    nodes.forEach((node) => {
      const children = node.children ?? []
      children.forEach((child) => {
        add(child)
      })
      if (children.length > 0) collectChildren(children)
    })
  }
  collectChildren(active)

  return Array.from(byId.values())
}

function normalizeCategoryKey(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
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
  const [variantProduct, setVariantProduct] = useState<ApiProduct | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 7

  const fetchProducts = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await getAdminProducts(
        1,
        500,
        selectedCategory === 'all' ? undefined : selectedCategory,
        token
      )
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm')
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }, [selectedCategory, token])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const loadMeta = useCallback(async () => {
    try {
      const [cats, provs] = await Promise.all([getCategories(), getProviders(1, 100, token)])
      setCategories(cats)
      setProviders(provs)
    } catch (err) {
      console.error('Failed to load categories/providers', err)
    }
  }, [token])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

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

  useEffect(() => {
    setPageNumber(1)
  }, [searchQuery, selectedCategory])

  const totalPages = useMemo(() => {
    const total = filteredProducts.length
    return Math.max(1, Math.ceil(total / pageSize))
  }, [filteredProducts.length])

  const pageItems = useMemo(() => {
    const safeTotal = Math.max(1, totalPages)
    const cur = Math.min(Math.max(1, pageNumber), safeTotal)
    const range = 2

    const pageSet = new Set<number>()
    pageSet.add(1)
    pageSet.add(safeTotal)
    for (let p = cur - range; p <= cur + range; p++) {
      if (p >= 1 && p <= safeTotal) pageSet.add(p)
    }

    const sortedPages = Array.from(pageSet).sort((a, b) => a - b)
    const items: Array<number | '...'> = []
    for (let i = 0; i < sortedPages.length; i++) {
      const p = sortedPages[i]
      const prev = sortedPages[i - 1]
      if (i > 0 && prev != null && p - prev > 1) items.push('...')
      items.push(p)
    }
    return items
  }, [pageNumber, totalPages])

  const pagedProducts = useMemo(() => {
    const safeTotal = Math.max(1, totalPages)
    const cur = Math.min(Math.max(1, pageNumber), safeTotal)
    const start = (cur - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, pageNumber, totalPages])

  const handleCreate = async (data: CreateProductInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await createProduct(data, token)
      setShowAddModal(false)
      await Promise.all([fetchProducts({ silent: true }), loadMeta()])
      setPageNumber(1)
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
      await Promise.all([fetchProducts({ silent: true }), loadMeta()])
      setPageNumber(1)
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
      await fetchProducts({ silent: true })
      setPageNumber(1)
      setSuccessMessage('Đã xóa sản phẩm')
      setShowSuccessPopup(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể xóa sản phẩm')
    } finally {
      setSubmitLoading(false)
    }
  }

  const categoryOptions = getChildCategoryOptions(categories)
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
              onClick={() => void fetchProducts()}
              className="bg-primary-green text-white px-4 py-2 rounded-lg hover:bg-primary-green-dark"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto relative min-h-[120px]">
            {refreshing && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-[1px]"
                aria-busy="true"
              >
                <Loader2 className="animate-spin text-primary-green" size={28} />
              </div>
            )}
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
                {pagedProducts.map((product) => {
                  const primaryImage = product.productImages?.find((i) => i.isPrimary)
                  const imageUrl =
                    primaryImage?.imageUrl || product.productImages?.[0]?.imageUrl || ''
                  const productCategoryKey = normalizeCategoryKey(product.categoryId)
                  const matchedCategory = categories.find(
                    (c) => normalizeCategoryKey(c.categoryId) === productCategoryKey
                  )
                  const productAny = product as any
                  const categoryName =
                    matchedCategory?.categoryName ??
                    productAny.categoryName ??
                    productAny.category?.categoryName ??
                    productAny.category?.name ??
                    '-'
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
                            onClick={() => setVariantProduct(product)}
                            className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors"
                            title="Quản lý variants"
                          >
                            <span className="text-xs font-semibold">Variants</span>
                          </button>
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

      {!loading && !error && totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber === 1}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang trước
            </button>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {pageItems.map((item, idx) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                      ...
                    </span>
                  )
                }
                const p = item
                const isActive = p === pageNumber
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPageNumber(p)}
                    disabled={isActive}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isActive
                        ? 'bg-primary-green text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-100'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              disabled={pageNumber === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trang sau
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            Đang xem trang {pageNumber}/{totalPages} • {pageSize} sản phẩm/trang
          </p>
        </div>
      )}

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
      <ProductVariantsModal
        isOpen={Boolean(variantProduct)}
        product={variantProduct}
        token={token}
        onClose={() => setVariantProduct(null)}
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
  onSubmit: (data: CreateProductInput) => void | Promise<void>
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
  const categoryOptions = getChildCategoryOptions(categories)

  const existingImages =
    (initialData?.productImages as { imageUrl?: string; isPrimary?: boolean }[] | undefined) ??
    []
  const existingImageUrls = existingImages
    .slice()
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    .map((img) => img.imageUrl)
    .filter((url): url is string => Boolean(url))

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>(existingImageUrls)
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImageUrls)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (!files.length) return
    setUploadError(null)
    setImageFiles(files)
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)))
    setCurrentImageIndex(0)
    setUploading(true)
    try {
      const urls = await uploadMultipleImages(files)
      setImageUrls(urls)
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Không thể upload ảnh. Vui lòng thử lại.'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    if (index < 0 || index >= previewUrls.length) return

    const nextPreview = previewUrls.filter((_, i) => i !== index)
    const nextUrls = imageUrls.filter((_, i) => i !== index)

    setPreviewUrls(nextPreview)
    setImageUrls(nextUrls)

    if (nextPreview.length === 0) {
      setCurrentImageIndex(0)
      return
    }
    if (currentImageIndex >= nextPreview.length) {
      setCurrentImageIndex(nextPreview.length - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (uploading) {
      setUploadError('Vui lòng chờ upload ảnh hoàn tất trước khi lưu sản phẩm.')
      return
    }

    const payload: CreateProductInput = {
      name: name.trim(),
      description: description.trim() || null,
      origin: origin.trim() || null,
      unit: unit.trim() || null,
      basePrice: basePrice ? Number(basePrice) : 0,
      isOrganic,
      status: status.trim() || null,
      categoryId: categoryId || null,
      providerId: providerId || null,
      imageUrl: (imageUrls[0] as string | undefined) || null,
      imageUrls: imageUrls.length > 0 ? imageUrls : null,
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
          {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hình ảnh sản phẩm
            </label>
            <div className="space-y-3">
              <div className="w-full h-48 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 relative">
                {previewUrls.length > 0 ? (
                  <>
                    <img
                      src={previewUrls[currentImageIndex]}
                      alt={name || 'Ảnh sản phẩm'}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 text-[10px] text-white px-2 py-0.5">
                      {currentImageIndex === 0 ? 'Ảnh chính' : `Ảnh ${currentImageIndex + 1}`}
                    </span>
                    {previewUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentImageIndex(
                              (currentImageIndex - 1 + previewUrls.length) % previewUrls.length
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentImageIndex((currentImageIndex + 1) % previewUrls.length)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-400 text-center px-2">
                    Chưa có ảnh. Vui lòng chọn ảnh từ máy.
                  </span>
                )}
              </div>
              {previewUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previewUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border border-gray-200"
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex(index)}
                        className={`absolute inset-0 ${index === currentImageIndex ? 'ring-2 ring-primary-green' : ''}`}
                        aria-label={`Chọn ảnh ${index + 1}`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover rounded-md" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage(index)
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-black"
                        aria-label="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading || uploading}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-green file:text-white hover:file:bg-primary-green-dark disabled:opacity-50"
                />
                <p className="text-xs text-gray-500">
                  Có thể chọn nhiều ảnh cùng lúc. Nên dùng ảnh tỷ lệ ngang, dung lượng &lt; 2MB để
                  hiển thị đẹp.
                </p>
                {uploading && (
                  <p className="text-xs text-primary-green flex items-center gap-1">
                    <Loader2 size={14} className="animate-spin" />
                    Đang upload ảnh lên Cloudinary...
                  </p>
                )}
              </div>
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
                {categoryOptions.map((cat) => (
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

