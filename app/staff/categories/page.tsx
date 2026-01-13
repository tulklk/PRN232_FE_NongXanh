'use client'

import { useState } from 'react'
import { Eye, Lock } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import { categories } from '@/data/categories'

export default function StaffCategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryList] = useState(categories)

  const filteredCategories = categoryList.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh mục</h1>
          <p className="text-gray-600">
            Tất cả danh mục - Xem danh sách danh mục sản phẩm (danh mục gốc và danh mục con)
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-500">
          <Lock size={18} />
          <span className="text-sm">Chỉ Admin có quyền thêm/sửa danh mục</span>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tìm kiếm danh mục</h2>
        <SearchBar
          placeholder="Tìm theo tên hoặc mô tả..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Danh sách danh mục ({filteredCategories.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Slug</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Danh mục cha</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => {
                const parentCategory = category.parentId
                  ? categoryList.find((c) => c.id === category.parentId)
                  : null
                return (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 font-mono text-sm">{category.slug}</span>
                    </td>
                    <td className="py-3 px-4">
                      {parentCategory ? (
                        <span className="text-[#0A923C] font-medium">{parentCategory.name}</span>
                      ) : (
                        <span className="text-gray-400">Danh mục gốc</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-600 hover:text-[#0A923C] hover:bg-green-50 rounded transition-colors">
                        <Eye size={18} />
                      </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
