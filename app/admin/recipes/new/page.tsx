'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search, Trash2 } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { createRecipe } from '@/lib/api/recipes'
import { uploadImageToCloudinary } from '@/lib/api/cloudinary'
import {
  getVariantsByProductId,
  getProductById,
  lookupProducts,
  type ProductLookupItem,
} from '@/lib/api/products'
import type { ApiProductVariant } from '@/lib/types/api'

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

export default function AdminRecipeCreatePage() {
  const router = useRouter()
  const { user, tokens, isAuthenticated } = useUser()

  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin'

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

          // hydrate images for dropdown rows
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
  }, [anyRowQueryKey, productOpenRow, tokens?.idToken])

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
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await createRecipe(
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
          disabled={!canSubmit || saving || uploadingImage}
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

            {ingredients.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center">
                Chưa có nguyên liệu. Hãy tìm sản phẩm để thêm.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {!canSubmit && ingredients.some((x) => x.productId && !x.variantId) ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Một số nguyên liệu đã chọn sản phẩm nhưng chưa chọn variant. Vui lòng chọn
                    variant trước khi lưu.
                  </div>
                ) : null}
                {ingredients.map((it) => (
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
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
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
                                            <div className="font-semibold text-gray-900 line-clamp-1">
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
                                  Vui lòng chọn variant cho sản phẩm này.
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

