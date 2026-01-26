'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Bell, Menu, ChevronDown, Download, Users, User, QrCode, Cherry, Coffee, Star, Leaf, Sprout, LogOut } from 'lucide-react'
import LoginModal from '@/components/auth/LoginModal'
import RegisterModal from '@/components/auth/RegisterModal'
import SuccessPopup from '@/components/common/SuccessPopup'
import { useUser } from '@/contexts/UserContext'
import type { User as UserType, AuthTokens } from '@/contexts/UserContext'

export default function Header() {
    const router = useRouter()
    const { user, isAuthenticated, login, logout } = useUser()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [cartCount] = useState(1)
    const [showUserMenu, setShowUserMenu] = useState(false)
  
    // Login states
    const [loginLoading, setLoginLoading] = useState(false)
    const [loginError, setLoginError] = useState('')
    
    // Success popup states
    const [showSuccessPopup, setShowSuccessPopup] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const handleLogin = async (email: string, password: string) => {
        try {
            setLoginLoading(true)
            setLoginError('')

            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API không trả về JSON')
            }

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Đăng nhập thất bại')
            }

            // Extract user data and tokens
            const { tokens, ...userData } = data
            
            if (!tokens || !tokens.idToken) {
                throw new Error('Không nhận được tokens từ server')
            }

            // Use UserContext to store user data and tokens
            login(userData as UserType, tokens as AuthTokens)

            setIsLoginOpen(false)
            
            // Show success popup with user name
            const userName = (userData as UserType).displayName || 'bạn'
            setSuccessMessage(`Đăng nhập thành công!\nChào mừng ${userName}`)
            setShowSuccessPopup(true)
            
            // Navigate after popup
            setTimeout(() => {
                router.push('/account/profile')
            }, 500)
        } catch (err: any) {
            setLoginError(err.message || 'Đăng nhập thất bại')
        } finally {
            setLoginLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        setShowUserMenu(false)
        router.push('/')
    }

    return (
        <>
            <header className="sticky top-0 z-40">
                {/* Top bar - Dark Green */}
                <div className="bg-[#10723A] text-white py-1.5">
                    <div className="max-w-[1400px] mx-auto px-8">
                        <div className="flex items-center justify-between text-sm">
                            {/* Left - Hotline */}
                            <div className="flex items-center gap-2">
                                <span className="text-green-200">HOTLINE</span>
                                <span className="font-bold">028 7770 2614</span>
                            </div>
              
                            {/* Right - Links */}
                            <div className="flex items-center gap-6">
                                <button className="hover:text-yellow-300 flex items-center gap-1.5 transition-colors">
                                    <Download size={16} />
                                    <span>Tải ứng dụng</span>
                                </button>
                                <Link href="/collaborators" className="hover:text-yellow-300 flex items-center gap-1.5 transition-colors">
                                    <Users size={16} />
                                    <span>Dành cho Cộng tác viên</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main header - Green */}
                <div className="bg-[#0A923C] text-white">
                    <div className="max-w-[1400px] mx-auto px-8 py-3">
                        <div className="flex items-center gap-8">
                            {/* Logo */}
                            <Link href="/" className="flex items-center flex-shrink-0">
                                <div className="relative w-44 h-12">
                                    <Image
                                        src="/images/logo.png"
                                        alt="Nông Xanh Logo"
                                        fill
                                        className="object-contain object-left"
                                        sizes="176px"
                                        priority
                                    />
                                </div>
                            </Link>

                            {/* Search bar */}
                            <div className="flex-1 max-w-2xl">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Nhập nội dung tìm kiếm"
                                        className="w-full px-4 py-2.5 pr-12 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                                    />
                                    <button className="absolute right-0 top-0 h-full px-4 bg-white hover:bg-gray-50 rounded-r-md transition-colors border-l border-gray-200">
                                        <Search size={20} className="text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Right side actions */}
                            <div className="flex items-center gap-6 flex-shrink-0">
                                {/* Notifications */}
                                <Link href="/notifications" className="flex items-center gap-2 hover:text-yellow-300 transition-colors">
                                    <Bell size={20} />
                                    <span className="text-sm hidden lg:inline">Thông báo của tôi</span>
                                </Link>

                                {/* User */}
                                {isAuthenticated && user ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="flex items-center gap-2 hover:text-yellow-300 transition-colors"
                                        >
                                            <User size={20} />
                                            <span className="text-sm hidden lg:inline">{user.displayName || 'Tài khoản'}</span>
                                        </button>
                                        {showUserMenu && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                                <Link
                                                    href="/account"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Tài khoản của tôi
                                                </Link>
                                                <Link
                                                    href="/account/orders"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Đơn hàng
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <LogOut size={16} />
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsLoginOpen(true)}
                                        className="flex items-center gap-2 hover:text-yellow-300 transition-colors"
                                    >
                                        <User size={20} />
                                        <span className="text-sm">Đăng nhập</span>
                                    </button>
                                )}

                                {/* Warehouse location */}
                                <div className="hidden xl:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md">
                                    <QrCode size={18} />
                                    <span className="text-sm">Giao hàng từ kho:</span>
                                    <span className="text-yellow-300 font-semibold text-sm">Tân Phú</span>
                                </div>

                                {/* Cart */}
                                <Link href="/cart" className="relative hover:text-yellow-300 transition-colors">
                                    <ShoppingCart size={24} />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation bar - White background like Foodmap */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-[1400px] mx-auto px-8">
                        <nav className="flex items-center">
                            {/* Category Dropdown - Green background */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 bg-[#0A923C] text-white px-5 py-3 hover:bg-[#087a32] transition-colors"
                            >
                                <Menu size={20} />
                                <span className="font-semibold text-sm">DANH MỤC SẢN PHẨM</span>
                            </button>

                            {/* Navigation Links - spread evenly */}
                            <div className="flex items-center flex-1 justify-center">
                                <Link
                                    href="/products"
                                    className="flex items-center gap-2 px-5 py-3 text-gray-700 hover:text-[#0A923C] transition-colors text-sm font-medium"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <ShoppingCart size={12} className="text-white" />
                                    </div>
                                    <span>ĐI CHỢ ONLINE</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </Link>

                                <Link
                                    href="/products?category=fruits"
                                    className="flex items-center gap-2 px-5 py-3 text-gray-700 hover:text-[#0A923C] transition-colors text-sm font-medium"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <Cherry size={12} className="text-white" />
                                    </div>
                                    <span>TRÁI CÂY</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </Link>

                                <Link
                                    href="/products?category=tea-coffee"
                                    className="flex items-center gap-2 px-5 py-3 text-gray-700 hover:text-[#0A923C] transition-colors text-sm font-medium"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <Coffee size={12} className="text-white" />
                                    </div>
                                    <span>TRÀ - CÀ PHÊ</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </Link>

                                <Link
                                    href="/products?category=specialties"
                                    className="flex items-center gap-2 px-5 py-3 text-gray-700 hover:text-[#0A923C] transition-colors text-sm font-medium"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <Star size={12} className="text-white" />
                                    </div>
                                    <span>ĐẶC SẢN</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </Link>

                                <Link
                                    href="/agrishow"
                                    className="flex items-center gap-2 px-5 py-3 text-gray-700 hover:text-[#0A923C] transition-colors text-sm font-medium"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <Leaf size={12} className="text-white" />
                                    </div>
                                    <span>AGRISHOW</span>
                                    <ChevronDown size={14} className="text-gray-400" />
                                </Link>

                                <Link
                                    href="/my-farm"
                                    className="flex items-center gap-2 px-5 py-3 text-gray-700 hover:text-[#0A923C] transition-colors text-sm font-medium"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <Sprout size={12} className="text-white" />
                                    </div>
                                    <span>MY FARM</span>
                                </Link>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Login Modal */}
            <LoginModal 
                isOpen={isLoginOpen} 
                onClose={() => setIsLoginOpen(false)}
                onLogin={handleLogin}
                loading={loginLoading}
                error={loginError}
                onSwitchToRegister={() => {
                    setIsLoginOpen(false)
                    setIsRegisterOpen(true)
                }}
            />

            {/* Register Modal */}
            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSwitchToLogin={() => {
                    setIsRegisterOpen(false)
                    setIsLoginOpen(true)
                }}
                onRegisterSuccess={() => {
                    // Show success popup
                    setSuccessMessage('Đăng ký tài khoản thành công')
                    setShowSuccessPopup(true)
                    
                    // Close register modal and open login modal after popup
                    setTimeout(() => {
                        setIsRegisterOpen(false)
                        setIsLoginOpen(true)
                    }, 500)
                }}
            />

            {/* Success Popup */}
            <SuccessPopup
                message={successMessage}
                isOpen={showSuccessPopup}
                onClose={() => setShowSuccessPopup(false)}
                duration={2000}
            />
        </>
    )
} 