'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit, Trash2, Loader2, X } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/lib/api/users'
import { useUser } from '@/contexts/UserContext'
import type { ApiUser } from '@/lib/types/api'
import { formatDate } from '@/lib/utils'

function getRoleDisplay(role?: string | null): string {
  const r = (role ?? '').toLowerCase()
  if (r === 'admin') return 'Admin'
  return 'Khách hàng'
}

function getStatusDisplay(isActive: boolean): 'active' | 'inactive' {
  return isActive ? 'active' : 'inactive'
}

export default function UsersPage() {
  const { tokens } = useUser()
  const token = tokens?.idToken ?? undefined

  const [users, setUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editUser, setEditUser] = useState<ApiUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers(1, 100, token)
      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải danh sách người dùng'
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(
    (user) =>
      (user.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phoneNumber ?? '').includes(searchQuery)
  )

  const handleCreate = async (data: CreateUserInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await createUser(data, token)
      setShowAddModal(false)
      await fetchUsers()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể tạo người dùng'
      )
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdate = async (id: string, data: UpdateUserInput) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await updateUser(id, data, token)
      setEditUser(null)
      await fetchUsers()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể cập nhật người dùng'
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
      await deleteUser(deleteTarget.id, token)
      setDeleteTarget(null)
      await fetchUsers()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể xóa người dùng'
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
            Quản lý người dùng
          </h1>
          <p className="text-gray-600">
            Quản lý tất cả người dùng trong hệ thống
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm người dùng
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          TÌM KIẾM NGƯỜI DÙNG
        </h2>
        <SearchBar
          placeholder="Tìm theo email, họ tên hoặc số điện thoại..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Tất cả người dùng ({filteredUsers.length})
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-green" size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchUsers}
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
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Họ tên
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Số điện thoại
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Vai trò
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <span className="text-gray-900">{user.email ?? '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {user.displayName ?? '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {user.phoneNumber ?? 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status="active">
                        {getRoleDisplay(user.role)}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={getStatusDisplay(user.isActive)}>
                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">
                        {formatDate(user.createdAt)
                          .replace(/\//g, ' tháng ')
                          .replace(/(\d{2})\/(\d{4})/, '$1, $2')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <UserFormModal
            title="Thêm người dùng"
            onClose={() => {
              setShowAddModal(false)
              setSubmitError(null)
            }}
            onSubmit={
              handleCreate as (data: CreateUserInput | UpdateUserInput) => void
            }
            loading={submitLoading}
            error={submitError}
          />,
          document.body
        )}

      {/* Edit Modal */}
      {editUser &&
        typeof document !== 'undefined' &&
        createPortal(
          <UserFormModal
            title="Sửa người dùng"
            initialData={editUser}
            onClose={() => {
              setEditUser(null)
              setSubmitError(null)
            }}
            onSubmit={(data) => handleUpdate(editUser.id, data)}
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
                Bạn có chắc muốn xóa người dùng &quot;
                {deleteTarget.displayName || deleteTarget.email || deleteTarget.id}
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

interface UserFormModalProps {
  title: string
  initialData?: ApiUser
  onClose: () => void
  onSubmit: (data: CreateUserInput | UpdateUserInput) => void
  loading: boolean
  error: string | null
}

function UserFormModal({
  title,
  initialData,
  onClose,
  onSubmit,
  loading,
  error,
}: UserFormModalProps) {
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [displayName, setDisplayName] = useState(
    initialData?.displayName ?? ''
  )
  const [phoneNumber, setPhoneNumber] = useState(
    initialData?.phoneNumber ?? ''
  )
  const [provider, setProvider] = useState(initialData?.provider ?? 'Email')
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (initialData) {
      onSubmit({
        email: email.trim() || undefined,
        displayName: displayName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        isActive,
      })
    } else {
      if (!provider.trim()) return
      onSubmit({
        email: email.trim() || undefined,
        displayName: displayName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        provider: provider.trim(),
        isActive,
      })
    }
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0901234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            />
          </div>

          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                disabled={loading}
                required
              >
                <option value="Email">Email</option>
                <option value="Google">Google</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              disabled={loading}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
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
              disabled={loading || (!initialData && !provider.trim())}
              className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {initialData ? 'Cập nhật' : 'Thêm người dùng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
