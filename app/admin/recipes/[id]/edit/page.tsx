'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { getRecipeById, updateRecipe } from '@/lib/api/recipes'
import { uploadImageToCloudinary } from '@/lib/api/cloudinary'
import {
  getVariantsByProductId,
  getProductById,
  lookupProducts,
  type ProductLookupItem,
} from '@/lib/api/products'
import type { ApiProductVariant } from '@/lib/types/api'
import type { RecipeIngredient, RecipeModel } from '@/lib/types/api'

type IngredientRow = {
  rowId: string
  productId: string
  productName?: string
  variantId: string | null
  variantName?: string | null
  ingredientName: string
  quantity: string
  unit: string
}

function normalizeUnit(v: string): string {
  const s = v.trim()
  return s || 'kg'
}

function getRecipeId(r: RecipeModel | null): string {
  if (!r) return ''
  return String(r.recipeId ?? r.id ?? '').trim()
}

function getRecipeIngredients(r: RecipeModel | null): RecipeIngredient[] {
  if (!r) return []
  const anyR = r as any
  const list = (anyR.ingredients ?? anyR.Ingredients ?? anyR.items ?? anyR.Items ?? []) as
    | RecipeIngredient[]
    | null
    | undefined
  return Array.isArray(list) ? list : []
}

export default function AdminRecipeEditPage() {
  const router = useRouter()
  const params = useParams()
  const routeId = String((params as any)?.id ?? '')

  const { user, tokens, isAuthenticated } = useUser()
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin'

  const [loadingRecipe, setLoadingRecipe] = useState(true)
  const [recipe, setRecipe] = useState<RecipeModel | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cookingTimeMinutes, setCookingTimeMinutes] = useState<number>(20)
  const [servings, setServings] = useState<number>(2)
  const [ingredients, setIngredients] = useState<IngredientRow[]>([])
  const [variantsByProductId, setVariantsByProductId] = useState<
    Record<string, ApiProductVariant[]>
  >({})
  const [productImageById, setProductImageById] = useState<Record<string, string>>({})

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [productQuery, setProductQuery] = useState<Record<string, string>>({})
  const [productLoading, setProductLoading] = useState<Record<string, boolean>>({})
  const [productResults, setProductResults] = useState<Record<string, ProductLookupItem[]>>({})
  const [productOpenRow, setProductOpenRow] = useState<string | null>(null)
  const productSeqRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken || !isAdmin) {
      setLoadingRecipe(false)
      return
    }
    const rid = String(routeId ?? '').trim()
    if (!rid) {
      setLoadingRecipe(false)
      setError('Thiếu recipeId')
      return
    }

    setLoadingRecipe(true)
    setError(null)
    getRecipeById(rid, tokens.idToken)
      .then((r) => {
        setRecipe(r)
        if (!r) return
        setTitle(String(r.title ?? r.name ?? '').trim())
        setDescription(String(r.description ?? '').trim())
        setInstructions(String((r as any).instructions ?? r.content ?? '').trim())
        {
          const anyR = r as any
          const url = String(anyR.imageUrl ?? anyR.thumbnailUrl ?? '').trim()
          setImageUrl(url || null)
        }
        setCookingTimeMinutes(
          Number((r as any).cookingTimeMinutes ?? (r as any).cookingTime ?? 20) || 20
        )
        setServings(Number((r as any).servings ?? 2) || 2)

        const rows: IngredientRow[] = getRecipeIngredients(r).map((it) => {
          const anyIt = it as any
          const ingredientName =
            String(anyIt.ingredientName ?? it.productName ?? '').trim() ||
            String(it.productId ?? '').trim()
          const productId = String(it.productId ?? '').trim()
          const productName = String(it.productName ?? '').trim()
          const variantIdRaw = anyIt.variantId ?? anyIt.VariantId ?? null
          const variantNameRaw = anyIt.variantName ?? anyIt.VariantName ?? null
          const rowId = `row_${productId || Date.now()}_${Math.random().toString(16).slice(2)}`
          return {
            rowId,
            productId,
            productName: productName || undefined,
            variantId: variantIdRaw != null && String(variantIdRaw).trim() ? String(variantIdRaw) : null,
            variantName: variantNameRaw != null ? String(variantNameRaw) : null,
            ingredientName: ingredientName || productName || productId,
            quantity: String(anyIt.quantity ?? it.quantity ?? 1),
            unit: String(anyIt.unit ?? it.unit ?? 'kg'),
          }
        })
        const cleaned = rows.filter((x) => x.productId)
        setIngredients(cleaned)
        // preload variants for existing ingredients
        void (async () => {
          const unique = Array.from(new Set(cleaned.map((x) => x.productId)))
          const entries: Record<string, ApiProductVariant[]> = {}
          await Promise.all(
            unique.map(async (pid) => {
              try {
                entries[pid] = await getVariantsByProductId(pid, tokens.idToken)
              } catch {
                entries[pid] = []
              }
            })
          )
          setVariantsByProductId((prev) => ({ ...prev, ...entries }))
        })()
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể tải recipe'))
      .finally(() => setLoadingRecipe(false))
  }, [isAuthenticated, tokens?.idToken, isAdmin, routeId])

  const anyRowQueryKey = useMemo(() => JSON.stringify(productQuery), [productQuery])
  useEffect(() => {
    const rowId = productOpenRow
    if (!rowId) return
    const q = (productQuery[rowId] ?? '').trim()
    if (!q) {
      setProductResults((prev) => ({ ...prev, [rowId]: [] }))
      return
    }
    const seq = (productSeqRef.current[rowId] ?? 0) + 1
    productSeqRef.current[rowId] = seq
    setProductLoading((prev) => ({ ...prev, [rowId]: true }))
    const t = setTimeout(() => {
      lookupProducts(q, 20, tokens?.idToken)
        .then((res) => {
          if ((productSeqRef.current[rowId] ?? 0) !== seq) return
          setProductResults((prev) => ({ ...prev, [rowId]: res }))

          const ids = res.map((x) => x.productId).filter(Boolean)
          const missing = ids.filter((id) => !productImageById[id])
          if (missing.length > 0) {
            void (async () => {
              const next: Record<string, string> = {}
              const chunk = missing.slice(0, 8)
              await Promise.all(
                chunk.map(async (id) => {
                  try {
                    const p = await getProductById(id)
                    const img = p?.image
                    if (img) next[id] = img
                  } catch {
                    // ignore
                  }
                })
              )
              if (Object.keys(next).length > 0) {
                setProductImageById((prev) => ({ ...prev, ...next }))
              }
            })()
          }
        })
        .catch(() => {
          if ((productSeqRef.current[rowId] ?? 0) !== seq) return
          setProductResults((prev) => ({ ...prev, [rowId]: [] }))
        })
        .finally(() => {
          if ((productSeqRef.current[rowId] ?? 0) !== seq) return
          setProductLoading((prev) => ({ ...prev, [rowId]: false }))
        })
    }, 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- query object is tracked via anyRowQueryKey
  }, [anyRowQueryKey, productOpenRow])

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false
    if (!instructions.trim()) return false
    if (!Number.isFinite(cookingTimeMinutes) || cookingTimeMinutes <= 0) return false
    if (!Number.isFinite(servings) || servings <= 0) return false
    if (ingredients.length === 0) return false
    for (const it of ingredients) {
      if (!it.productId) return false
      if (!it.variantId) return false
      if (!it.ingredientName.trim()) return false
      const q = Number(it.quantity)
      if (!Number.isFinite(q) || q <= 0) return false
      if (!it.unit.trim()) return false
    }
    return true
  }, [title, instructions, cookingTimeMinutes, servings, ingredients])

  function addIngredientRow() {
    const rowId = `row_${Date.now()}_${Math.random().toString(16).slice(2)}`
    setIngredients((prev) => [
      ...prev,
      {
        rowId,
        productId: '',
        productName: '',
        variantId: null,
        variantName: null,
        ingredientName: '',
        quantity: '1',
        unit: 'kg',
      },
    ])
    setProductOpenRow(rowId)
    setProductQuery((prev) => ({ ...prev, [rowId]: '' }))
  }

  async function handleSelectProduct(rowId: string, p: ProductLookupItem) {
    setIngredients((prev) =>
      prev.map((x) =>
        x.rowId !== rowId
          ? x
          : {
              ...x,
              productId: p.productId,
              productName: p.productName,
              ingredientName: x.ingredientName.trim() ? x.ingredientName : p.productName,
              variantId: null,
              variantName: null,
            }
      )
    )
    setProductQuery((prev) => ({ ...prev, [rowId]: p.productName }))
    setProductOpenRow(null)
    try {
      const variants = await getVariantsByProductId(p.productId, tokens?.idToken)
      setVariantsByProductId((prev) => ({ ...prev, [p.productId]: variants }))
    } catch {
      setVariantsByProductId((prev) => ({ ...prev, [p.productId]: [] }))
    }
  }

  function removeIngredientRow(rowId: string) {
    setIngredients((prev) => prev.filter((x) => x.rowId !== rowId))
  }

  async function handleSubmit() {
    if (!tokens?.idToken) return
    if (!canSubmit || saving || uploadingImage) return
    const rid = getRecipeId(recipe) || String(routeId ?? '').trim()
    if (!rid) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await updateRecipe(
        rid,
        {
          title: title.trim(),
          description: description.trim() ? description.trim() : undefined,
          instructions: instructions.trim(),
          imageUrl,
          cookingTimeMinutes,
          servings,
          ingredients: ingredients.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            ingredientName: it.ingredientName.trim(),
            quantity: Number(it.quantity),
            unit: normalizeUnit(it.unit),
          })),
        },
        tokens.idToken
      )
      setSuccess('Cập nhật công thức thành công.')
      setTimeout(() => router.push('/admin/recipes'), 500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật recipe')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Cập nhật công thức</h1>
        <p className="text-sm text-gray-600 mb-4">
          Vui lòng đăng nhập để cập nhật công thức.
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
        <h1 className="text-xl font-bold text-gray-900 mb-2">Cập nhật công thức</h1>
        <p className="text-sm text-red-700">Không có quyền cập nhật công thức.</p>
      </div>
    )
  }

  if (loadingRecipe) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-center py-10 text-gray-500">Đang tải công thức...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-center py-10 text-red-600">
          {error ?? 'Không tìm thấy công thức.'}
        </p>
        <Link
          href="/admin/recipes"
          className="inline-flex items-center gap-2 text-primary-green hover:underline"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </Link>
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
          <h1 className="text-3xl font-bold text-gray-900">Cập nhật công thức</h1>
          <p className="text-gray-600 mt-1">
            Chỉnh sửa thông tin và nguyên liệu của công thức.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || saving || uploadingImage}
          className="bg-primary-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
      {uploadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {uploadError}
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ảnh công thức
                </label>

                {imageUrl ? (
                  <div className="flex items-start gap-4">
                    <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <Image
                        src={imageUrl}
                        alt="Recipe image"
                        fill
                        className="object-cover"
                        sizes="160px"
                        unoptimized={imageUrl.startsWith('http')}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 break-all">{imageUrl}</div>
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        disabled={uploadingImage}
                        className="mt-2 inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const inputEl = e.currentTarget
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploadError(null)
                        setUploadingImage(true)
                        try {
                          const url = await uploadImageToCloudinary(file)
                          setImageUrl(url)
                        } catch (err) {
                          setUploadError(
                            err instanceof Error
                              ? err.message
                              : 'Không thể upload ảnh lên Cloudinary'
                          )
                        } finally {
                          setUploadingImage(false)
                          inputEl.value = ''
                        }
                      }}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-green file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-green-dark disabled:opacity-60"
                    />
                    {uploadingImage && (
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        Đang upload...
                      </span>
                    )}
                  </div>
                )}
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
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nguyên liệu</h2>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Mỗi nguyên liệu cần chọn sản phẩm và biến thể (variant).
              </p>
              <button
                type="button"
                onClick={addIngredientRow}
                className="inline-flex items-center justify-center rounded-lg bg-primary-green px-4 py-2 text-sm font-semibold text-white hover:bg-primary-green-dark"
              >
                <Plus size={16} />
                Thêm nguyên liệu
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {ingredients.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có nguyên liệu.</p>
              ) : (
                ingredients.map((it) => (
                  <div
                    key={it.rowId}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="relative">
                            <Search
                              size={18}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                              value={productQuery[it.rowId] ?? it.productName ?? ''}
                              onChange={(e) => {
                                const v = e.target.value
                                setProductQuery((prev) => ({ ...prev, [it.rowId]: v }))
                                setProductOpenRow(it.rowId)
                              }}
                              onFocus={() => setProductOpenRow(it.rowId)}
                              placeholder="Tìm sản phẩm..."
                              className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                            />
                            {productOpenRow === it.rowId && (
                              <div className="absolute left-0 right-0 mt-2 z-50 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                                <div className="max-h-72 overflow-y-auto">
                                  {productLoading[it.rowId] ? (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                      Đang tìm...
                                    </div>
                                  ) : (productResults[it.rowId] ?? []).length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500">
                                      Không tìm thấy sản phẩm
                                    </div>
                                  ) : (
                                    (productResults[it.rowId] ?? []).map((p) => (
                                      <button
                                        key={p.productId}
                                        type="button"
                                        onClick={() => void handleSelectProduct(it.rowId, p)}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="relative h-9 w-9 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                                            {productImageById[p.productId] ? (
                                              <Image
                                                src={productImageById[p.productId]}
                                                alt={p.productName}
                                                fill
                                                className="object-cover"
                                                sizes="36px"
                                                unoptimized={productImageById[p.productId].startsWith('http')}
                                              />
                                            ) : null}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                              {p.productName}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setProductOpenRow(null)}
                                  className="w-full border-t border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                  Đóng
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Variant <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={it.variantId ?? ''}
                                disabled={!it.productId}
                                onChange={(e) => {
                                  const vid = e.target.value || null
                                  const variants = it.productId
                                    ? variantsByProductId[it.productId] ?? []
                                    : []
                                  const vn =
                                    vid && variants.length
                                      ? variants.find((v) => String(v.variantId) === String(vid))?.variantName ?? null
                                      : null
                                  setIngredients((prev) =>
                                    prev.map((x) =>
                                      x.rowId === it.rowId
                                        ? { ...x, variantId: vid, variantName: vn }
                                        : x
                                    )
                                  )
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-green disabled:bg-gray-50 disabled:text-gray-500"
                              >
                                <option value="">
                                  {it.productId ? 'Chọn variant' : 'Chọn sản phẩm trước'}
                                </option>
                                {(it.productId ? (variantsByProductId[it.productId] ?? []) : []).map((v) => (
                                  <option key={String(v.variantId)} value={String(v.variantId)}>
                                    {v.variantName} (tồn: {Number(v.stockQuantity ?? 0) || 0})
                                  </option>
                                ))}
                              </select>
                              {it.productId && !it.variantId && (
                                <p className="mt-1 text-xs text-amber-700">
                                  Recipe cũ chưa có variant. Vui lòng chọn variant.
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Tên nguyên liệu
                              </label>
                              <input
                                value={it.ingredientName}
                                onChange={(e) =>
                                  setIngredients((prev) =>
                                    prev.map((x) =>
                                      x.rowId === it.rowId
                                        ? { ...x, ingredientName: e.target.value }
                                        : x
                                    )
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                                placeholder="Ví dụ: Sữa chua"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(it.rowId)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Xóa"
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
                          value={it.quantity}
                          onChange={(e) =>
                            setIngredients((prev) =>
                              prev.map((x) =>
                                x.rowId === it.rowId
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
                                x.rowId === it.rowId
                                  ? { ...x, unit: e.target.value }
                                  : x
                              )
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-green"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

