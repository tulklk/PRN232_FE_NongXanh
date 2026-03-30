'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { getRecipes } from '@/lib/api/recipes'
import type { RecipeModel } from '@/lib/types/api'

function getRecipeId(r: RecipeModel): string {
  return String(r.recipeId ?? r.id ?? '')
}

function getRecipeTitle(r: RecipeModel): string {
  return String(r.title ?? r.name ?? 'Công thức')
}

export default function AdminRecipesPage() {
  const { user, tokens, isAuthenticated } = useUser()
  const [items, setItems] = useState<RecipeModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin'

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken || !isAdmin) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getRecipes({ pageNumber: 1, pageSize: 50 }, tokens.idToken)
      .then(setItems)
      .catch((e) => {
        setItems([])
        setError(e instanceof Error ? e.message : 'Không thể tải recipes')
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, tokens?.idToken, isAdmin])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return items
    return items.filter((r) => getRecipeTitle(r).toLowerCase().includes(t))
  }, [items, q])

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Recipes</h1>
        <p className="text-sm text-gray-600 mb-4">
          Vui lòng đăng nhập để quản lý công thức.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary-green px-4 py-2 text-sm font-semibold text-white hover:bg-primary-green-dark"
        >
          Đăng nhập
        </Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Recipes</h1>
        <p className="text-sm text-red-700">
          Không có quyền truy cập trang quản trị công thức.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý công thức
          </h1>
          <p className="text-gray-600">
            Tạo và quản lý các công thức nấu ăn cho website
          </p>
        </div>
        <Link
          href="/admin/recipes/new"
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors inline-flex items-center gap-2"
        >
          <Plus size={20} />
          Tạo công thức mới
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tìm kiếm</h2>
        <div className="relative max-w-xl">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tiêu đề..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        {loading ? (
          <div className="py-14 text-center text-gray-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-gray-500">
            Chưa có công thức.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const id = getRecipeId(r)
              const title = getRecipeTitle(r)
              return (
                <div
                  key={id || title}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 line-clamp-1">
                      {title}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-1">
                      {r.description ?? r.content ?? ''}
                    </div>
                  </div>
                  {id ? (
                    <Link
                      href={`/recipes/${id}`}
                      className="text-sm font-semibold text-primary-green hover:underline flex-shrink-0"
                    >
                      Xem
                    </Link>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

