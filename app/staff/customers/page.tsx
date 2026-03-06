'use client'

import { useState, useEffect } from 'react'
import { Eye, Lock, Phone, Mail, MapPin } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'

interface Customer {
    id: string
    name: string
    email: string
    phone: string
    totalOrders: number
    totalSpent: number
    status: 'active' | 'inactive'
    registeredAt: string
    address: string
}

export default function StaffCustomersPage() {

    const { tokens } = useUser()

    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [customerList, setCustomerList] = useState<Customer[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

    useEffect(() => {

        const fetchCustomers = async () => {

            try {

                if (!tokens?.idToken) return

                const response = await fetch(
                    '/api/users?pageNumber=1&pageSize=100',
                    {
                        headers: {
                            Authorization: `Bearer ${tokens.idToken}`
                        }
                    }
                )

                if (!response.ok) {
                    throw new Error('Không thể tải danh sách khách hàng')
                }

                const data = await response.json()

                const mappedCustomers: Customer[] = (data.items || []).map((item: any) => ({
                    id: item.id,
                    name: item.displayName || 'N/A',
                    email: item.email || 'N/A',
                    phone: item.phoneNumber || 'N/A',
                    totalOrders: item.totalOrders ?? 0,
                    totalSpent: item.totalSpent ?? 0,
                    status: item.isActive ? 'active' : 'inactive',
                    registeredAt: item.createdAt || new Date().toISOString(),
                    address: item.address || 'N/A'
                }))

                setCustomerList(mappedCustomers)

            } catch (error) {
                console.error(error)
            }

        }

        fetchCustomers()

    }, [tokens])

    const filteredCustomers = customerList.filter((customer) => {

        const matchesSearch =
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery)

        const matchesFilter =
            filter === 'all' || customer.status === filter

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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        DANH SÁCH KHÁCH HÀNG
                    </h1>
                    <p className="text-gray-600">
                        Xem thông tin khách hàng đã đăng ký trên hệ thống
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-500">
                    <Lock size={18} />
                    <span className="text-sm">
                        Chỉ xem thông tin (không chỉnh sửa)
                    </span>
                </div>

            </div>

            {/* Search & Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6">

                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    TÌM KIẾM KHÁCH HÀNG
                </h2>

                <div className="space-y-4">

                    <SearchBar
                        placeholder="Tìm theo tên, email hoặc số điện thoại..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />

                    <div className="flex gap-2">

                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all'
                                    ? 'bg-[#0A923C] text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Tất cả ({customerList.length})
                        </button>

                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'active'
                                    ? 'bg-[#0A923C] text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Hoạt động ({customerList.filter(c => c.status === 'active').length})
                        </button>

                        <button
                            onClick={() => setFilter('inactive')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'inactive'
                                    ? 'bg-[#0A923C] text-white'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            Không hoạt động ({customerList.filter(c => c.status === 'inactive').length})
                        </button>

                    </div>

                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Table */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">

                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Danh sách khách hàng ({filteredCustomers.length})
                    </h2>

                    <table className="w-full">

                        <thead>

                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4">Khách hàng</th>
                                <th className="text-left py-3 px-4">SĐT</th>
                                <th className="text-left py-3 px-4">Đơn hàng</th>
                                <th className="text-left py-3 px-4">Tổng chi</th>
                                <th className="text-left py-3 px-4">Trạng thái</th>
                                <th className="text-right py-3 px-4">Thao tác</th>
                            </tr>

                        </thead>

                        <tbody>

                            {filteredCustomers.map((customer) => (

                                <tr
                                    key={customer.id}
                                    className={`border-b hover:bg-gray-50 cursor-pointer ${selectedCustomer === customer.id ? 'bg-green-50' : ''
                                        }`}
                                    onClick={() => setSelectedCustomer(customer.id)}
                                >

                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium">{customer.name}</div>
                                            <div className="text-sm text-gray-500">{customer.email}</div>
                                        </div>
                                    </td>

                                    <td className="py-3 px-4">{customer.phone}</td>

                                    <td className="py-3 px-4 font-semibold text-[#0A923C]">
                                        {customer.totalOrders}
                                    </td>

                                    <td className="py-3 px-4">
                                        {formatCurrency(customer.totalSpent)}
                                    </td>

                                    <td className="py-3 px-4">

                                        <StatusBadge
                                            status={customer.status === 'active' ? 'paid' : 'pending'}
                                        >
                                            {customer.status === 'active'
                                                ? 'Hoạt động'
                                                : 'Không hoạt động'}
                                        </StatusBadge>

                                    </td>

                                    <td className="py-3 px-4 text-right">

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedCustomer(customer.id)
                                            }}
                                            className="p-2 hover:bg-green-50 rounded"
                                        >
                                            <Eye size={18} />
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

                {/* Detail panel */}

                <div className="bg-white rounded-lg shadow-sm p-6">

                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Chi tiết khách hàng
                    </h2>

                    {selectedCustomer ? (

                        (() => {

                            const customer = getSelectedCustomer()
                            if (!customer) return null

                            return (

                                <div className="space-y-4">

                                    <div className="text-center pb-4 border-b">

                                        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-[#0A923C]">
                                                {customer.name.charAt(0)}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-lg">{customer.name}</h3>

                                        <StatusBadge
                                            status={customer.status === 'active' ? 'paid' : 'pending'}
                                        >
                                            {customer.status === 'active'
                                                ? 'Hoạt động'
                                                : 'Không hoạt động'}
                                        </StatusBadge>

                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">

                                        <div className="flex items-center gap-2">
                                            <Mail size={16} /> {customer.email}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Phone size={16} /> {customer.phone}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} /> {customer.address}
                                        </div>

                                    </div>

                                    <div className="pt-4 border-t text-sm text-gray-500">
                                        Ngày đăng ký: {formatDate(customer.registeredAt)}
                                    </div>

                                </div>

                            )

                        })()

                    ) : (

                        <div className="text-center py-8 text-gray-500">
                            Chọn một khách hàng để xem chi tiết
                        </div>

                    )}

                </div>

            </div>

        </div>

    )

}