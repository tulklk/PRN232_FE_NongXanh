'use client'

import Image from 'next/image'

const vouchers = [
  {
    id: '1',
    code: '[NEWBIE - APP] GIẢM 5%',
    description: 'TỐI ĐA 50K - ĐƠN TỪ 0Đ',
    expiry: '2026-12-31',
  },
  {
    id: '2',
    code: '[Dec.2025] Giảm 5% -',
    description: 'Đơn từ 199k',
    expiry: '2025-12-31',
  },
]

export default function VouchersPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-base font-bold text-gray-900 mb-5">Voucher của tôi</h2>

      {/* Add Voucher */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Nhập mã giảm giá"
          className="flex-1 border border-gray-200 rounded-md px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0A923C] focus:border-[#0A923C]"
        />
        <button className="bg-[#0A923C] text-white px-5 py-2.5 rounded-md text-xs font-medium hover:bg-[#087a32] transition-colors">
          LƯU VOUCHER
        </button>
      </div>

      {/* Voucher List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vouchers.map((voucher) => (
          <div
            key={voucher.id}
            className="border border-gray-200 rounded-lg p-4 flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-10 h-10 border-2 border-[#0A923C] rounded-full flex items-center justify-center">
                <span className="text-[#0A923C] text-[9px] font-bold">NX</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">{voucher.code}</p>
              <p className="text-[10px] text-gray-500">{voucher.description}</p>
              <button className="text-[#0A923C] text-[10px] hover:underline mt-1.5">Chi tiết</button>
            </div>
            <button className="bg-[#0A923C] text-white px-4 py-2 rounded-md text-[10px] font-medium hover:bg-[#087a32] transition-colors">
              MUA NGAY
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
