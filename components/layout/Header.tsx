'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  ShoppingCart,
  Bell,
  Menu,
  X,
  Cloud,
  Share,
  User,
  Store,
  ShoppingBasket,
  Circle,
  CupSoda,
  Star,
  Leaf,
  Flower2,
} from 'lucide-react'
import { NAVIGATION_LINKS } from '@/lib/constants'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount] = useState(0)

  return (
    <header className="bg-primary-green text-white">
      {/* Top bar */}
      <div className="bg-primary-green-light py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span>HOTLINE 028 7770 2614</span>
              <Link href="/app" className="hover:underline flex items-center gap-1">
                <Cloud size={16} />
                Tải ứng dụng
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/collaborators" className="hover:underline flex items-center gap-1">
                <Share size={16} />
                Dành cho Cộng tác viên
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-primary-green-dark">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <div className="relative w-28 h-28">
                <Image
                  src="/images/logo.png"
                  alt="Nông Xanh Logo"
                  fill
                  className="object-contain"
                  sizes="112px"
                />
              </div>
            </Link>

            {/* Search bar - Centered */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập nội dung tìm kiếm"
                    className="w-full px-4 py-2 pl-4 pr-10 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/notifications" className="relative hover:opacity-80 flex items-center gap-1">
                <Bell size={20} />
                <span className="text-sm">Thông báo của tôi</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
              </Link>
              <Link href="/login" className="hover:opacity-80 flex items-center gap-1">
                <User size={20} />
                <span className="text-sm">Đăng nhập</span>
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/register" className="hover:opacity-80 text-sm">
                Đăng ký
              </Link>
              <Link href="/warehouse" className="hover:opacity-80 flex items-center gap-1">
                <Store size={20} />
                <span className="text-sm">Giao hàng từ kho: HCM</span>
              </Link>
              <Link href="/cart" className="relative hover:opacity-80">
                <ShoppingCart size={24} />
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-primary-green-dark">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-6 py-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Menu size={20} />
              <span className="font-semibold">DANH MỤC SẢN PHẨM</span>
            </button>
            <Link href="/products" className="flex items-center gap-2 hover:opacity-80">
              <ShoppingBasket size={18} />
              <span>ĐI CHỢ ONLINE</span>
            </Link>
            <Link href="/products?category=fruits" className="flex items-center gap-2 hover:opacity-80">
              <Circle size={18} />
              <span>TRÁI CÂY</span>
            </Link>
            <Link href="/products?category=tea-coffee" className="flex items-center gap-2 hover:opacity-80">
              <CupSoda size={18} />
              <span>TRÀ - CÀ PHÊ</span>
            </Link>
            <Link href="/products?category=specialties" className="flex items-center gap-2 hover:opacity-80">
              <Star size={18} />
              <span>ĐẶC SẢN</span>
            </Link>
            <Link href="/agrishow" className="flex items-center gap-2 hover:opacity-80">
              <Leaf size={18} />
              <span>AGRISHOW</span>
            </Link>
            <Link href="/my-farm" className="flex items-center gap-2 hover:opacity-80">
              <Flower2 size={18} />
              <span>MY FARM</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
