import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, FileText, Building2, Warehouse } from 'lucide-react'
import { ACCOUNT_LINKS, INFO_LINKS, SUPPORT_LINKS, COMPANY_INFO } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative w-16 h-16">
                  <Image
                    src="/images/logo.png"
                    alt="Nông Xanh Logo"
                    fill
                    className="object-contain"
                    sizes="64px"
                  />
                </div>
                <span className="text-primary-green font-bold text-lg">NÔNG XANH</span>
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Building2 size={16} />
                {COMPANY_INFO.name}
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 text-primary-green" />
                <span>ĐKKD: {COMPANY_INFO.registeredAddress}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 text-primary-green" />
                <span>Liên hệ: {COMPANY_INFO.contactAddress}</span>
              </p>
              <p className="flex items-start gap-2">
                <Warehouse size={16} className="mt-1 text-primary-green" />
                <span>Kho: {COMPANY_INFO.warehouseAddress}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-primary-green" />
                <span>Email: {COMPANY_INFO.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} className="text-primary-green" />
                <span>Hotline: {COMPANY_INFO.hotline} (08:00 - 18:00)</span>
              </p>
              <p className="flex items-start gap-2 mt-4">
                <FileText size={16} className="mt-1 text-primary-green" />
                <span className="text-xs">{COMPANY_INFO.businessLicense}</span>
              </p>
              <p className="flex items-start gap-2">
                <FileText size={16} className="mt-1 text-primary-green" />
                <span className="text-xs">{COMPANY_INFO.foodSafetyLicense}</span>
              </p>
            </div>
          </div>

          {/* Account & Information */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">TÀI KHOẢN</h3>
            <ul className="space-y-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-primary-green">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-bold text-gray-900 mb-4 mt-6">THÔNG TIN</h3>
            <ul className="space-y-2">
              {INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-primary-green">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">HỖ TRỢ</h3>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-primary-green">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* VietGAP Certification */}
            <div className="mt-6">
              <h3 className="font-bold text-gray-900 mb-4">KẾT NỐI VỚI NÔNG XANH</h3>
              <div className="bg-primary-green-light rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-primary-green rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">VG</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Đã được chứng nhận</p>
                    <p className="text-xs text-gray-600">VietGAP & Organic</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 bg-white rounded p-2 flex items-center justify-center">
                    <span className="text-primary-green">✓</span>
                  </div>
                  <div className="flex-1 bg-white rounded p-2 flex items-center justify-center">
                    <span className="text-yellow-500">★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* App Downloads */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">TẢI ỨNG DỤNG TRÊN ĐIỆN THOẠI</h3>
            <div className="space-y-2">
              <button className="w-full bg-black text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-800">
                Tải về trên App Store
              </button>
              <button className="w-full bg-black text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-800">
                Tải về trên Google Play
              </button>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="w-20 h-20 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">▶</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
