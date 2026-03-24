'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { uploadImageToCloudinary } from '@/lib/api/cloudinary'
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  type CreateProviderInput,
  type UpdateProviderInput,
} from '@/lib/api/providers'
import { useUser } from '@/contexts/UserContext'
import type { ApiProvider } from '@/lib/types/api'
import { formatDate } from '@/lib/utils'

function getStatusDisplay(status?: string | null): 'active' | 'inactive' {
  const s = (status ?? '').toLowerCase()
  if (s === 'active' || s === 'hoạt động') return 'active'
  return 'inactive'
}

function resolveProviderImageSrc(provider: ApiProvider): string | null {
  const rawValue =
    (
      provider.imageUrl ??
      (provider as ApiProvider & { image?: string | null; logoUrl?: string | null }).image ??
      (provider as ApiProvider & { image?: string | null; logoUrl?: string | null }).logoUrl ??
      ''
    )
      .toString()
      .trim()

  if (!rawValue) return null
  if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) {
    return rawValue
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) return null

  // Hỗ trợ dữ liệu chỉ lưu public_id trên BE, FE tự build URL ảnh Cloudinary.
  return `https://res.cloudinary.com/${cloudName}/image/upload/${rawValue}`
}

export default function ProvidersPage() {
  const { tokens } = useUser()
  const token = tokens?.idToken ?? undefined

  const [providers, setProviders] = useState<ApiProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editProvider, setEditProvider] = useState<ApiProvider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiProvider | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProviders(1, 100, token)
      setProviders(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải danh sách nhà cung cấp'
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const filteredProviders = providers.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      (p.providerName ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.phoneNumber ?? '').toLowerCase().includes(q)
    )
  })

  const handleCreate = async (data: CreateProviderInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await createProvider(data, token)
      setShowAddModal(false)
      await fetchProviders()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể tạo nhà cung cấp'
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdate = async (id: number, data: UpdateProviderInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await updateProvider(id, data, token)
      setEditProvider(null)
      await fetchProviders()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể cập nhật nhà cung cấp'
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await deleteProvider(deleteTarget.providerId, token)
      setDeleteTarget(null)
      await fetchProviders()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể xóa nhà cung cấp'
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý nhà cung cấp
          </h1>
          <p className="text-gray-600">
            Quản lý tất cả nhà cung cấp sản phẩm trong hệ thống
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm nhà cung cấp
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          TÌM KIẾM NHÀ CUNG CẤP
        </h2>
        <SearchBar
          placeholder="Tìm theo tên, email hoặc số điện thoại..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Tất cả nhà cung cấp ({filteredProviders.length})
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-green" size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchProviders}
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Ảnh
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Tên nhà cung cấp
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Số điện thoại
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Địa chỉ
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Ngày tạo
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((p) => {
                  const imageSrc = resolveProviderImageSrc(p)
                  return (
                    <tr
                      key={p.providerId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                    <td className="py-3 px-4">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={p.providerName}
                          className="h-10 w-10 rounded-md object-cover border border-gray-200"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLSpanElement | null
                            if (fallback) fallback.style.display = 'inline'
                          }}
                        />
                      ) : null}
                      <span
                        className="text-gray-400"
                        style={{ display: imageSrc ? 'none' : 'inline' }}
                      >
                        -
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {p.providerName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {p.phoneNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {p.email || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {p.address || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={getStatusDisplay(p.status)}>
                        {p.status || 'Không hoạt động'}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {p.createdAt
                          ? formatDate(p.createdAt)
                              .replace(/\//g, ' tháng ')
                              .replace(/(\d{2})\/(\d{4})/, '$1, $2')
                          : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditProvider(p)}
                          className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
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
          <ProviderFormModal
            title="Thêm nhà cung cấp"
            onClose={() => {
              setShowAddModal(false)
              setSubmitError(null)
            }}
            onSubmit={
              handleCreate as (data: CreateProviderInput | UpdateProviderInput) => void
            }
            loading={submitLoading}
            error={submitError}
          />,
          document.body
        )}

      {/* Edit Modal */}
      {editProvider &&
        typeof document !== 'undefined' &&
        createPortal(
          <ProviderFormModal
            title="Sửa nhà cung cấp"
            initialData={editProvider}
            onClose={() => {
              setEditProvider(null)
              setSubmitError(null)
            }}
            onSubmit={(data) => handleUpdate(editProvider.providerId, data)}
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Xác nhận xóa
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc muốn xóa nhà cung cấp &quot;
                {deleteTarget.providerName}
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

interface ProviderFormModalProps {
  title: string
  initialData?: ApiProvider
  onClose: () => void
  onSubmit: (data: CreateProviderInput | UpdateProviderInput) => void
  loading: boolean
  error: string | null
}

function ProviderFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
  loading,
  error,
}: ProviderFormModalProps) {
  const [providerName, setProviderName] = useState(initialData?.providerName ?? '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? '')
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [address, setAddress] = useState(initialData?.address ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [status, setStatus] = useState(initialData?.status ?? 'Active')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadImageError, setUploadImageError] = useState<string | null>(null)

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadImageError(null)
    setUploadingImage(true)
    try {
      const uploadedUrl = await uploadImageToCloudinary(file)
      setImageUrl(uploadedUrl)
    } catch (err) {
      setUploadImageError(
        err instanceof Error ? err.message : 'Không thể upload ảnh lên Cloudinary'
      )
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!providerName.trim() || uploadingImage) return
    onSubmit({
      providerName: providerName.trim(),
      imageUrl: imageUrl.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      description: description.trim() || null,
      status: status.trim() || null,
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
          {uploadImageError && (
            <p className="text-red-600 text-sm">{uploadImageError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhà cung cấp
            </label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Nông Xanh Farm"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh nhà cung cấp
            </label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={loading || uploadingImage}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-green file:text-white hover:file:bg-primary-green-dark disabled:opacity-50"
              />
              {uploadingImage && (
                <p className="text-xs text-primary-green flex items-center gap-1">
                  <Loader2 size={14} className="animate-spin" />
                  Đang upload ảnh lên Cloudinary...
                </p>
              )}
              {imageUrl && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
                  <img
                    src={imageUrl}
                    alt={providerName || 'Provider'}
                    className="h-12 w-12 rounded-md border border-gray-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-500">{imageUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    disabled={loading || uploadingImage}
                    className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0906 337 965"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="provider@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Địa chỉ nhà cung cấp"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            />
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
              placeholder="Thông tin mô tả thêm về nhà cung cấp"
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
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Không hoạt động</option>
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
              disabled={loading || uploadingImage || !providerName.trim()}
              className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {initialData ? 'Cập nhật' : 'Thêm nhà cung cấp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

