'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { getRecipes } from '@/lib/api/recipes'
import type { RecipeModel } from '@/lib/types/api'

function getRecipeId(r: RecipeModel): string {
  return String(r.recipeId ?? r.id ?? '')
}

function getRecipeTitle(r: RecipeModel): string {
  return String(r.title ?? r.name ?? 'Công thức')
}

function getRecipeThumb(r: RecipeModel): string | null {
  const url = r.thumbnailUrl ?? r.imageUrl ?? null
  if (!url) return null
  const s = String(url).trim()
  if (!s || s.toLowerCase() === 'string') return null
  return s
}

export default function RecipesPage() {
  const { tokens, isAuthenticated } = useUser()
  const [items, setItems] = useState<RecipeModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getRecipes({ pageNumber: 1, pageSize: 50 }, tokens.idToken)
      .then(setItems)
      .catch((e) => {
        setItems([])
        setError(e instanceof Error ? e.message : 'Không thể tải công thức')
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, tokens?.idToken])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return items
    return items.filter((r) => getRecipeTitle(r).toLowerCase().includes(t))
  }, [items, q])

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Nấu ăn</h1>
            <p className="text-sm text-gray-600 mb-4">
              Vui lòng đăng nhập để xem công thức nấu ăn.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-primary-green px-4 py-2 text-sm font-semibold text-white hover:bg-primary-green-dark"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Công thức nấu ăn</h1>
            <p className="text-sm text-gray-600 mt-1">
              Chọn công thức và thêm toàn bộ nguyên liệu vào giỏ hàng.
            </p>
          </div>
          <div className="relative w-full md:w-[360px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm công thức..."
              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-14 text-center text-gray-500">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            Không có công thức phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const id = getRecipeId(r)
              const title = getRecipeTitle(r)
              const thumb = getRecipeThumb(r)
              return (
                <Link
                  key={id || title}
                  href={id ? `/recipes/${id}` : '/recipes'}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                >
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized={thumb.startsWith('http')}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {r.description ?? r.content ?? 'Xem chi tiết công thức.'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

