'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  MapPin,
  ShoppingCart,
  Leaf,
  Ticket,
  Heart,
  MessageSquare,
  Bell,
  LogOut,
  Share2,
} from 'lucide-react'

const menuItems = [
  { href: '/account/profile', label: 'Thông tin của tôi', icon: User },
  { href: '/account/addresses', label: 'Sổ địa chỉ', icon: MapPin },
  { href: '/account/orders', label: 'Đơn hàng của tôi', icon: ShoppingCart },
  { href: '/account/my-farm', label: 'My Farm', icon: Leaf },
  { href: '/account/vouchers', label: 'Voucher của tôi', icon: Ticket },
  { href: '/account/wishlist', label: 'Sản phẩm yêu thích', icon: Heart },
  { href: '/account/reviews', label: 'Nhận xét của tôi', icon: MessageSquare },
  { href: '/account/notifications', label: 'Thông báo của tôi', icon: Bell },
]

export default function AccountSidebar() {
  const pathname = usePathname()

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* User Info */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <p className="text-sm text-gray-500">Tài khoản</p>
        <p className="text-lg font-bold text-[#0A923C]">Thành Tú</p>
        <p className="text-sm text-gray-500 mt-1.5">tulkik32@gmail.com</p>
      </div>

      {/* Menu Items */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-green-50 text-[#0A923C] font-medium border-l-3 border-[#0A923C]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Logout */}
        <button className="flex items-center gap-3 px-4 py-3 rounded-md text-sm text-gray-600 hover:bg-gray-50 w-full">
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </nav>

      {/* Sell Button */}
      <button className="w-full mt-6 bg-[#0A923C] text-white py-3 px-6 rounded-md text-sm font-medium hover:bg-[#087a32] transition-colors flex items-center justify-center gap-2.5">
        <Share2 size={20} />
        <span>Bán hàng cùng Nông Xanh</span>
      </button>
    </div>
  )
}
