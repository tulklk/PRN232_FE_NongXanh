'use client'

import Link from 'next/link'
import { DollarSign, ShoppingCart, Package, FolderTree, TrendingUp } from 'lucide-react'
import AdminCard from '@/components/admin/AdminCard'
import { adminStats, mockRevenueData } from '@/data/admin'
import { formatCurrency } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const chartData = mockRevenueData.map((item) => ({
    date: format(new Date(item.date), 'dd/MM'),
    revenue: item.revenue / 1000000, // Convert to millions
    fullDate: item.date,
    fullRevenue: item.revenue,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">BẢNG ĐIỀU KHIỂN</h1>
        <p className="text-gray-600 mb-2">Xin chào, Nông Xanh Shop</p>
        <p className="text-sm text-gray-500">
          Theo dõi nhanh doanh thu, đơn hàng và trạng thái tồn kho để đảm bảo mọi thứ vận hành mượt
          mà.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          href="/admin/orders"
          className="bg-primary-green-dark text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green transition-colors"
        >
          Quản lý đơn hàng
        </Link>
        <Link
          href="/admin/products/new"
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
        >
          <Package size={20} />
          Thêm sản phẩm mới
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard
          icon={DollarSign}
          title="Doanh thu toàn thời gian"
          value={formatCurrency(adminStats.totalRevenue)}
          description={`${adminStats.totalOrders} đơn trong hệ thống`}
          trend={adminStats.revenueGrowth + ' so với tháng trước'}
        />
        <AdminCard
          icon={ShoppingCart}
          title="Đơn hàng đang xử lý"
          value={adminStats.processingOrders}
          description={`${adminStats.totalOrders} đơn trong hệ thống`}
        />
        <AdminCard
          icon={Package}
          title="Sản phẩm đang kinh doanh"
          value={adminStats.totalProducts}
          description={`${adminStats.totalProducts} sản phẩm`}
        />
        <AdminCard
          icon={FolderTree}
          title="Danh mục"
          value={adminStats.totalCategories}
          description="Tạo thêm danh mục để tổ chức sản phẩm"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Biểu đồ doanh thu</h2>
          <p className="text-sm text-gray-600">
            Xem xu hướng doanh thu theo ngày, tuần, quý hoặc năm.
          </p>
          <p className="text-lg font-semibold text-primary-green mt-2">
            Tổng doanh thu: {formatCurrency(adminStats.totalRevenue)}
          </p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#6b7280' }}
                label={{ value: 'Triệu VNĐ', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(data.fullDate), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-primary-green font-semibold">
                          Doanh thu: {formatCurrency(data.fullRevenue)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
