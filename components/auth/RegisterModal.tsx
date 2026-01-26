'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface RegisterModalProps {
    isOpen: boolean
    onClose: () => void
    onSwitchToLogin?: () => void
    onRegisterSuccess?: () => void
}

export default function RegisterModal({ 
    isOpen, 
    onClose,
    onSwitchToLogin,
    onRegisterSuccess
}: RegisterModalProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        phoneNumber: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Vui lòng nhập email'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ'
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
        }

        // Display name validation
        if (!formData.displayName) {
            newErrors.displayName = 'Vui lòng nhập tên hiển thị'
        } else if (formData.displayName.length < 2) {
            newErrors.displayName = 'Tên hiển thị phải có ít nhất 2 ký tự'
        }

        // Phone number validation - chỉ cần số, không yêu cầu E.164 format
        if (!formData.phoneNumber) {
            newErrors.phoneNumber = 'Vui lòng nhập số điện thoại'
        } else {
            // Chỉ cho phép số và một số ký tự cơ bản
            const cleanedPhone = formData.phoneNumber.replace(/[\s\-()]/g, '')
            if (!/^[0-9]+$/.test(cleanedPhone)) {
                newErrors.phoneNumber = 'Số điện thoại chỉ được chứa số'
            } else if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
                newErrors.phoneNumber = 'Số điện thoại phải có từ 10-11 chữ số'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)

            // Format phone number: loại bỏ khoảng trắng và ký tự đặc biệt, chỉ giữ số
            // API route sẽ tự động format sang E.164
            const cleanedPhoneNumber = formData.phoneNumber.replace(/[\s\-()]/g, '')

            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    displayName: formData.displayName,
                    phoneNumber: cleanedPhoneNumber,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Đăng ký thất bại')
            }

            // Close modal and switch to login
            onClose()
            if (onRegisterSuccess) {
                onRegisterSuccess()
            }
            // Don't call onSwitchToLogin here, let onRegisterSuccess handle it
        } catch (err: any) {
            console.error('Register error:', err)
            setError(err.message || 'Đăng ký thất bại')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
            style={{ 
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden relative animate-slideUpFade will-change-transform">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 active:scale-95"
                    disabled={loading}
                >
                    <X size={24} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 md:p-10">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center animate-scaleIn">ĐĂNG KÝ</h2>

                        <div className="mb-4 animate-scaleIn" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                            <p className="text-sm text-gray-600 mb-4">
                                Tạo tài khoản <span className="text-[#0A923C] font-semibold">nongxanh</span> để nhận được nhiều ưu đãi và dịch vụ tốt nhất!
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm animate-shake">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
                            {/* Display Name */}
                            <div className="animate-scaleIn" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    placeholder="Tên hiển thị"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-md ${
                                        errors.displayName ? 'border-red-500 animate-shake' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                    required
                                />
                                {errors.displayName && (
                                    <p className="mt-1 text-sm text-red-500 animate-shake">{errors.displayName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="animate-scaleIn" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Email"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-md ${
                                        errors.email ? 'border-red-500 animate-shake' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                    required
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500 animate-shake">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div className="animate-scaleIn" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Số điện thoại"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-md ${
                                        errors.phoneNumber ? 'border-red-500 animate-shake' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                    required
                                />
                                {errors.phoneNumber && (
                                    <p className="mt-1 text-sm text-red-500 animate-shake">{errors.phoneNumber}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="animate-scaleIn" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Mật khẩu"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-md ${
                                        errors.password ? 'border-red-500 animate-shake' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                    required
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500 animate-shake">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="animate-scaleIn" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Xác nhận mật khẩu"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-md ${
                                        errors.confirmPassword ? 'border-red-500 animate-shake' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                    required
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-500 animate-shake">{errors.confirmPassword}</p>
                                )}
                            </div>

                            <div className="animate-scaleIn" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
                                <button 
                                    type="submit"
                                    className="w-full bg-[#0A923C] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#087a32] transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="animate-pulse">ĐANG ĐĂNG KÝ...</span>
                                        </span>
                                    ) : 'ĐĂNG KÝ'}
                                </button>
                            </div>
                        </form>

                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-600">
                                Đã có tài khoản?{' '}
                                <button 
                                    type="button"
                                    onClick={() => {
                                        onClose()
                                        if (onSwitchToLogin) {
                                            onSwitchToLogin()
                                        }
                                    }}
                                    className="text-[#0A923C] font-semibold hover:underline"
                                    disabled={loading}
                                >
                                    Đăng nhập
                                </button>
                            </p>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Hoặc đăng ký bằng</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center mb-4">
                            <button className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#166fe5] transition-all duration-200 disabled:opacity-50 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100" disabled={loading}>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                FACEBOOK
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-[#EA4335] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#d93325] transition-all duration-200 disabled:opacity-50 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100" disabled={loading}>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                GOOGLE
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Bằng cách tiếp tục, bạn đã chấp nhận{' '}
                            <button className="text-[#0A923C] hover:underline">Điều khoản sử dụng</button>
                        </p>
                    </div>

                    <div className="hidden md:flex bg-gradient-to-br from-green-50 via-white to-blue-50 items-center justify-center p-8 animate-scaleIn" style={{ animationDelay: '0.2s' }}>
                        <div className="text-center max-w-xs">
                            <div className="mb-6 relative">
                                <div className="w-full aspect-square bg-gradient-to-br from-green-100 to-yellow-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                    <div className="relative w-48 h-48">
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-32 bg-white rounded-t-xl shadow-lg">
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-8 bg-[#0A923C] rounded-lg"></div>
                                            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
                                                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
                                                <div className="w-4 h-4 bg-orange-400 rounded-full animate-float" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-4 h-4 bg-red-400 rounded-full animate-float" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                                                <div className="w-8 h-10 bg-green-200 rounded animate-float" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-8 h-10 bg-yellow-200 rounded animate-float" style={{ animationDelay: '0.3s' }}></div>
                                                <div className="w-8 h-10 bg-orange-200 rounded animate-float" style={{ animationDelay: '0.5s' }}></div>
                                            </div>
                                        </div>
                                        <div className="absolute bottom-0 left-2 w-8 h-16 bg-blue-400 rounded-t-full animate-float" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="absolute bottom-0 right-2 w-8 h-14 bg-pink-400 rounded-t-full animate-float" style={{ animationDelay: '0.4s' }}></div>
                                        <div className="absolute top-4 left-0 w-6 h-6 bg-green-500 rounded-full animate-float" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="absolute top-8 right-0 w-8 h-8 bg-green-600 rounded-full animate-float" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Mua sắm tại</h3>
                            <h3 className="text-2xl font-bold text-[#0A923C] mb-2">nongxanh</h3>
                            <p className="text-[#0A923C] font-medium mb-6">Siêu ưu đãi mỗi ngày</p>

                            <div className="space-y-1 text-sm font-semibold text-gray-600">
                                <p>KNOW YOUR FARMER</p>
                                <p>KNOW YOUR FOOD____</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
