'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { ApiProduct, ApiProductVariant } from '@/lib/types/api'
import {
  createProductVariant,
  deleteProductVariant,
  getProductVariants,
  updateProductVariant,
} from '@/lib/api/productVariants'
import { formatCurrency } from '@/lib/utils'

type VariantFormState = {
  variantName: string
  price: string
  stockQuantity: string
  sku: string
  status: string
}

const EMPTY_FORM: VariantFormState = {
  variantName: '',
  price: '',
  stockQuantity: '',
  sku: '',
  status: 'Active',
}

function mapVariantToForm(variant: ApiProductVariant): VariantFormState {
  return {
    variantName: variant.variantName ?? '',
    price: String(variant.price ?? 0),
    stockQuantity: String(variant.stockQuantity ?? 0),
    sku: variant.sku ?? '',
    status: variant.status ?? 'Active',
  }
}

interface ProductVariantsModalProps {
  isOpen: boolean
  product: ApiProduct | null
  token?: string
  readOnly?: boolean
  onClose: () => void
}

export default function ProductVariantsModal({
  isOpen,
  product,
  token,
  readOnly = false,
  onClose,
}: ProductVariantsModalProps) {
  const [variants, setVariants] = useState<ApiProductVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'inactive'>('all')

  const [showForm, setShowForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ApiProductVariant | null>(null)
  const [form, setForm] = useState<VariantFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const productId = product?.productId

  const loadVariants = async () => {
    if (!productId) return
    setLoading(true)
    setError(null)
    try {
      const list = await getProductVariants(productId, token)
      setVariants(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách biến thể')
      setVariants([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !productId) return
    loadVariants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId, token])

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setStatusTab('all')
      setShowForm(false)
      setEditingVariant(null)
      setForm(EMPTY_FORM)
      setDeleteId(null)
      setError(null)
    }
  }, [isOpen])

  const filteredVariants = useMemo(() => {
    const q = search.trim().toLowerCase()
    return variants.filter((variant) => {
      const status = (variant.status ?? '').toLowerCase()
      const byTab =
        statusTab === 'all' ||
        (statusTab === 'active' ? status === 'active' : status !== 'active')
      const bySearch =
        q.length === 0 ||
        (variant.variantName ?? '').toLowerCase().includes(q) ||
        (variant.sku ?? '').toLowerCase().includes(q)
      return byTab && bySearch
    })
  }, [search, statusTab, variants])

  const openCreateForm = () => {
    setEditingVariant(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEditForm = (variant: ApiProductVariant) => {
    setEditingVariant(variant)
    setForm(mapVariantToForm(variant))
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!productId || !form.variantName.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        variantName: form.variantName.trim(),
        price: Number(form.price || 0),
        stockQuantity: Number(form.stockQuantity || 0),
        sku: form.sku.trim() || null,
        status: form.status || 'Active',
      }

      if (editingVariant) {
        await updateProductVariant(editingVariant.variantId, payload, token)
      } else {
        await createProductVariant(productId, payload, token)
      }

      setShowForm(false)
      setEditingVariant(null)
      setForm(EMPTY_FORM)
      await loadVariants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu biến thể')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (variantId: number) => {
    setDeleteId(variantId)
    setError(null)
    try {
      await deleteProductVariant(variantId, token)
      await loadVariants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa biến thể')
    } finally {
      setDeleteId(null)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mt-10">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Quản lý variants</p>
            <h3 className="text-2xl font-bold text-gray-900">{product.productName}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusTab('all')}
                className={`px-3 py-1.5 rounded-md text-sm ${statusTab === 'all' ? 'bg-primary-green text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusTab('active')}
                className={`px-3 py-1.5 rounded-md text-sm ${statusTab === 'active' ? 'bg-primary-green text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusTab('inactive')}
                className={`px-3 py-1.5 rounded-md text-sm ${statusTab === 'inactive' ? 'bg-primary-green text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Inactive
              </button>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo SKU / VariantName"
                className="w-full md:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
              {!readOnly && (
                <button
                  onClick={openCreateForm}
                  className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus size={16} />
                  Tạo variant
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-16 flex items-center justify-center text-gray-600">
                <Loader2 size={22} className="animate-spin mr-2" />
                Đang tải biến thể...
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="py-16 text-center text-gray-500">Chưa có variant nào.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-sm text-gray-700">
                    <th className="text-left px-4 py-3">Tên variant</th>
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-left px-4 py-3">Giá</th>
                    <th className="text-left px-4 py-3">Tồn kho</th>
                    <th className="text-left px-4 py-3">Trạng thái</th>
                    {!readOnly && <th className="text-right px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredVariants.map((variant) => (
                    <tr key={variant.variantId} className="border-t border-gray-100 text-sm">
                      <td className="px-4 py-3 font-medium text-gray-900">{variant.variantName}</td>
                      <td className="px-4 py-3 text-gray-600">{variant.sku || '-'}</td>
                      <td className="px-4 py-3 text-gray-900">{formatCurrency(variant.price ?? 0)}</td>
                      <td className="px-4 py-3 text-gray-900">{variant.stockQuantity ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${String(variant.status).toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {variant.status || 'Inactive'}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditForm(variant)}
                              className="p-2 rounded hover:bg-green-50 text-gray-600 hover:text-primary-green"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(variant.variantId)}
                              disabled={deleteId === variant.variantId}
                              className="p-2 rounded hover:bg-red-50 text-gray-600 hover:text-red-600 disabled:opacity-60"
                            >
                              {deleteId === variant.variantId ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {!readOnly && showForm && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={form.variantName}
                onChange={(e) => setForm((prev) => ({ ...prev, variantName: e.target.value }))}
                placeholder="Tên variant"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Giá"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                min={0}
                value={form.stockQuantity}
                onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                placeholder="Tồn kho"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingVariant(null)
                  setForm(EMPTY_FORM)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || !form.variantName.trim()}
                className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark disabled:opacity-60 inline-flex items-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {editingVariant ? 'Cập nhật variant' : 'Tạo variant'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
