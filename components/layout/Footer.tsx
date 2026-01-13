import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, FileText, Building2, Warehouse, QrCode } from 'lucide-react'
import { ACCOUNT_LINKS, INFO_LINKS, SUPPORT_LINKS, COMPANY_INFO } from '@/lib/constants'

export default function Footer() {
  return (
    <footer>
      {/* Green top bar */}
      <div className="bg-[#0A923C] h-1"></div>
      
      <div className="bg-gray-100 py-8">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <Link href="/" className="inline-block mb-4">
                  <div className="relative w-40 h-12">
                    <Image
                      src="/images/logo.png"
                      alt="Nông Xanh Logo"
                      fill
                      className="object-contain object-left [filter:brightness(0)_saturate(100%)_invert(36%)_sepia(93%)_saturate(1352%)_hue-rotate(118deg)_brightness(97%)_contrast(101%)]"
                      sizes="160px"
                    />
                  </div>
                </Link>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p className="flex items-start gap-2">
                  <Building2 size={14} className="mt-0.5 text-[#0A923C] flex-shrink-0" />
                  <span>{COMPANY_INFO.name}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 text-[#0A923C] flex-shrink-0" />
                  <span>Địa chỉ ĐKKD: {COMPANY_INFO.registeredAddress}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 text-[#0A923C] flex-shrink-0" />
                  <span>Địa chỉ liên hệ: {COMPANY_INFO.contactAddress}</span>
                </p>
                <p className="flex items-start gap-2">
                  <Warehouse size={14} className="mt-0.5 text-[#0A923C] flex-shrink-0" />
                  <span>Kho Tân Phú: {COMPANY_INFO.warehouseAddress}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-[#0A923C] flex-shrink-0" />
                  <span>Email: {COMPANY_INFO.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-[#0A923C] flex-shrink-0" />
                  <span>Hotline: {COMPANY_INFO.hotline} (8h00 - 18h00)</span>
                </p>
                <p className="flex items-start gap-2 mt-3">
                  <FileText size={14} className="mt-0.5 text-[#0A923C] flex-shrink-0" />
                  <span className="text-[10px]">{COMPANY_INFO.businessLicense}</span>
                </p>
                <p className="flex items-start gap-2">
                  <FileText size={14} className="mt-0.5 text-[#0A923C] flex-shrink-0" />
                  <span className="text-[10px]">{COMPANY_INFO.foodSafetyLicense}</span>
                </p>
              </div>
            </div>

            {/* Account & Information */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">TÀI KHOẢN</h3>
              <ul className="space-y-2 mb-6">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs text-gray-600 hover:text-[#0A923C] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <h3 className="font-bold text-gray-900 mb-4 text-sm">THÔNG TIN</h3>
              <ul className="space-y-2">
                {INFO_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs text-gray-600 hover:text-[#0A923C] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">HỖ TRỢ</h3>
              <ul className="space-y-2">
                {SUPPORT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs text-gray-600 hover:text-[#0A923C] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect & App Downloads */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-sm">KẾT NỐI VỚI NÔNG XANH</h3>
              
              {/* Connection Card */}
              <div className="bg-white rounded-md p-3 mb-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative w-11 h-11">
                    <Image
                      src="/images/logo.png"
                      alt="Nông Xanh"
                      fill
                      className="object-contain"
                      sizes="44px"
                    />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#0A923C]">NongXanh</p>
                    <p className="text-[10px] text-gray-500">15.310 người theo dõi</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 mb-2">
                  Hãy là người đầu tiên trong số bạn bè của bạn thích nội dung này nay
                </p>
              </div>

              {/* Certifications */}
              <div className="flex gap-2 mb-4">
                <div className="bg-white rounded-md p-2 flex items-center gap-2 shadow-sm">
                  <div className="w-6 h-6 bg-[#0A923C] rounded flex items-center justify-center">
                    <span className="text-white text-[10px]">✓</span>
                  </div>
                  <span className="text-[10px] text-gray-600">ĐÃ THÔNG BÁO<br/>BỘ CÔNG THƯƠNG</span>
                </div>
                <div className="bg-white rounded-md p-2 flex items-center gap-2 shadow-sm">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-[10px]">▶</span>
                  </div>
                  <span className="text-[10px] text-gray-600">Food Channel<br/>YouTube</span>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-4 text-sm">TẢI ỨNG DỤNG TRÊN ĐIỆN THOẠI</h3>
              <div className="flex gap-3">
                {/* QR Code */}
                <div className="w-16 h-16 bg-white rounded-md shadow-sm flex items-center justify-center">
                  <QrCode size={40} className="text-gray-400" />
                </div>
                
                {/* App Store Buttons */}
                <div className="flex flex-col gap-2">
                  <button className="bg-black text-white py-1.5 px-3 rounded-md text-[10px] hover:bg-gray-800 flex items-center gap-2">
                    <span className="text-sm">🍎</span>
                    <div className="text-left">
                      <div className="text-[8px] opacity-80">Tải về trên</div>
                      <div className="font-semibold text-[10px]">App Store</div>
                    </div>
                  </button>
                  <button className="bg-black text-white py-1.5 px-3 rounded-md text-[10px] hover:bg-gray-800 flex items-center gap-2">
                    <span className="text-sm">▶️</span>
                    <div className="text-left">
                      <div className="text-[8px] opacity-80">TẢI VỀ TRÊN</div>
                      <div className="font-semibold text-[10px]">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-200 py-3">
        <div className="max-w-[1400px] mx-auto px-8">
          <p className="text-center text-xs text-gray-600">
            Copyright © Nông Xanh 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
