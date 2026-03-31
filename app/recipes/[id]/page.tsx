'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { addRecipeIngredientsToCart, getRecipeById } from '@/lib/api/recipes'
import type { RecipeIngredient, RecipeModel } from '@/lib/types/api'
import { getProductById } from '@/lib/api/products'

function getTitle(r: RecipeModel): string {
  return String(r.title ?? r.name ?? 'Công thức')
}

function getImageUrl(r: RecipeModel): string | null {
  const url = r.imageUrl ?? r.thumbnailUrl ?? null
  if (!url) return null
  const s = String(url).trim()
  if (!s || s.toLowerCase() === 'string') return null
  return s
}

function getIngredients(r: RecipeModel): RecipeIngredient[] {
  const list = (r.ingredients ?? r.items ?? []) as RecipeIngredient[] | null | undefined
  return Array.isArray(list) ? list : []
}

export default function RecipeDetailPage() {
  const params = useParams()
  const id = String(params.id ?? '')
  const { tokens, isAuthenticated } = useUser()

  const [recipe, setRecipe] = useState<RecipeModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  const [productMetaById, setProductMetaById] = useState<
    Record<string, { name: string; image: string }>
  >({})
  const metaLoadSeqRef = useRef(0)

  useEffect(() => {
    if (!tokens?.idToken || !id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getRecipeById(id, tokens.idToken)
      .then((r) => setRecipe(r))
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể tải công thức'))
      .finally(() => setLoading(false))
  }, [id, tokens?.idToken])

  const ingredients = useMemo(() => (recipe ? getIngredients(recipe) : []), [recipe])
  const title = recipe ? getTitle(recipe) : ''
  const imageUrl = recipe ? getImageUrl(recipe) : null

  useEffect(() => {
    if (!ingredients.length) return
    const nextSeq = ++metaLoadSeqRef.current

    const ids = new Set<string>()
    for (const it of ingredients) {
      const pid = String(it.productId ?? '').trim()
      if (pid && !productMetaById[pid]) ids.add(pid)
    }
    const missing = Array.from(ids)
    if (missing.length === 0) return

    const CONCURRENCY = 8
    let cancelled = false

    async function run() {
      const acc: Record<string, { name: string; image: string }> = {}
      for (let i = 0; i < missing.length; i += CONCURRENCY) {
        const chunk = missing.slice(i, i + CONCURRENCY)
        const results = await Promise.all(
          chunk.map(async (pid) => {
            try {
              const p = await getProductById(pid)
              if (!p) return null
              return { pid, name: p.name, image: p.image ?? '' }
            } catch {
              return null
            }
          })
        )
        for (const r of results) {
          if (!r) continue
          acc[r.pid] = { name: r.name, image: r.image }
        }
      }

      if (cancelled) return
      if (metaLoadSeqRef.current !== nextSeq) return
      if (Object.keys(acc).length === 0) return
      setProductMetaById((prev) => ({ ...prev, ...acc }))
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients])

  const handleAddAll = async () => {
    if (!tokens?.idToken || !id || adding) return
    setAdding(true)
    setError(null)
    setInfo(null)
    try {
      await addRecipeIngredientsToCart(id, tokens.idToken)
      setInfo('Chúng tôi đã làm tròn số lượng theo đơn vị bán nhỏ nhất của cửa hàng.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể thêm vào giỏ')
    } finally {
      setAdding(false)
    }
  }

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-center py-14 text-gray-500">Đang tải công thức...</p>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-center py-14 text-red-600">
          {error ?? 'Không tìm thấy công thức'}
        </p>
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 text-primary-green hover:underline"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách công thức
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-2 text-primary-green hover:underline mb-5"
        >
          <ArrowLeft size={18} />
          Quay lại công thức
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="relative w-full aspect-[16/9] bg-gray-100">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    unoptimized={imageUrl.startsWith('http')}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50" />
                )}
              </div>
              <div className="p-5">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {title}
                </h1>
                {(recipe.description || recipe.content) && (
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                    {recipe.description ?? recipe.content}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-base font-bold text-gray-900">Nguyên liệu</h2>
                <span className="text-sm text-gray-500">{ingredients.length}</span>
              </div>

              {info && (
                <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                  {info}
                </div>
              )}
              {error && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {ingredients.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">
                  Chưa có danh sách nguyên liệu.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ingredients.map((it, idx) => (
                    <div
                      key={`${it.productId}-${idx}`}
                      className="py-2 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                          {productMetaById[String(it.productId)]?.image ? (
                            <Image
                              src={productMetaById[String(it.productId)].image}
                              alt={productMetaById[String(it.productId)].name}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized={productMetaById[String(it.productId)].image.startsWith('http')}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50" />
                          )}
                        </div>
                        <span className="text-gray-800 line-clamp-1">
                          {it.productName ??
                            productMetaById[String(it.productId)]?.name ??
                            'Sản phẩm'}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {it.quantity}
                        {it.unit ? ` ${it.unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddAll}
                disabled={adding || ingredients.length === 0}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={18} />
                {adding ? 'Đang thêm...' : 'Thêm tất cả nguyên liệu vào giỏ'}
              </button>

              <p className="mt-2 text-xs text-gray-500">
                Khi thêm từ công thức, hệ thống có thể làm tròn số lượng theo đơn vị bán nhỏ nhất.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

