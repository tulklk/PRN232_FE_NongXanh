'use client'

import Link from 'next/link'
import { ShoppingCart, Package, FolderTree, Users, AlertCircle } from 'lucide-react'
import AdminCard from '@/components/admin/AdminCard'
import { adminStats } from '@/data/admin'

export default function StaffDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">BẢNG ĐIỀU KHIỂN NHÂN VIÊN</h1>
        <p className="text-gray-600 mb-2">Xin chào, Nhân viên Nông Xanh</p>
        <p className="text-sm text-gray-500">
          Theo dõi đơn hàng, quản lý sản phẩm và hỗ trợ khách hàng.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          href="/staff/orders"
          className="bg-[#10723A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0A923C] transition-colors"
        >
          Quản lý đơn hàng
        </Link>
        <Link
          href="/staff/products"
          className="bg-[#0A923C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#10723A] transition-colors flex items-center gap-2"
        >
          <Package size={20} />
          Quản lý sản phẩm
        </Link>
      </div>

      {/* KPI Cards - Limited for Staff */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          description="Danh mục sản phẩm trong hệ thống"
        />
        <AdminCard
          icon={Users}
          title="Khách hàng"
          value="1,234"
          description="Tổng số khách hàng đã đăng ký"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng gần đây</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">#DH001234</p>
                <p className="text-sm text-gray-500">Nguyễn Văn A - 2 sản phẩm</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Đang xử lý
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">#DH001233</p>
                <p className="text-sm text-gray-500">Trần Thị B - 1 sản phẩm</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Đang giao
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">#DH001232</p>
                <p className="text-sm text-gray-500">Lê Văn C - 3 sản phẩm</p>
              </div>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Hoàn thành
              </span>
            </div>
          </div>
          <Link
            href="/staff/orders"
            className="mt-4 block text-center text-[#0A923C] hover:text-[#10723A] font-medium"
          >
            Xem tất cả đơn hàng →
          </Link>
        </div>

        {/* Revenue Notice */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Báo cáo doanh thu</h2>
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg">
            <AlertCircle size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 text-center mb-2">
              Báo cáo doanh thu chỉ dành cho Admin
            </p>
            <p className="text-sm text-gray-500 text-center">
              Vui lòng liên hệ quản lý để xem báo cáo chi tiết
            </p>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Công việc cần làm</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="font-medium text-orange-800">Đơn hàng chờ xác nhận</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">5</p>
            <Link href="/staff/orders?status=pending" className="text-sm text-orange-600 hover:underline">
              Xử lý ngay →
            </Link>
          </div>
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">Sản phẩm sắp hết hàng</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">3</p>
            <Link href="/staff/products?stock=low" className="text-sm text-blue-600 hover:underline">
              Kiểm tra →
            </Link>
          </div>
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">Tin tức chờ duyệt</span>
            </div>
            <p className="text-2xl font-bold text-green-900">2</p>
            <Link href="/staff/news?status=draft" className="text-sm text-green-600 hover:underline">
              Xem ngay →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
