'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderTree,
  ShoppingBag,
  ShoppingCart,
  Newspaper,
  Ticket,
  Users,
  Home,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/staff', icon: LayoutDashboard },
  { label: 'Đơn hàng', href: '/staff/orders', icon: ShoppingCart },
  { label: 'Sản phẩm', href: '/staff/products', icon: ShoppingBag },
  { label: 'Danh mục', href: '/staff/categories', icon: FolderTree },
  { label: 'Tin tức', href: '/staff/news', icon: Newspaper },
  { label: 'Vouchers', href: '/staff/vouchers', icon: Ticket },
  { label: 'Khách hàng', href: '/staff/customers', icon: Users },
]

export default function StaffSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/staff" className="block">
          <div className="relative w-full h-12 mb-2">
            <Image
              src="/images/logo.png"
              alt="Nông Xanh Logo"
              fill
              className="object-contain object-left [filter:brightness(0)_saturate(100%)_invert(36%)_sepia(93%)_saturate(1352%)_hue-rotate(118deg)_brightness(97%)_contrast(101%)]"
              sizes="200px"
              priority
            />
          </div>
          <div className="text-xs text-gray-700 font-medium">Staff Panel</div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/staff' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-[#0A923C] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-4 p-3 bg-white rounded-lg">
          <div className="font-semibold text-gray-900">Nhân viên</div>
          <div className="text-sm text-gray-500">staff@nongxanh.vn</div>
        </div>
        <div className="space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Home size={18} />
            <span className="text-sm">Quay về trang chủ</span>
          </Link>
          <button className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full">
            <LogOut size={18} />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
