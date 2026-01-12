'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Facebook } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ĐĂNG NHẬP</h1>
          <p className="text-gray-600 text-sm">
            FoodMap chào bạn, bạn cần đăng kí hoặc đăng nhập tài khoản trước khi mua hàng để nhận
            được nhiều ưu đãi và FoodMap phục vụ bạn tốt hơn nhé! Cảm ơn bạn rất nhiều!
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Email hoặc số điện thoại</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
              />
              <span className="text-sm">Nhớ đến tôi</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-primary-green hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="button"
            className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors mb-2"
          >
            Đăng nhập bằng OTP
          </button>

          <button
            type="submit"
            className="w-full bg-primary-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors"
          >
            ĐĂNG NHẬP
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Bạn không có tài khoản?{' '}
            <Link href="/register" className="text-primary-green hover:underline font-semibold">
              Đăng ký
            </Link>
          </p>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập bằng</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Facebook size={20} />
              FACEBOOK
            </button>
            <button className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center text-red-600 font-bold text-xs">
                G
              </div>
              GOOGLE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
