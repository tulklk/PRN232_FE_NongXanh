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
  BarChart3,
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
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Products', href: '/admin/products', icon: ShoppingBag },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Vouchers', href: '/admin/vouchers', icon: Ticket },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image
              src="/images/logo.png"
              alt="Nông Xanh Logo"
              fill
              className="object-contain"
              sizes="40px"
            />
          </div>
          <div>
            <div className="font-bold text-gray-900">Nông Xanh</div>
            <div className="text-xs text-gray-500">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-green text-white'
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
          <div className="font-semibold text-gray-900">Nông Xanh Shop</div>
          <div className="text-sm text-gray-500">admin@nongxanh.vn</div>
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
