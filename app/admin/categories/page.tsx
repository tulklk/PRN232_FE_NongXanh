'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Edit, Trash2, Loader2, X, ChevronRight, ChevronDown } from 'lucide-react'
import SearchBar from '@/components/admin/SearchBar'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/lib/api/categories'
import { useUser } from '@/contexts/UserContext'
import type { ApiCategory } from '@/lib/types/api'

function flattenCategories(cats: ApiCategory[]): ApiCategory[] {
  const result: ApiCategory[] = []
  for (const c of cats) {
    if (!c.isDeleted) {
      result.push(c)
      if (c.children?.length) {
        result.push(...flattenCategories(c.children))
      }
    }
  }
  return result
}

/** Build tree from flat list (when API returns flat with parentId) */
function buildCategoryTree(flat: ApiCategory[]): ApiCategory[] {
  const map = new Map<number, ApiCategory & { children: ApiCategory[] }>()
  const roots: (ApiCategory & { children: ApiCategory[] })[] = []
  for (const c of flat) {
    if (c.isDeleted) continue
    const node = { ...c, children: [...(c.children || [])] }
    map.set(c.categoryId, node)
  }
  for (const c of Array.from(map.values())) {
    const parentId = c.parentId ?? null
    if (parentId == null || !map.has(parentId)) {
      roots.push(c)
    } else {
      const parent = map.get(parentId)!
      if (!parent.children) parent.children = []
      parent.children.push(c)
    }
  }
  return roots
}

/** Get tree - use as-is if has nested children, else build from flat */
function getCategoryTree(cats: ApiCategory[]): ApiCategory[] {
  const hasNested = cats.some((c) => c.children && c.children.length > 0)
  if (hasNested) return cats.filter((c) => !c.isDeleted)
  const flat = cats.filter((c) => !c.isDeleted)
  if (flat.some((c) => c.parentId != null && c.parentId !== 0))
    return buildCategoryTree(flat)
  return flat
}

/** Filter tree by search - include parent if any descendant matches */
function filterCategoryTree(
  tree: ApiCategory[],
  query: string
): ApiCategory[] {
  const q = query.toLowerCase().trim()
  if (!q) return tree
  function match(c: ApiCategory): boolean {
    const nameMatch = c.categoryName.toLowerCase().includes(q)
    const descMatch = (c.description ?? '').toLowerCase().includes(q)
    return nameMatch || descMatch
  }
  function filterNode(c: ApiCategory): ApiCategory | null {
    if (c.isDeleted) return null
    const children = (c.children ?? []).map(filterNode).filter(Boolean) as ApiCategory[]
    const selfMatch = match(c)
    if (selfMatch || children.length > 0) {
      return { ...c, children: children.length > 0 ? children : c.children }
    }
    return null
  }
  return tree.map(filterNode).filter(Boolean) as ApiCategory[]
}

function findCategoryInTree(tree: ApiCategory[], id: number): ApiCategory | null {
  for (const c of tree) {
    if (c.categoryId === id) return c
    if (c.children?.length) {
      const found = findCategoryInTree(c.children, id)
      if (found) return found
    }
  }
  return null
}

function countAll(cats: ApiCategory[]): number {
  let n = 0
  for (const c of cats) {
    if (!c.isDeleted) n++
    if (c.children?.length) n += countAll(c.children)
  }
  return n
}

function CategoryRow({
  category,
  level,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  category: ApiCategory
  level: number
  expandedIds: Set<number>
  onToggleExpand: (id: number) => void
  onEdit: (c: ApiCategory) => void
  onDelete: (c: ApiCategory) => void
}) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category.categoryId)
  const childCount = hasChildren ? countAll(category.children!) : 0

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-3 px-4">
          <div
            className="flex items-center gap-2 min-w-0"
            style={{ paddingLeft: level * 24 }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggleExpand(category.categoryId)}
                className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded text-gray-600"
              >
                {isExpanded ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
            ) : (
              <span className="w-[26px] flex-shrink-0 inline-block" />
            )}
            <span className="font-medium text-gray-900">{category.categoryName}</span>
            {hasChildren && (
              <span className="text-sm text-gray-500">({childCount} danh mục)</span>
            )}
          </div>
        </td>
        <td className="py-3 px-4">
          <span className="text-gray-600">
            {category.description || 'Không có mô tả'}
          </span>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => onEdit(category)}
              className="p-2 text-gray-600 hover:text-primary-green hover:bg-primary-green-light rounded transition-colors"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
      {hasChildren && isExpanded &&
        category.children!.map((child) => (
          <CategoryRow
            key={child.categoryId}
            category={child}
            level={level + 1}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </>
  )
}

export default function CategoriesPage() {
  const { tokens } = useUser()
  const token = tokens?.idToken ?? undefined

  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editCategory, setEditCategory] = useState<ApiCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const categoryTree = getCategoryTree(categories)
  const filteredTree = filterCategoryTree(categoryTree, searchQuery)
  const allCategories = flattenCategories(categories)

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = async (parentData: CreateCategoryInput, children: { name: string; description?: string }[]) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      const parent = await createCategory(
        { ...parentData, parentId: undefined },
        token
      )
      for (const child of children) {
        if (child.name.trim()) {
          await createCategory(
            { categoryName: child.name.trim(), description: child.description?.trim(), parentId: parent.categoryId },
            token
          )
        }
      }
      setShowAddModal(false)
      await fetchCategories()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể tạo danh mục')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUpdate = async (
    parentId: number,
    parentData: CreateCategoryInput,
    children: { categoryId?: number; name: string; description?: string }[],
    deletedChildIds: number[] = []
  ) => {
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await updateCategory(String(parentId), parentData, token)
      for (const id of deletedChildIds) {
        await deleteCategory(String(id), token)
      }
      for (const child of children) {
        if (!child.name.trim()) continue
        if (child.categoryId) {
          await updateCategory(String(child.categoryId), {
            categoryName: child.name.trim(),
            description: child.description?.trim(),
            parentId,
          }, token)
        } else {
          await createCategory({
            categoryName: child.name.trim(),
            description: child.description?.trim(),
            parentId,
          }, token)
        }
      }
      setEditCategory(null)
      await fetchCategories()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể cập nhật danh mục')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitLoading(true)
    setSubmitError(null)
    try {
      await deleteCategory(String(deleteTarget.categoryId), token)
      setDeleteTarget(null)
      await fetchCategories()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể xóa danh mục')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh mục</h1>
          <p className="text-gray-600">
            Tất cả danh mục - Quản lý danh mục sản phẩm (danh mục gốc và danh mục con)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm danh mục
        </button>
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
          Danh sách danh mục ({flattenCategories(filteredTree).length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary-green" size={32} />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="bg-primary-green text-white px-4 py-2 rounded-lg hover:bg-primary-green-dark"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Mô tả</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTree.map((category) => (
                  <CategoryRow
                    key={category.categoryId}
                    category={category}
                    level={0}
                    expandedIds={expandedIds}
                    onToggleExpand={toggleExpand}
                    onEdit={setEditCategory}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal - Parent + Children */}
      {showAddModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <AddCategoryWithChildrenModal
            onClose={() => {
              setShowAddModal(false)
              setSubmitError(null)
            }}
            onSubmit={handleCreate}
            loading={submitLoading}
            error={submitError}
          />,
          document.body
        )}

      {/* Edit Modal - same structure as Add */}
      {editCategory &&
        typeof document !== 'undefined' &&
        createPortal(
          <EditCategoryWithChildrenModal
            editCategory={editCategory}
            categoryTree={categoryTree}
            onClose={() => {
              setEditCategory(null)
              setSubmitError(null)
            }}
            onSubmit={handleUpdate}
            loading={submitLoading}
            error={submitError}
          />,
          document.body
        )}

      {/* Delete Confirm */}
      {deleteTarget &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
          >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa danh mục &quot;{deleteTarget.categoryName}&quot;?
            </p>
            {submitError && (
              <p className="text-red-600 text-sm mb-4">{submitError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteTarget(null)
                  setSubmitError(null)
                }}
                disabled={submitLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={submitLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                Xóa
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  )
}

interface AddCategoryWithChildrenModalProps {
  onClose: () => void
  onSubmit: (
    parentData: CreateCategoryInput,
    children: { name: string; description?: string }[]
  ) => void
  loading: boolean
  error: string | null
}

function AddCategoryWithChildrenModal({
  onClose,
  onSubmit,
  loading,
  error,
}: AddCategoryWithChildrenModalProps) {
  const [parentName, setParentName] = useState('')
  const [parentDescription, setParentDescription] = useState('')
  const [children, setChildren] = useState<{ id: number; name: string; description: string }[]>([
    { id: 1, name: '', description: '' },
  ])
  const [nextId, setNextId] = useState(2)

  const addChild = () => {
    setChildren((prev) => [...prev, { id: nextId, name: '', description: '' }])
    setNextId((n) => n + 1)
  }

  const removeChild = (id: number) => {
    setChildren((prev) => prev.filter((c) => c.id !== id))
  }

  const updateChild = (id: number, field: 'name' | 'description', value: string) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentName.trim()) return
    onSubmit(
      {
        categoryName: parentName.trim(),
        description: parentDescription.trim() || undefined,
      },
      children
        .filter((c) => c.name.trim())
        .map((c) => ({ name: c.name.trim(), description: c.description?.trim() || undefined }))
    )
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Thông tin danh mục cha & danh mục con</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Danh mục cha</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên danh mục cha
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Ví dụ: Rau củ quả"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả danh mục cha
              </label>
              <textarea
                value={parentDescription}
                onChange={(e) => setParentDescription(e.target.value)}
                placeholder="Mô tả về danh mục này..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Danh mục con (tuỳ chọn)</h4>
              <button
                type="button"
                onClick={addChild}
                disabled={loading}
                className="text-sm text-primary-green hover:text-primary-green-dark font-medium"
              >
                + Thêm danh mục con
              </button>
            </div>
            {children.map((child) => (
              <div key={child.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Tên danh mục con {children.indexOf(child) + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    disabled={loading || children.length <= 1}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                  placeholder="Nhập tên danh mục con"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
                  disabled={loading}
                />
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Mô tả danh mục con (tuỳ chọn)
                  </label>
                  <textarea
                    value={child.description}
                    onChange={(e) => updateChild(child.id, 'description', e.target.value)}
                    placeholder="Mô tả tùy chọn..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none bg-white"
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !parentName.trim()}
              className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Tạo danh mục
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditCategoryWithChildrenModalProps {
  editCategory: ApiCategory
  categoryTree: ApiCategory[]
  onClose: () => void
  onSubmit: (
    parentId: number,
    parentData: CreateCategoryInput,
    children: { categoryId?: number; name: string; description?: string }[],
    deletedChildIds?: number[]
  ) => void
  loading: boolean
  error: string | null
}

function EditCategoryWithChildrenModal({
  editCategory,
  categoryTree,
  onClose,
  onSubmit,
  loading,
  error,
}: EditCategoryWithChildrenModalProps) {
  const parent =
    editCategory.parentId != null
      ? findCategoryInTree(categoryTree, editCategory.parentId)
      : editCategory
  const initialChildren = (parent?.children ?? []).filter((c) => !c.isDeleted)

  const [parentName, setParentName] = useState(parent?.categoryName ?? '')
  const [parentDescription, setParentDescription] = useState(parent?.description ?? '')
  const [children, setChildren] = useState<
    { id: number; categoryId?: number; name: string; description: string }[]
  >(
    initialChildren.length > 0
      ? initialChildren.map((c, i) => ({
          id: i + 1,
          categoryId: c.categoryId,
          name: c.categoryName,
          description: c.description ?? '',
        }))
      : [{ id: 1, name: '', description: '' }]
  )
  const [nextId, setNextId] = useState(children.length + 2)
  const [deletedIds, setDeletedIds] = useState<number[]>([])

  const addChild = () => {
    setChildren((prev) => [...prev, { id: nextId, name: '', description: '' }])
    setNextId((n) => n + 1)
  }

  const removeChild = (id: number, categoryId?: number) => {
    setChildren((prev) => prev.filter((c) => c.id !== id))
    if (categoryId) setDeletedIds((prev) => [...prev, categoryId])
  }

  const updateChild = (id: number, field: 'name' | 'description', value: string) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentName.trim() || !parent) return
    onSubmit(
      parent.categoryId,
      {
        categoryName: parentName.trim(),
        description: parentDescription.trim() || undefined,
      },
      children
        .filter((c) => c.name.trim())
        .map((c) => ({
          categoryId: c.categoryId,
          name: c.name.trim(),
          description: c.description?.trim() || undefined,
        })),
      deletedIds
    )
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Thông tin danh mục cha & danh mục con</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Danh mục cha</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên danh mục cha
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Ví dụ: Rau củ quả"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả danh mục cha
              </label>
              <textarea
                value={parentDescription}
                onChange={(e) => setParentDescription(e.target.value)}
                placeholder="Mô tả về danh mục này..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Danh mục con (tuỳ chọn)</h4>
              <button
                type="button"
                onClick={addChild}
                disabled={loading}
                className="text-sm text-primary-green hover:text-primary-green-dark font-medium"
              >
                + Thêm danh mục con
              </button>
            </div>
            {children.map((child) => (
              <div key={child.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Tên danh mục con {children.indexOf(child) + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeChild(child.id, child.categoryId)}
                    disabled={loading || children.length <= 1}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => updateChild(child.id, 'name', e.target.value)}
                  placeholder="Nhập tên danh mục con"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
                  disabled={loading}
                />
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Mô tả danh mục con (tuỳ chọn)
                  </label>
                  <textarea
                    value={child.description}
                    onChange={(e) => updateChild(child.id, 'description', e.target.value)}
                    placeholder="Mô tả tùy chọn..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green resize-none bg-white"
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !parentName.trim()}
              className="px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
