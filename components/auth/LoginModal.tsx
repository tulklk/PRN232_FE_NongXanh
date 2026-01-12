'use client'

import { useState } from 'react'
import { X, Facebook } from 'lucide-react'
import Image from 'next/image'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [phone, setPhone] = useState('')
  const [otpMethod, setOtpMethod] = useState<'sms' | 'zalo'>('sms')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Form */}
          <div className="p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Foodmap xin chào,</h2>
              <p className="text-gray-600">Đăng nhập hoặc Tạo tài khoản</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>

            <div className="mb-6">
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="sms"
                    checked={otpMethod === 'sms'}
                    onChange={() => setOtpMethod('sms')}
                    className="mr-2 text-primary-green focus:ring-primary-green"
                  />
                  <span className="text-sm">SMS OTP</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="otpMethod"
                    value="zalo"
                    checked={otpMethod === 'zalo'}
                    onChange={() => setOtpMethod('zalo')}
                    className="mr-2 text-primary-green focus:ring-primary-green"
                  />
                  <span className="text-sm">ZALO OTP</span>
                </label>
              </div>
            </div>

            <button className="w-full bg-primary-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors mb-6">
              TIẾP TỤC
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục bằng</span>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Facebook size={20} />
                FACEBOOK
              </button>
              <button className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded flex items-center justify-center text-white font-bold text-xs">
                  G
                </div>
                GOOGLE
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6">
              Bằng cách tiếp tục, bạn đã chấp nhận Điều khoản sử dụng
            </p>
          </div>

          {/* Right Side - Illustration */}
          <div className="hidden md:block bg-gradient-to-br from-green-50 to-blue-50 p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-64 h-48 bg-white rounded-lg shadow-lg mx-auto flex items-center justify-center">
                  <div className="text-6xl">🏪</div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mua sắm tại Foodmap</h3>
              <p className="text-gray-600 mb-4">Siêu ưu đãi mỗi ngày</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-semibold">KNOW YOUR FARMER</p>
                <p className="font-semibold">KNOW YOUR FOOD</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
