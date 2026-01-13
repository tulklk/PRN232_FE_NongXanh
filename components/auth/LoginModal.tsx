'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type LoginMode = 'password' | 'otp'

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<LoginMode>('password')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpMethod, setOtpMethod] = useState<'sms' | 'zalo'>('sms')
  const [rememberMe, setRememberMe] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Form */}
          <div className="p-8 md:p-10">
            {mode === 'password' ? (
              <>
                {/* Password Login Mode */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ĐĂNG NHẬP</h2>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    <span className="text-[#0A923C] font-semibold">FoodMap</span> chào bạn, bạn cần đăng kí hoặc đăng nhập
                    tài khoản trước khi mua hàng để nhận được nhiều ưu đãi và{' '}
                    <span className="text-[#0A923C] font-semibold">FoodMap</span> phục vụ bạn tốt hơn nhé!
                  </p>
                  <p className="text-sm text-gray-600">
                    Cảm ơn <span className="text-[#0A923C] font-semibold">bạn</span> rất nhiều!
                  </p>
                </div>

                <div className="space-y-4 mb-4">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email hoặc số điện thoại"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm"
                  />
                </div>

                <button
                  onClick={() => setMode('otp')}
                  className="text-[#0A923C] hover:underline text-sm mb-4 block"
                >
                  Đăng nhập bằng OTP
                </button>

                <button className="w-full bg-[#0A923C] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#087a32] transition-colors mb-4">
                  ĐĂNG NHẬP
                </button>

                <div className="flex items-center justify-center mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#0A923C] border-gray-300 rounded focus:ring-[#0A923C]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Nhớ đến tôi</span>
                  </label>
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600">
                    Bạn không có tài khoản?{' '}
                    <button className="text-[#0A923C] font-semibold hover:underline">Đăng ký</button>
                  </p>
                  <button className="text-[#0A923C] text-sm hover:underline mt-1">Quên mật khẩu?</button>
                </div>
              </>
            ) : (
              <>
                {/* OTP Login Mode */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    <span className="text-[#0A923C]">Foodmap</span> xin chào,
                  </h2>
                  <p className="text-gray-600 text-sm">Đăng nhập hoặc Tạo tài khoản</p>
                </div>

                <div className="mb-4">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Điện thoại"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C] focus:border-transparent text-sm"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="sms"
                        checked={otpMethod === 'sms'}
                        onChange={() => setOtpMethod('sms')}
                        className="w-4 h-4 text-[#0A923C] focus:ring-[#0A923C]"
                      />
                      <span className="ml-2 text-sm text-gray-700">SMS OTP</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="zalo"
                        checked={otpMethod === 'zalo'}
                        onChange={() => setOtpMethod('zalo')}
                        className="w-4 h-4 text-[#0A923C] focus:ring-[#0A923C]"
                      />
                      <span className="ml-2 text-sm text-gray-700">ZALO OTP</span>
                    </label>
                  </div>
                </div>

                <button className="w-full bg-[#0A923C] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#087a32] transition-colors mb-6">
                  TIẾP TỤC
                </button>

                <button
                  onClick={() => setMode('password')}
                  className="text-[#0A923C] hover:underline text-sm mb-4 block text-center w-full"
                >
                  Đăng nhập bằng mật khẩu
                </button>
              </>
            )}

            {/* Social Login */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Hoặc {mode === 'password' ? 'đăng nhập' : 'tiếp tục'} bằng</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center mb-4">
              <button className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#166fe5] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                FACEBOOK
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#EA4335] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#d93325] transition-colors">
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

          {/* Right Side - Illustration */}
          <div className="hidden md:flex bg-gradient-to-br from-green-50 via-white to-blue-50 items-center justify-center p-8">
            <div className="text-center max-w-xs">
              {/* Illustration */}
              <div className="mb-6 relative">
                <div className="w-full aspect-square bg-gradient-to-br from-green-100 to-yellow-50 rounded-2xl flex items-center justify-center overflow-hidden">
                  {/* Simple shop illustration */}
                  <div className="relative w-48 h-48">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-32 bg-white rounded-t-xl shadow-lg">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-8 bg-[#0A923C] rounded-lg"></div>
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                        <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                        <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                      </div>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                        <div className="w-8 h-10 bg-green-200 rounded"></div>
                        <div className="w-8 h-10 bg-yellow-200 rounded"></div>
                        <div className="w-8 h-10 bg-orange-200 rounded"></div>
                      </div>
                    </div>
                    {/* People */}
                    <div className="absolute bottom-0 left-2 w-8 h-16 bg-blue-400 rounded-t-full"></div>
                    <div className="absolute bottom-0 right-2 w-8 h-14 bg-pink-400 rounded-t-full"></div>
                    {/* Trees */}
                    <div className="absolute top-4 left-0 w-6 h-6 bg-green-500 rounded-full"></div>
                    <div className="absolute top-8 right-0 w-8 h-8 bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Mua sắm tại
              </h3>
              <h3 className="text-2xl font-bold text-[#0A923C] mb-2">
                Foodmap
              </h3>
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
