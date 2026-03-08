'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Bell, Menu, ChevronDown, Download, Users, User, QrCode, Cherry, Leaf, Sprout, LogOut } from 'lucide-react'
import LoginModal from '@/components/auth/LoginModal'
import RegisterModal from '@/components/auth/RegisterModal'
import SuccessPopup from '@/components/common/SuccessPopup'
import CartPopup from '@/components/cart/CartPopup'
import { useUser } from '@/contexts/UserContext'
import { useCart } from '@/contexts/CartContext'
import type { User as UserType, AuthTokens } from '@/contexts/UserContext'
import { getCategories } from '@/lib/api/categories'
import type { ApiCategory } from '@/lib/types/api'

export default function Header() {
    const router = useRouter()
    const { user, isAuthenticated, login, logout } = useUser()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [categorySubmenuHovered, setCategorySubmenuHovered] = useState<number | null>(null)
    const [categories, setCategories] = useState<ApiCategory[]>([])
    const [isLoginOpen, setIsLoginOpen] = useState(false)
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const { cart, cartCount, loading: cartLoading, updateItem, removeItem } = useCart()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showCartPopup, setShowCartPopup] = useState(false)
    const cartPopupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const userMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleCategoryMenuEnter = () => {
        setIsMenuOpen(true)
    }
    const handleCategoryMenuLeave = () => {
        setIsMenuOpen(false)
        setCategorySubmenuHovered(null)
    }

    const handleUserMenuEnter = () => {
        if (userMenuTimeoutRef.current) {
            clearTimeout(userMenuTimeoutRef.current)
            userMenuTimeoutRef.current = null
        }
        setShowUserMenu(true)
    }
    const handleUserMenuLeave = () => {
        userMenuTimeoutRef.current = setTimeout(() => setShowUserMenu(false), 150)
    }

    const handleCartMouseEnter = () => {
        if (cartPopupTimeoutRef.current) {
            clearTimeout(cartPopupTimeoutRef.current)
            cartPopupTimeoutRef.current = null
        }
        setShowCartPopup(true)
    }
    const handleCartMouseLeave = () => {
        cartPopupTimeoutRef.current = setTimeout(() => setShowCartPopup(false), 150)
    }

    useEffect(() => {
        return () => {
            if (cartPopupTimeoutRef.current) clearTimeout(cartPopupTimeoutRef.current)
            if (userMenuTimeoutRef.current) clearTimeout(userMenuTimeoutRef.current)
        }
    }, [])
  
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

            // Redirect: Admin -> /admin, Staff -> /staff, User -> /account/profile
            const role = (userData as UserType).role
            const redirectPath =
                role === 'Admin' ? '/admin' : (role?.toLowerCase() === 'staff') ? '/staff' : '/account/profile'
            setTimeout(() => {
                router.push(redirectPath)
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

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(() => setCategories([]))
    }, [])

    // Logic riêng cho header:
    // - Xác định danh mục cha bằng parentId null/undefined
    // - Tự build danh sách con từ mảng phẳng dựa trên parentId
    const activeCategories = categories.filter((c) => !c.isDeleted)
    const topLevelCategories = activeCategories.filter(
        (c) => c.parentId === null || c.parentId === undefined || c.parentId === 0
    )

    const buildChildrenForCategory = (parent: ApiCategory) => {
        // Ưu tiên children nếu API có sẵn
        if (parent.children && parent.children.length > 0) {
            return parent.children.filter((c) => !c.isDeleted)
        }
        // Nếu không, tự lấy theo parentId từ list phẳng (so sánh dạng string để tránh lệch kiểu)
        const parentKey = String(parent.categoryId)
        return activeCategories.filter((c) => {
            if (c.parentId === null || c.parentId === undefined) return false
            return String(c.parentId) === parentKey && !c.isDeleted
        })
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
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
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
                            <div className="w-full md:flex-1 md:max-w-2xl">
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
                            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 flex-shrink-0 w-full md:w-auto">
                                {/* Notifications */}
                                <Link href="/notifications" className="flex items-center gap-2 hover:text-yellow-300 transition-colors">
                                    <Bell size={20} />
                                    <span className="text-sm hidden lg:inline">Thông báo của tôi</span>
                                </Link>

                                {/* User - mở menu khi hover */}
                                {isAuthenticated && user ? (
                                    <div
                                        className="relative"
                                        onMouseEnter={handleUserMenuEnter}
                                        onMouseLeave={handleUserMenuLeave}
                                    >
                                        <button
                                            type="button"
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
                                                {user.role === 'Admin' && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setShowUserMenu(false)}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Quản trị
                                                    </Link>
                                                )}
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
                                <div
                                    className="relative"
                                    onMouseEnter={handleCartMouseEnter}
                                    onMouseLeave={handleCartMouseLeave}
                                >
                                    <Link href="/cart" className="relative hover:text-yellow-300 transition-colors inline-flex">
                                        <ShoppingCart size={24} />
                                        {cartCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                                {cartCount}
                                            </span>
                                        )}
                                    </Link>
                                    {showCartPopup && (
                                        <CartPopup
                                            items={cart?.cartItems ?? []}
                                            totalAmount={cart?.totalAmount ?? 0}
                                            loading={cartLoading}
                                            onUpdateQuantity={updateItem}
                                            onRemoveItem={removeItem}
                                            onClose={() => setShowCartPopup(false)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation bar - White background like Foodmap */}
                <div className="bg-white border-b border-gray-200 shadow-sm relative">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
                        <nav className="flex items-center gap-2">
                            {/* Category Dropdown - Green background, mở khi hover */}
                            <div
                                className="relative"
                                onMouseEnter={handleCategoryMenuEnter}
                                onMouseLeave={handleCategoryMenuLeave}
                            >
                                <button
                                    type="button"
                                    className="flex items-center gap-2 bg-[#0A923C] text-white px-4 py-2.5 hover:bg-[#087a32] transition-colors"
                                    onClick={() => setIsMenuOpen((prev) => !prev)}
                                    onMouseEnter={handleCategoryMenuEnter}
                                >
                                    <Menu size={18} />
                                    <span className="font-semibold text-xs">DANH MỤC SẢN PHẨM</span>
                                    <ChevronDown size={12} className={isMenuOpen ? 'rotate-180' : ''} />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute left-0 top-full z-50 mt-0 bg-white border border-gray-200 shadow-lg max-h-[70vh]">
                                        <div className="flex">
                                            {/* Cột danh mục cha */}
                                            <div className="w-64 py-2 max-h-[70vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                                <Link
                                                    href="/products"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#0A923C]"
                                                >
                                                    Tất cả sản phẩm
                                                </Link>
                                                {topLevelCategories.map((cat) => {
                                                    const children = buildChildrenForCategory(cat)
                                                    const hasChildren = children.length > 0
                                                    const isActiveParent = categorySubmenuHovered === cat.categoryId

                                                    return (
                                                        <button
                                                            key={cat.categoryId}
                                                            type="button"
                                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 ${
                                                                isActiveParent ? 'bg-gray-100 text-[#0A923C]' : 'text-gray-700'
                                                            }`}
                                                            onMouseEnter={() => {
                                                                setCategorySubmenuHovered(cat.categoryId)
                                                            }}
                                                            onClick={() => {
                                                                // Nếu không có con thì đi thẳng tới trang category
                                                                if (!hasChildren) {
                                                                    setIsMenuOpen(false)
                                                                    router.push(`/products?category=${cat.categoryId}`)
                                                                }
                                                            }}
                                                        >
                                                            {cat.categoryName}
                                                        </button>
                                                    )
                                                })}
                                                {topLevelCategories.length === 0 && (
                                                    <div className="px-4 py-3 text-sm text-gray-500">Đang tải...</div>
                                                )}
                                            </div>

                                            {/* Cột danh mục con */}
                                            {categorySubmenuHovered !== null && (
                                                <div className="min-w-[220px] border-l border-gray-200 py-2 px-2 bg-white">
                                                    {(() => {
                                                        const parent = topLevelCategories.find(
                                                            (c) => c.categoryId === categorySubmenuHovered
                                                        )
                                                        if (!parent) return null
                                                        const children = buildChildrenForCategory(parent)
                                                        if (!children.length) {
                                                            return (
                                                                <div className="px-2 py-1 text-xs text-gray-400">
                                                                    Không có danh mục con
                                                                </div>
                                                            )
                                                        }
                                                        return children.map((child) => (
                                                            <Link
                                                                key={child.categoryId}
                                                                href={`/products?category=${child.categoryId}`}
                                                                onClick={() => setIsMenuOpen(false)}
                                                                className="block px-3 py-1.5 text-sm text-gray-700 rounded hover:bg-gray-100 hover:text-[#0A923C]"
                                                            >
                                                                {child.categoryName}
                                                            </Link>
                                                        ))
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation Links - from API categories */}
                            <div className="flex items-center flex-1 justify-center overflow-x-auto">
                                <Link
                                    href="/products"
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-gray-700 hover:text-[#0A923C] transition-colors text-xs font-medium"
                                >
                                    <div className="w-5 h-5 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <ShoppingCart size={10} className="text-white" />
                                    </div>
                                    <span>ĐI CHỢ ONLINE</span>
                                    <ChevronDown size={12} className="text-gray-400" />
                                </Link>
                                {topLevelCategories.slice(0, 4).map((cat) => (
                                    <Link
                                        key={cat.categoryId}
                                        href={`/products?category=${cat.categoryId}`}
                                        className="flex items-center gap-1.5 px-4 py-2.5 text-gray-700 hover:text-[#0A923C] transition-colors text-xs font-medium"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-[#0A923C] flex items-center justify-center">
                                            <Cherry size={10} className="text-white" />
                                        </div>
                                        <span>{cat.categoryName.toUpperCase()}</span>
                                        <ChevronDown size={12} className="text-gray-400" />
                                    </Link>
                                ))}
                                <Link
                                    href="/agrishow"
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-gray-700 hover:text-[#0A923C] transition-colors text-xs font-medium"
                                >
                                    <div className="w-5 h-5 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <Leaf size={10} className="text-white" />
                                    </div>
                                    <span>AGRISHOW</span>
                                    <ChevronDown size={12} className="text-gray-400" />
                                </Link>
                                <Link
                                    href="/my-farm"
                                    className="flex items-center gap-1.5 px-4 py-2.5 text-gray-700 hover:text-[#0A923C] transition-colors text-xs font-medium"
                                >
                                    <div className="w-5 h-5 rounded-full bg-[#0A923C] flex items-center justify-center">
                                        <Sprout size={10} className="text-white" />
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
                onGoogleSuccess={(userData, tokens) => {
                    login(userData, tokens)
                    setIsLoginOpen(false)
                    const userName = userData.displayName || 'bạn'
                    setSuccessMessage(`Đăng nhập thành công!\nChào mừng ${userName}`)
                    setShowSuccessPopup(true)
                    const redirectPath =
                        userData.role === 'Admin' ? '/admin' : (userData.role?.toLowerCase() === 'staff') ? '/staff' : '/account/profile'
                    setTimeout(() => router.push(redirectPath), 500)
                }}
                onGoogleError={setLoginError}
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
                    setSuccessMessage('Đăng ký tài khoản thành công')
                    setShowSuccessPopup(true)
                    setTimeout(() => {
                        setIsRegisterOpen(false)
                        setIsLoginOpen(true)
                    }, 500)
                }}
                onEmailSent={(email) => {
                    setSuccessMessage(`Email đã được gửi đến ${email} để xác thực tài khoản. Vui lòng kiểm tra hộp thư và nhập mã OTP.`)
                    setShowSuccessPopup(true)
                }}
                onVerifySuccess={(userData, tokens) => {
                    login(userData, tokens)
                    setSuccessMessage(`Đăng ký thành công!\nChào mừng ${userData.displayName || 'bạn'}`)
                    setShowSuccessPopup(true)
                    setIsRegisterOpen(false)
                    setTimeout(() => router.push('/'), 500)
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