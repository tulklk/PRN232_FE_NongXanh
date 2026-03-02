'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useGoogleLogin } from '@react-oauth/google'
import { X, Eye, EyeOff } from 'lucide-react'
import type { User, AuthTokens } from '@/contexts/UserContext'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
    onLogin: (email: string, password: string) => void
    onGoogleSuccess?: (user: User, tokens: AuthTokens) => void
    onGoogleError?: (message: string) => void
    loading: boolean
    error: string
    onSwitchToRegister?: () => void
}

function GoogleLoginButtonImpl({
    disabled,
    onSuccess,
    onError,
    onLoadingChange,
}: {
    disabled: boolean
    onSuccess: (user: User, tokens: AuthTokens) => void
    onError: (msg: string) => void
    onLoadingChange: (loading: boolean) => void
}) {
    const loginWithGoogle = useGoogleLogin({
        flow: 'auth-code',
        scope: 'openid email profile',
        state:
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        onSuccess: async (codeResponse) => {
            onLoadingChange(true)
            try {
                const redirectUri =
                    typeof window !== 'undefined' ? window.location.origin : ''
                const state =
                    codeResponse.state && codeResponse.state.length > 0
                        ? codeResponse.state
                        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
                const res = await fetch('/api/auth/google/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: codeResponse.code,
                        state,
                        redirectUri,
                    }),
                })
                const data = await res.json()
                if (!res.ok) {
                    onError(data.error || 'Đăng nhập Google thất bại')
                    return
                }
                const { tokens, ...userData } = data
                if (!tokens?.idToken) {
                    onError('Phản hồi đăng nhập không hợp lệ')
                    return
                }
                onSuccess(userData as User, tokens as AuthTokens)
            } catch (err) {
                onError(
                    err instanceof Error ? err.message : 'Đăng nhập Google thất bại'
                )
            } finally {
                onLoadingChange(false)
            }
        },
        onError: () => {
            onError('Đăng nhập Google thất bại')
            onLoadingChange(false)
        },
    })

    return (
        <button
            type="button"
            onClick={() => loginWithGoogle()}
            disabled={disabled}
            className="flex items-center justify-center gap-2 bg-[#EA4335] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#d93325] transition-all duration-200 disabled:opacity-50 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100"
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            GOOGLE
        </button>
    )
}

const hasGoogleAuth = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export default function LoginModal({
    isOpen,
    onClose,
    onLogin,
    onGoogleSuccess,
    onGoogleError,
    loading,
    error,
    onSwitchToRegister,
}: LoginModalProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isExiting, setIsExiting] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    const isLoading = loading || googleLoading

    const handleClose = (switchToRegister?: boolean) => {
        if (isExiting || isLoading) return
        setIsExiting(true)
        setTimeout(() => {
            if (switchToRegister && onSwitchToRegister) {
                onSwitchToRegister()
            } else {
                onClose()
            }
        }, 300)
    }

    useEffect(() => {
        if (isOpen) setIsExiting(false)
    }, [isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onLogin(email, password)
    }

    if (!isOpen) return null

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
                isExiting ? 'animate-fadeOut' : 'animate-in fade-in duration-300'
            }`}
            style={{ 
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div className={`bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden relative will-change-transform ${
                isExiting ? 'animate-slideDownFade' : 'animate-slideUpFade'
            }`}>
                <button
                    onClick={() => handleClose()}
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 active:scale-95"
                    disabled={isLoading}
                >
                    <X size={24} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 md:p-10">
                        <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center animate-scaleIn">ĐĂNG NHẬP</h2>

                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-4">
                                        <span className="text-[#0A923C] font-semibold">nongxanh</span> chào bạn, bạn cần đăng kí hoặc đăng nhập
                                        tài khoản trước khi mua hàng để nhận được nhiều ưu đãi và{' '}
                                        <span className="text-[#0A923C] font-semibold">nongxanh</span> phục vụ bạn tốt hơn nhé!
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Cảm ơn <span className="text-[#0A923C] font-semibold">bạn</span> rất nhiều!
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm animate-shake">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4 mb-4">
                                    <div className="animate-scaleIn" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                                        <input
                                            type="text"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email hoặc số điện thoại"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                    <div className="animate-scaleIn relative" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mật khẩu"
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                                            disabled={isLoading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                                            tabIndex={-1}
                                            disabled={isLoading}
                                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    <div className="animate-scaleIn" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                                        <button 
                                            type="submit"
                                            className="w-full bg-[#0A923C] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#087a32] transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="animate-pulse">ĐANG ĐĂNG NHẬP...</span>
                                                </span>
                                            ) : 'ĐĂNG NHẬP'}
                                        </button>
                                    </div>
                                </form>

                                <div className="flex items-center justify-center mb-4">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 text-[#0A923C] border-gray-300 rounded focus:ring-[#0A923C]"
                                            disabled={isLoading}
                                        />
                                        <span className="ml-2 text-sm text-gray-600">Nhớ đến tôi</span>
                                    </label>
                                </div>

                                <div className="text-center mb-6">
                                    <p className="text-sm text-gray-600">
                                        Bạn không có tài khoản?{' '}
                                        <button 
                                            type="button"
                                            onClick={() => handleClose(true)}
                                            className="text-[#0A923C] font-semibold hover:underline"
                                            disabled={isLoading}
                                        >
                                            Đăng ký
                                        </button>
                                    </p>
                                    <button type="button" className="text-[#0A923C] text-sm hover:underline mt-1" disabled={isLoading}>Quên mật khẩu?</button>
                                </div>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Hoặc đăng nhập bằng</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center mb-4">
                            <button className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#166fe5] transition-all duration-200 disabled:opacity-50 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100" disabled={isLoading}>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                FACEBOOK
                            </button>
                            {hasGoogleAuth && onGoogleSuccess ? (
                                <GoogleLoginButtonImpl
                                    disabled={isLoading}
                                    onSuccess={onGoogleSuccess}
                                    onError={(msg) => onGoogleError?.(msg)}
                                    onLoadingChange={setGoogleLoading}
                                />
                            ) : (
                                <button className="flex items-center justify-center gap-2 bg-[#EA4335] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#d93325] transition-all duration-200 disabled:opacity-50 cursor-not-allowed" disabled>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    GOOGLE
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Bằng cách tiếp tục, bạn đã chấp nhận{' '}
                            <button className="text-[#0A923C] hover:underline">Điều khoản sử dụng</button>
                        </p>
                    </div>

                    <div className="hidden md:flex items-center justify-center p-0 overflow-hidden">
                        <Image
                            src="/images/login%20img.jpg"
                            alt="Mua sắm tại nongxanh - Siêu ưu đãi mỗi ngày"
                            width={500}
                            height={600}
                            className="w-full h-full object-cover min-h-[400px]"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    )
} 