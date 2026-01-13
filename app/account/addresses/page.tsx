'use client'

import { Edit2, Trash2 } from 'lucide-react'

const addresses = [
  {
    id: '1',
    isDefault: true,
    phone: '0982413244',
    name: 'Phan Thành Tú',
    address: '196/2 Hùng Vương, Xuân Bình',
    fullAddress: '196/2 Hùng Vương, Xuân Bình, Phường Bình Thọ, Quận Thủ Đức, Hồ Chí Minh',
    postCode: '196/2 Hùng Vương, Xuân Bình, Phường Bình Thọ, Quận Thủ Đức, Hồ Chí Minh',
    type: 'Nhà Riêng',
  },
]

export default function AddressesPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-base font-bold text-gray-900 mb-5">Sổ địa chỉ</h2>

      {/* Add New Button */}
      <button className="bg-[#0A923C] text-white px-5 py-2.5 rounded-md text-xs font-medium hover:bg-[#087a32] transition-colors mb-5">
        THÊM MỚI
      </button>

      {/* Address Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs text-gray-500 font-medium py-3 px-3">Mặc định</th>
              <th className="text-left text-xs text-gray-500 font-medium py-3 px-3">Số điện thoại</th>
              <th className="text-left text-xs text-gray-500 font-medium py-3 px-3">Họ tên</th>
              <th className="text-left text-xs text-gray-500 font-medium py-3 px-3">Địa chỉ</th>
              <th className="text-left text-xs text-gray-500 font-medium py-3 px-3">PostCode</th>
              <th className="text-left text-xs text-gray-500 font-medium py-3 px-3">Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((address) => (
              <tr key={address.id} className="border-b border-gray-100">
                <td className="py-4 px-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    address.isDefault ? 'border-[#0A923C]' : 'border-gray-300'
                  }`}>
                    {address.isDefault && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0A923C]" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-3 text-xs text-gray-700">{address.phone}</td>
                <td className="py-4 px-3 text-xs text-gray-700">{address.name}</td>
                <td className="py-4 px-3">
                  <p className="text-xs text-gray-700">{address.address}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-1 bg-gray-100 rounded text-[10px] text-gray-600">
                    {address.type}
                  </span>
                </td>
                <td className="py-4 px-3 text-xs text-gray-700 max-w-[160px]">
                  {address.postCode}
                </td>
                <td className="py-4 px-3">
                  <div className="flex gap-2.5">
                    <button className="text-gray-400 hover:text-[#0A923C] transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
