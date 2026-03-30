'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { createRecipe } from '@/lib/api/recipes'
import { prefetchProductSearchCatalog, searchProducts } from '@/lib/api/products'
import type { Product } from '@/data/products'

type IngredientRow = {
  productId: string
  ingredientName: string
  image?: string
  quantity: string
  unit: string
}

function normalizeUnit(v: string): string {
  const s = v.trim()
  return s || 'kg'
}

export default function AdminRecipeCreatePage() {
  const router = useRouter()
  const { user, tokens, isAuthenticated } = useUser()

  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [cookingTimeMinutes, setCookingTimeMinutes] = useState<number>(20)
  const [servings, setServings] = useState<number>(2)
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [productQuery, setProductQuery] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [productResults, setProductResults] = useState<Product[]>([])
  const [productOpen, setProductOpen] = useState(false)
  const productSeqRef = useRef(0)

  useEffect(() => {
    prefetchProductSearchCatalog()
  }, [])

  useEffect(() => {
    if (!productQuery.trim()) {
      setProductResults([])
      setProductOpen(false)
      return
    }
    const seq = ++productSeqRef.current
    setProductLoading(true)
    const t = setTimeout(() => {
      searchProducts(productQuery.trim(), 10)
        .then((res) => {
          if (productSeqRef.current !== seq) return
          setProductResults(res)
          setProductOpen(true)
        })
        .catch(() => {
          if (productSeqRef.current !== seq) return
          setProductResults([])
          setProductOpen(true)
        })
        .finally(() => {
          if (productSeqRef.current !== seq) return
          setProductLoading(false)
        })
    }, 120)
    return () => clearTimeout(t)
  }, [productQuery])

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false
    if (!instructions.trim()) return false
    if (!Number.isFinite(cookingTimeMinutes) || cookingTimeMinutes <= 0) return false
    if (!Number.isFinite(servings) || servings <= 0) return false
    if (ingredients.length === 0) return false
    for (const it of ingredients) {
      if (!it.productId) return false
      if (!it.ingredientName.trim()) return false
      const q = Number(it.quantity)
      if (!Number.isFinite(q) || q <= 0) return false
      if (!it.unit.trim()) return false
    }
    return true
  }, [title, instructions, cookingTimeMinutes, servings, ingredients])

  function addIngredientFromProduct(p: Product) {
    setIngredients((prev) => {
      if (prev.some((x) => x.productId === p.id)) return prev
      return [
        ...prev,
        {
          productId: p.id,
          ingredientName: p.name,
          image: p.image,
          quantity: '1',
          unit: 'kg',
        },
      ]
    })
    setProductQuery('')
    setProductOpen(false)
  }

  function removeIngredient(productId: string) {
    setIngredients((prev) => prev.filter((x) => x.productId !== productId))
  }

  async function handleSubmit() {
    if (!tokens?.idToken) return
    if (!canSubmit || saving) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await createRecipe(
        {
          title: title.trim(),
          description: description.trim() ? description.trim() : undefined,
          instructions: instructions.trim(),
          cookingTimeMinutes,
          servings,
          ingredients: ingredients.map((it) => ({
            productId: it.productId,
            ingredientName: it.ingredientName.trim(),
            quantity: Number(it.quantity),
            unit: normalizeUnit(it.unit),
          })),
        },
        tokens.idToken
      )
      setSuccess('Tạo công thức thành công.')
      setTimeout(() => router.push('/admin/recipes'), 500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tạo recipe')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Tạo công thức</h1>
        <p className="text-sm text-gray-600 mb-4">
          Vui lòng đăng nhập để tạo công thức.
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
        <h1 className="text-xl font-bold text-gray-900 mb-2">Tạo công thức</h1>
        <p className="text-sm text-red-700">Không có quyền tạo công thức.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/recipes"
            className="inline-flex items-center gap-2 text-primary-green hover:underline mb-2"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Tạo công thức mới</h1>
          <p className="text-gray-600 mt-1">
            Nhập thông tin và chọn nguyên liệu từ danh sách sản phẩm.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          {saving ? 'Đang tạo...' : 'Tạo công thức'}
        </button>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin cơ bản</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="Ví dụ: Canh rau ngót thịt bằm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[90px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="Mô tả ngắn về công thức..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Hướng dẫn</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instructions <span className="text-red-500">*</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full min-h-[160px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="Các bước thực hiện..."
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Thông số</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thời gian nấu (phút) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={cookingTimeMinutes}
                  onChange={(e) => setCookingTimeMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Khẩu phần <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Nguyên liệu <span className="text-red-500">*</span>
            </h2>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                onFocus={() => {
                  if (productResults.length) setProductOpen(true)
                }}
                placeholder="Tìm sản phẩm để thêm..."
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
              />
              {productOpen && (
                <div className="absolute left-0 right-0 mt-2 z-50 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="max-h-72 overflow-y-auto">
                    {productLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Đang tìm...
                      </div>
                    ) : productResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Không tìm thấy sản phẩm
                      </div>
                    ) : (
                      productResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addIngredientFromProduct(p)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                              {p.image ? (
                                <Image
                                  src={p.image}
                                  alt={p.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 line-clamp-1">
                                {p.name}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductOpen(false)}
                    className="w-full border-t border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>

            {ingredients.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center">
                Chưa có nguyên liệu. Hãy tìm sản phẩm để thêm.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {ingredients.map((it) => (
                  <div
                    key={it.productId}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex items-start gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                          {it.image ? (
                            <Image
                              src={it.image}
                              alt={it.ingredientName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 line-clamp-1">
                            {it.ingredientName}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredient(it.productId)}
                        className="text-red-600 hover:text-red-700"
                        title="Xoá"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Số lượng
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          value={it.quantity}
                          onChange={(e) =>
                            setIngredients((prev) =>
                              prev.map((x) =>
                                x.productId === it.productId
                                  ? { ...x, quantity: e.target.value }
                                  : x
                              )
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Đơn vị
                        </label>
                        <input
                          value={it.unit}
                          onChange={(e) =>
                            setIngredients((prev) =>
                              prev.map((x) =>
                                x.productId === it.productId
                                  ? { ...x, unit: e.target.value }
                                  : x
                              )
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                          placeholder="kg / g / bó / gói..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

