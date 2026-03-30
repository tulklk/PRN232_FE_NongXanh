'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Copy, Edit, Trash2, Loader2, X } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import SuccessPopup from '@/components/common/SuccessPopup'
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  type CreateVoucherInput,
  type UpdateVoucherInput,
} from '@/lib/api/vouchers'
import { useUser } from '@/contexts/UserContext'
import type { ApiVoucher } from '@/lib/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'

function normalizeStatus(status?: string): 'public' | 'hidden' {
  const s = (status ?? '').toLowerCase()
  if (s === 'active' || s === 'public') return 'public'
  return 'hidden'
}

function normalizeDiscountType(type?: string): 'amount' | 'percent' {
  const t = (type ?? '').toUpperCase()
  if (t === 'PERCENT') return 'percent'
  return 'amount'
}

export default function VouchersPage() {
  const { tokens } = useUser()
  const token = tokens?.idToken ?? undefined

  const [vouchers, setVouchers] = useState<ApiVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'public' | 'hidden'>('all')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editVoucher, setEditVoucher] = useState<ApiVoucher | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiVoucher | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const closeSuccessPopup = useCallback(() => setShowSuccessPopup(false), [])

  const fetchVouchers = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await getVouchers(1, 100, token)
      setVouchers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải voucher')
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchVouchers()
  }, [fetchVouchers])

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      (v.code ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const status = normalizeStatus(v.status)
    const matchesFilter = filter === 'all' || status === filter
    return matchesSearch && matchesFilter
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const handleCreate = async (data: CreateVoucherInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await createVoucher(
        {
          ...data,
          discountType: data.discountType === 'percent' ? 'PERCENT' : 'FIXED',
        },
        token
      )
      setShowAddModal(false)
      await fetchVouchers({ silent: true })
      setSuccessMessage('Đã tạo voucher')
      setShowSuccessPopup(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể tạo voucher')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdate = async (id: string, data: UpdateVoucherInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await updateVoucher(id, data, token)
      setEditVoucher(null)
      await fetchVouchers({ silent: true })
      setSuccessMessage('Đã cập nhật voucher')
      setShowSuccessPopup(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể cập nhật voucher')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await deleteVoucher(String(deleteTarget.voucherId), token)
      setDeleteTarget(null)
      await fetchVouchers({ silent: true })
      setSuccessMessage('Đã xóa voucher')
      setShowSuccessPopup(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể xóa voucher')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SuccessPopup
        message={successMessage}
        isOpen={showSuccessPopup}
        onClose={closeSuccessPopup}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QUẢN LÝ KHUYẾN MÃI</h1>
          <p className="text-gray-600">
            Mã giảm giá - Danh sách mã giảm giá đang áp dụng cho cửa hàng.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Tạo mã giảm giá
        </button>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">TÌM KIẾM VOUCHER</h2>
        <div className="space-y-4">
          <SearchBar
            placeholder="Tìm theo mã, tên voucher..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('public')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'public'
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang public
            </button>
            <button
              onClick={() => setFilter('hidden')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'hidden'
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang ẩn
            </button>
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Danh sách voucher ({filteredVouchers.length})
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-green" size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => void fetchVouchers()}
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Mã</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Loại giảm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Giá trị</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Đơn tối thiểu</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tối đa giảm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Hiệu lực</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((voucher) => {
                  const discountType = normalizeDiscountType(voucher.discountType)
                  const status = normalizeStatus(voucher.status)
                  return (
                    <tr
                      key={voucher.voucherId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{voucher.code}</span>
                          <button
                            onClick={() => handleCopyCode(voucher.code ?? '')}
                            className="p-1 text-gray-400 hover:text-primary-green transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{voucher.description || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {discountType === 'amount' ? 'Giảm tiền' : 'Giảm %'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">
                          {discountType === 'amount'
                            ? formatCurrency(voucher.discountValue ?? 0)
                            : `${voucher.discountValue ?? 0}%`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {(voucher.minOrderValue ?? 0) > 0
                            ? formatCurrency(voucher.minOrderValue!)
                            : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {(voucher.maxDiscount ?? 0) > 0
                            ? formatCurrency(voucher.maxDiscount!)
                            : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {voucher.startDate && voucher.endDate ? (
                            <>
                              <div>
                                Từ:{' '}
                                {formatDate(voucher.startDate)
                                  .replace(/\//g, ' tháng ')
                                  .replace(/(\d{2})\/(\d{4})/, '$1, $2')}
                              </div>
                              <div>
                                Đến:{' '}
                                {formatDate(voucher.endDate)
                                  .replace(/\//g, ' tháng ')
                                  .replace(/(\d{2})\/(\d{4})/, '$2')}
                              </div>
                            </>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={status}>
                          {status === 'public' ? 'Đang public' : 'Đang ẩn'}
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditVoucher(voucher)}
                            className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(voucher)}
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
          <VoucherFormModal
            title="Tạo mã giảm giá"
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
      {editVoucher &&
        typeof document !== 'undefined' &&
        createPortal(
          <VoucherFormModal
            title="Sửa mã giảm giá"
            initialData={editVoucher}
            onClose={() => {
              setEditVoucher(null)
              setSubmitError(null)
            }}
            onSubmit={(data) =>
              handleUpdate(String(editVoucher.voucherId), {
                ...data,
                voucherId: editVoucher.voucherId,
              })
            }
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
                Bạn có chắc muốn xóa voucher &quot;{deleteTarget.code}&quot;?
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
                  {submitLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : null}
                  Xóa
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

interface VoucherFormModalProps {
  title: string
  initialData?: ApiVoucher
  onClose: () => void
  onSubmit: (data: CreateVoucherInput & UpdateVoucherInput) => void
  loading: boolean
  error: string | null
}

function VoucherFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
  loading,
  error,
}: VoucherFormModalProps) {
  const [code, setCode] = useState(initialData?.code ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>(
    normalizeDiscountType(initialData?.discountType)
  )
  const [discountValue, setDiscountValue] = useState(
    String(initialData?.discountValue ?? '')
  )
  const [minOrderValue, setMinOrderValue] = useState(
    String(initialData?.minOrderValue ?? '')
  )
  const [maxDiscount, setMaxDiscount] = useState(
    String(initialData?.maxDiscount ?? '')
  )
  const [quantity, setQuantity] = useState(String(initialData?.quantity ?? '0'))
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().slice(0, 16)
      : ''
  )
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? new Date(initialData.endDate).toISOString().slice(0, 16)
      : ''
  )
  const [status, setStatus] = useState<'public' | 'hidden'>(
    normalizeStatus(initialData?.status)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !discountValue || Number(discountValue) < 0) return
    onSubmit({
      code: code.trim(),
      description: description.trim() || undefined,
      discountType: discountType === 'percent' ? 'PERCENT' : 'FIXED',
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      quantity: quantity ? Number(quantity) : undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      status: status === 'public' ? 'Active' : 'Hidden',
    })
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: SALE50K"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              required
              disabled={!!initialData}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả voucher..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percent')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            >
              <option value="amount">Giảm tiền (FIXED)</option>
              <option value="percent">Giảm % (PERCENT)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm</label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'amount' ? '50000' : '10'}
              min={0}
              step={discountType === 'percent' ? 1 : 1000}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              required
              disabled={loading}
            />
            {discountType === 'percent' && (
              <p className="text-xs text-gray-500 mt-1">Nhập % (1-100)</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
              <input
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="0"
                min={0}
                step={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tối đa giảm</label>
              <input
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="0"
                min={0}
                step={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              min={0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
          </div>

          {initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'public' | 'hidden')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              >
                <option value="public">Đang public</option>
                <option value="hidden">Đang ẩn</option>
              </select>
            </div>
          )}

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
              disabled={loading || !code.trim() || !discountValue}
              className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {initialData ? 'Cập nhật' : 'Tạo mã giảm giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
