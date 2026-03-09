'use client'

import { useState } from 'react'
import { COMPANY_INFO } from '@/lib/constants'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Liên hệ</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Nếu bạn có bất kỳ câu hỏi, góp ý hoặc nhu cầu hợp tác, hãy gửi thông tin cho Nông Xanh.
            Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Họ tên</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Nội dung</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none"
              />
            </div>

            {submitted && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                Cảm ơn bạn đã liên hệ. Nông Xanh đã nhận được thông tin và sẽ phản hồi trong thời
                gian sớm nhất.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary-green text-white font-semibold hover:bg-primary-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'ĐANG GỬI...' : 'GỬI LIÊN HỆ'}
            </button>
          </form>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Thông tin Nông Xanh</h2>

            <div className="mb-3">
              <div className="w-full h-60 sm:h-72 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  title="Bản đồ Nông Xanh"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    COMPANY_INFO.contactAddress
                  )}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">{COMPANY_INFO.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Địa chỉ trụ sở</p>
                <p>{COMPANY_INFO.registeredAddress}</p>
              </div>
              <div>
                <p className="text-gray-500">Địa chỉ liên hệ</p>
                <p>{COMPANY_INFO.contactAddress}</p>
              </div>
              <div>
                <p className="text-gray-500">Kho hàng</p>
                <p>{COMPANY_INFO.warehouseAddress}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{COMPANY_INFO.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Hotline</p>
                <p className="font-medium">{COMPANY_INFO.hotline}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

