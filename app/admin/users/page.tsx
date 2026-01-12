'use client'

import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { mockUsers } from '@/data/admin'
import { formatDate } from '@/lib/utils'

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [userList] = useState(mockUsers)

  const filteredUsers = userList.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
        <p className="text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">TÌM KIẾM NGƯỜI DÙNG</h2>
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Họ tên</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Số điện thoại</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Vai trò</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ngày tạo</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{user.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{user.fullName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{user.phone || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={user.role === 'admin' ? 'active' : 'active'}>
                      {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                    </StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={user.status}>
                      {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
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
                      <button className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors">
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
