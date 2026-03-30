'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FolderTree,
  ShoppingBag,
  ShoppingCart,
  BookOpen,
  Newspaper,
  Ticket,
  BarChart3,
  Users,
  Truck,
  MessageSquare,
  Home,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import SidebarNotificationBell from '@/components/layout/SidebarNotificationBell'

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
  { label: 'Recipes', href: '/admin/recipes', icon: BookOpen },
  { label: 'Support Chat', href: '/admin/support-chat', icon: MessageSquare },
  { label: 'News', href: '/admin/news', icon: Newspaper },
  { label: 'Vouchers', href: '/admin/vouchers', icon: Ticket },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Providers', href: '/admin/providers', icon: Truck },
  { label: 'Users', href: '/admin/users', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="block">
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
          <div className="text-xs text-gray-700 font-medium">Admin Panel</div>
        </Link>
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
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-white p-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900">
              {user?.displayName || 'Nông Xanh Shop'}
            </div>
            <div className="text-sm text-gray-500">{user?.email || 'admin@nongxanh.vn'}</div>
          </div>
          <SidebarNotificationBell href="/admin/notifications" />
        </div>
        <div className="space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Home size={18} />
            <span className="text-sm">Quay về trang chủ</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left"
          >
            <LogOut size={18} />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
