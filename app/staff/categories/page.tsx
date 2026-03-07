'use client'

import { useState, useEffect } from 'react'
import { Eye, Lock } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import { useUser } from '@/contexts/UserContext'
import { getCategories } from '@/lib/api/categories'

interface Category {
    id: string
    name: string
    slug: string
    description: string
    parentId: string | null
    parentName?: string
    children: Array<{
        id: string
        name: string
    }>
}

export default function StaffCategoriesPage() {
    const { tokens } = useUser()
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryList, setCategoryList] = useState<Category[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true)
                if (!tokens?.idToken) return

                const data = await getCategories()

                // Map categories từ API response và giữ lại nested structure
                const mappedCategories: Category[] = (data || []).map((item: any) => ({
                    id: item.categoryId,
                    name: item.categoryName,
                    slug: item.categoryName.toLowerCase().replace(/\s+/g, '-'),
                    description: item.description || '',
                    parentId: item.parentId || null,
                    children: (item.children || []).map((child: any) => ({
                        id: child.categoryId,
                        name: child.categoryName
                    }))
                }))

                setCategoryList(mappedCategories)
                setError(null)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định'
                setError(errorMessage)
                setCategoryList([])
            } finally {
                setLoading(false)
            }
        }

        fetchCategories()
    }, [tokens])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-gray-600">Đang tải dữ liệu...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-red-600">Lỗi: {error}</p>
            </div>
        )
    }

    const filteredCategories = categoryList.filter(
        (cat) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getSelectedCategoryData = () => {
        return categoryList.find((c) => c.id === selectedCategory)
    }

    const getParentCategoryName = (parentId: string | null) => {
        if (!parentId) return 'Danh mục gốc'
        const parent = categoryList.find((c) => c.id === parentId)
        return parent?.name || 'Danh mục gốc'
    }

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

            {/* Categories List & Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Danh sách danh mục ({filteredCategories.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Mô tả</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Danh mục cha</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.map((category) => (
                                    <tr
                                        key={category.id}
                                        className={`border-b hover:bg-gray-50 cursor-pointer ${selectedCategory === category.id ? 'bg-green-50' : ''
                                            }`}
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-600 text-sm line-clamp-1">{category.description}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {category.parentId ? (
                                                <span className="text-[#0A923C] font-medium text-sm">
                                                    {getParentCategoryName(category.parentId)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Danh mục gốc</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedCategory(category.id)
                                                    }}
                                                    className="p-2 text-gray-600 hover:text-[#0A923C] hover:bg-green-50 rounded transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Chi tiết danh mục</h2>
                    {selectedCategory ? (
                        (() => {
                            const category = getSelectedCategoryData()
                            if (!category) return null

                            return (
                                <div className="space-y-4">
                                    <div className="text-center pb-4 border-b">
                                        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-[#0A923C]">
                                                {category.name.charAt(0)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg">{category.name}</h3>
                                        <p className="text-sm text-gray-600 font-mono">{category.slug}</p>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div>
                                            <p className="font-semibold text-gray-900">Mô tả</p>
                                            <p>{category.description || 'Không có mô tả'}</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-gray-900">Danh mục cha</p>
                                            <p>
                                                {category.parentId ? (
                                                    <span className="text-[#0A923C] font-medium">
                                                        {getParentCategoryName(category.parentId)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">Danh mục gốc</span>
                                                )}
                                            </p>
                                        </div>

                                        {category.children && category.children.length > 0 ? (
                                            <div>
                                                <p className="font-semibold text-gray-900 mb-2">Danh mục con</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {category.children.map((child) => (
                                                        <span
                                                            key={child.id}
                                                            className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-[#0A923C] text-sm font-semibold"
                                                        >
                                                            {child.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-semibold text-gray-900">Danh mục con</p>
                                                <p className="text-gray-400 text-sm">Không có danh mục con</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })()
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            Chọn một danh mục để xem chi tiết
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
