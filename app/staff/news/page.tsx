'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { newsArticles, newsCategories } from '@/data/news'
import { formatDate } from '@/lib/utils'

export default function StaffNewsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [newsList] = useState(newsArticles)

  const filteredNews = newsList.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' // Simplified for now
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý tin tức</h1>
          <p className="text-gray-600">Tạo và quản lý các bài viết tin tức cho website</p>
        </div>
        <button className="bg-[#0A923C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#10723A] transition-colors flex items-center gap-2">
          <Plus size={20} />
          Tạo tin tức mới
        </button>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tìm kiếm tin tức</h2>
        <div className="space-y-4">
          <SearchBar
            placeholder="Tìm kiếm theo tiêu đề, tóm tắt, nội dung..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C]"
              >
                <option value="all">Tất cả danh mục</option>
                {newsCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A923C]"
              >
                <option value="all">Tất cả</option>
                <option value="published">Đã publish</option>
                <option value="unpublished">Chưa publish</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Danh sách tin tức ({filteredNews.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tiêu đề</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Danh mục</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tác giả</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Trạng thái</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Lượt xem</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ngày tạo</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.map((article) => (
                <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{article.title}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{article.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">Nhân viên</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status="unpublished">Chưa publish</StatusBadge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">0</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{formatDate(article.date)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-600 hover:text-[#0A923C] hover:bg-green-50 rounded transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
