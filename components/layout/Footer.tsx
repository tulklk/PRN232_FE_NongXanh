import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, FileText, Building2, Warehouse } from 'lucide-react'
import { ACCOUNT_LINKS, INFO_LINKS, SUPPORT_LINKS, COMPANY_INFO } from '@/lib/constants'

export default function Footer() {
  return (
    <footer>
      {/* Green top bar */}
      <div className="bg-[#0A923C] h-1"></div>
      
      <div className="bg-gray-100 py-8">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
