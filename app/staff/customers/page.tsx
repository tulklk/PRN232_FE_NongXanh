'use client'

import { useState } from 'react'
import { Eye, Lock, Phone, Mail, MapPin } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { mockCustomers } from '@/data/customers'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function StaffCustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [customerList] = useState(mockCustomers)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  const filteredCustomers = customerList.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    const matchesFilter = filter === 'all' || customer.status === filter
    return matchesSearch && matchesFilter
  })

  const getSelectedCustomer = () => {
    return customerList.find((c) => c.id === selectedCustomer)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DANH SÁCH KHÁCH HÀNG</h1>
          <p className="text-gray-600">
            Xem thông tin khách hàng đã đăng ký trên hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-500">
          <Lock size={18} />
          <span className="text-sm">Chỉ xem thông tin (không chỉnh sửa)</span>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">TÌM KIẾM KHÁCH HÀNG</h2>
        <div className="space-y-4">
          <SearchBar
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-[#0A923C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({customerList.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'active'
                  ? 'bg-[#0A923C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoạt động ({customerList.filter((c) => c.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'inactive'
                  ? 'bg-[#0A923C] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Không hoạt động ({customerList.filter((c) => c.status === 'inactive').length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customers Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Danh sách khách hàng ({filteredCustomers.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Khách hàng</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">SĐT</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Đơn hàng</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tổng chi</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedCustomer === customer.id ? 'bg-green-50' : ''
                    }`}
                    onClick={() => setSelectedCustomer(customer.id)}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{customer.phone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#0A923C]">{customer.totalOrders}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900">{formatCurrency(customer.totalSpent)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={customer.status === 'active' ? 'paid' : 'pending'}>
                        {customer.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCustomer(customer.id)
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

        {/* Customer Details Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Chi tiết khách hàng</h2>
            {selectedCustomer ? (
              <div className="space-y-4">
                {(() => {
                  const customer = getSelectedCustomer()
                  if (!customer) return null
                  return (
                    <>
                      <div className="text-center pb-4 border-b border-gray-200">
                        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <span className="text-2xl font-bold text-[#0A923C]">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
                        <StatusBadge status={customer.status === 'active' ? 'paid' : 'pending'}>
                          {customer.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </StatusBadge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-600">
                          <Mail size={18} className="text-[#0A923C]" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                          <Phone size={18} className="text-[#0A923C]" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                        {customer.address && (
                          <div className="flex items-start gap-3 text-gray-600">
                            <MapPin size={18} className="text-[#0A923C] mt-0.5" />
                            <span className="text-sm">{customer.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Thống kê</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-[#0A923C]">{customer.totalOrders}</p>
                            <p className="text-xs text-gray-500">Đơn hàng</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-lg font-bold text-[#0A923C]">
                              {formatCurrency(customer.totalSpent).replace('₫', '')}
                            </p>
                            <p className="text-xs text-gray-500">Tổng chi tiêu</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          Ngày đăng ký: {formatDate(customer.registeredAt)}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Chọn một khách hàng để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
