'use client'

import Image from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { formatPhoneNumber } from '@/lib/utils'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { updateCurrentUserProfile } from '@/lib/api/users'

export default function ProfilePage() {
  const { user, tokens, isLoading, updateUser } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    email: '',
    city: '',
    district: '',
    ward: '',
    address: '',
    gender: 'other',
    birthday: { day: '', month: '', year: '' },
    changePassword: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        displayName: user.displayName || '',
        phoneNumber: formatPhoneNumber(user.phoneNumber || '') || user.phoneNumber || '',
        email: user.email || '',
      }))
    }
  }, [user, isLoading, router])

  const submitProfile = async () => {
    if (!user || !tokens?.idToken) {
      setSaveError('Bạn cần đăng nhập lại để cập nhật thông tin.')
      return
    }

    const cleanedPhone = formData.phoneNumber.replace(/[\s\-()]/g, '').trim()

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const updated = await updateCurrentUserProfile(
        {
          displayName: formData.displayName.trim(),
          phoneNumber: cleanedPhone || undefined,
          email: formData.email.trim() || undefined,
        },
        tokens.idToken
      )

      setFormData((prev) => ({
        ...prev,
        displayName: updated.displayName ?? prev.displayName,
        phoneNumber: formatPhoneNumber(updated.phoneNumber || '') || updated.phoneNumber || prev.phoneNumber,
        email: updated.email ?? prev.email,
      }))

      updateUser({
        displayName: updated.displayName ?? formData.displayName,
        phoneNumber: updated.phoneNumber ?? cleanedPhone,
        email: updated.email ?? formData.email,
      })

      setSaveSuccess('Cập nhật thông tin tài khoản thành công.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Cập nhật thông tin thất bại.'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submitProfile()
  }

  const handleQuickPhoneUpdate = async () => {
    await submitProfile()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A923C] mx-auto" />
          <p className="mt-3 text-gray-600 text-sm">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }
  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-400 rounded-lg p-6 mb-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1.5">TRỞ THÀNH CTV</h2>
          <p className="text-lg">CÙNG NÔNG XANH NGAY!</p>
          <p className="text-sm mt-2.5">HOA HỒNG LÊN ĐẾN 20%</p>
          <button className="mt-4 bg-yellow-400 text-green-800 px-6 py-2.5 rounded-md text-sm font-bold hover:bg-yellow-300">
            THAM GIA NGAY
          </button>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20">
          <div className="text-8xl">🌿</div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin tài khoản</h2>

        {saveError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {saveSuccess}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">
              Tên <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-3">
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                disabled={saving}
                className="w-full border border-gray-200 rounded-md px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A923C] focus:border-[#0A923C] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-3 flex gap-3">
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v) setFormData((prev) => ({ ...prev, phoneNumber: formatPhoneNumber(v) }))
                }}
                placeholder="0906 337 965"
                disabled={saving}
                className="flex-1 border border-gray-200 rounded-md px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A923C] focus:border-[#0A923C] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                className="text-[#0A923C] text-sm font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                disabled={saving}
                onClick={handleQuickPhoneUpdate}
              >
                Cập nhật
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">Email</label>
            <div className="md:col-span-3">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                disabled={saving}
                className="w-full border border-gray-200 rounded-md px-5 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#0A923C] focus:border-[#0A923C] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* City */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">
              Thành phố <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-3">
              <select
                value={formData.city}
                disabled
                className="w-full border border-gray-200 rounded-md px-5 py-3 text-sm bg-gray-50 cursor-not-allowed"
              >
                <option value="">Tỉnh/Thành</option>
                <option value="hcm">TP. Hồ Chí Minh</option>
                <option value="hn">Hà Nội</option>
                <option value="dn">Đà Nẵng</option>
              </select>
            </div>
          </div>

          {/* District */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">
              Quận huyện <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-3">
              <select
                value={formData.district}
                disabled
                className="w-full border border-gray-200 rounded-md px-5 py-3 text-sm bg-gray-50 cursor-not-allowed"
              >
                <option value="">Quận/Huyện</option>
              </select>
            </div>
          </div>

          {/* Ward */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">
              Phường/Xã <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-3">
              <select
                value={formData.ward}
                disabled
                className="w-full border border-gray-200 rounded-md px-5 py-3 text-sm bg-gray-50 cursor-not-allowed"
              >
                <option value="">Phường/Xã</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <div className="md:col-span-3">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Địa chỉ cụ thể"
                disabled
                className="w-full border border-gray-200 rounded-md px-5 py-3 text-sm bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-5 items-center">
            <label className="text-sm text-gray-600">Giới tính</label>
            <div className="md:col-span-3 flex gap-6">
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                  disabled
                  className="text-[#0A923C] w-4 h-4 cursor-not-allowed"
                />
                Nam
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                  disabled
                  className="text-[#0A923C] w-4 h-4 cursor-not-allowed"
                />
                Nữ
              </label>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === 'other'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                  disabled
                  className="text-[#0A923C] w-4 h-4 cursor-not-allowed"
                />
                Khác
              </label>
            </div>
          </div>

          {/* Birthday */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
            <label className="text-sm text-gray-600">Sinh nhật</label>
            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              <select
                value={formData.birthday.day}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthday: { ...prev.birthday, day: e.target.value } }))}
                disabled
                className="border border-gray-200 rounded-md px-5 py-3 text-sm bg-gray-50 cursor-not-allowed"
              >
                <option value="">Ngày</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select
                value={formData.birthday.month}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthday: { ...prev.birthday, month: e.target.value } }))}
                disabled
                className="border border-gray-200 rounded-md px-5 py-3 text-sm bg-gray-50 cursor-not-allowed"
              >
                <option value="">Tháng</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
              <select
                value={formData.birthday.year}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthday: { ...prev.birthday, year: e.target.value } }))}
                disabled
                className="border border-gray-200 rounded-md px-5 py-3 text-sm bg-gray-50 cursor-not-allowed"
              >
                <option value="">Năm</option>
                {Array.from({ length: 100 }, (_, i) => (
                  <option key={2024 - i} value={2024 - i}>{2024 - i}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Change Password */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center">
            <div></div>
            <div className="md:col-span-3">
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={formData.changePassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, changePassword: e.target.checked }))}
                  disabled
                  className="text-[#0A923C] w-4 h-4 cursor-not-allowed"
                />
                Thay đổi mật khẩu
              </label>
            </div>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 italic">
            * Để thay đổi số điện thoại, vui lòng nhập số điện thoại và nhấn nút Cập nhật bên cạnh ô số điện thoại hoặc liên hệ với chúng tôi qua{' '}
            <a href="#" className="text-[#0A923C] hover:underline">Thông tin liên hệ</a>
          </p>

          {/* Submit */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#0A923C] text-white px-8 py-3 rounded-md text-sm font-medium hover:bg-[#087a32] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
            {saving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
