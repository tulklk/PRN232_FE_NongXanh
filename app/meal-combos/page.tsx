'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@/contexts/UserContext'
import { useCart } from '@/contexts/CartContext'
import {
  getMealComboSuggestions,
  type DietType,
} from '@/lib/api/mealCombos'
import { getProductById } from '@/lib/api/products'
import type { MealComboSuggestion } from '@/lib/types/api'
import { formatCurrency } from '@/lib/utils'

const PEOPLE_OPTIONS = [2, 4, 6] as const
const DAYS_OPTIONS = [3, 7] as const
const DIET_OPTIONS: Array<{ value: DietType; label: string; desc: string }> = [
  { value: 'Healthy', label: 'Healthy', desc: 'Ăn lành mạnh, cân bằng' },
  { value: 'EatClean', label: 'Eat Clean', desc: 'Ít chế biến, ưu tiên tươi sạch' },
  { value: 'GiaDinh', label: 'Gia đình', desc: 'Phù hợp bữa cơm gia đình' },
]

export default function MealCombosPage() {
  const { tokens, isAuthenticated } = useUser()
  const { addMealCombo, loading: cartLoading } = useCart()

  const [peopleCount, setPeopleCount] = useState<(typeof PEOPLE_OPTIONS)[number]>(4)
  const [days, setDays] = useState<(typeof DAYS_OPTIONS)[number]>(7)
  const [dietType, setDietType] = useState<DietType>('GiaDinh')

  const [items, setItems] = useState<MealComboSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingComboId, setAddingComboId] = useState<string | null>(null)
  const [productImageById, setProductImageById] = useState<Record<string, string>>(
    {}
  )
  const imageLoadSeqRef = useRef(0)

  const selectedDiet = useMemo(
    () => DIET_OPTIONS.find((d) => d.value === dietType) ?? DIET_OPTIONS[0],
    [dietType]
  )

  useEffect(() => {
    if (!items.length) return
    const nextSeq = ++imageLoadSeqRef.current

    const ids = new Set<string>()
    for (const combo of items) {
      for (const it of combo.items ?? []) {
        if (it.productId) ids.add(it.productId)
      }
    }
    const missing = Array.from(ids).filter((id) => !productImageById[id])
    if (missing.length === 0) return

    const CONCURRENCY = 8
    let cancelled = false

    async function run() {
      const acc: Record<string, string> = {}
      for (let i = 0; i < missing.length; i += CONCURRENCY) {
        const chunk = missing.slice(i, i + CONCURRENCY)
        const results = await Promise.all(
          chunk.map(async (id) => {
            try {
              const p = await getProductById(id)
              const img = p?.image || ''
              return { id, img }
            } catch {
              return { id, img: '' }
            }
          })
        )
        for (const r of results) {
          if (r.img) acc[r.id] = r.img
        }
      }
      if (cancelled) return
      if (imageLoadSeqRef.current !== nextSeq) return
      if (Object.keys(acc).length === 0) return
      setProductImageById((prev) => ({ ...prev, ...acc }))
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const handleSuggest = async () => {
    if (!tokens?.idToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await getMealComboSuggestions(
        { peopleCount, days, dietType },
        tokens.idToken
      )
      setItems(res)
    } catch (e) {
      setItems([])
      setError(e instanceof Error ? e.message : 'Không thể lấy gợi ý combo')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCombo = async (comboId: string) => {
    if (!comboId || addingComboId) return
    setAddingComboId(comboId)
    setError(null)
    try {
      await addMealCombo(comboId, 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể thêm combo vào giỏ')
    } finally {
      setAddingComboId(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Tự build giỏ rau theo tuần
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              Vui lòng đăng nhập để nhận gợi ý combo theo nhu cầu của bạn.
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Tự build giỏ rau theo tuần
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Chọn số người, số ngày và chế độ ăn để nhận gợi ý tự động.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSuggest}
              disabled={loading || !tokens?.idToken}
              className="inline-flex items-center justify-center rounded-lg bg-primary-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gợi ý...' : 'Gợi ý combo'}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Số người ăn
              </p>
              <div className="flex gap-2">
                {PEOPLE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPeopleCount(v)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      peopleCount === v
                        ? 'bg-primary-green text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {v} người
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Số ngày sử dụng
              </p>
              <div className="flex gap-2">
                {DAYS_OPTIONS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDays(v)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      days === v
                        ? 'bg-primary-green text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {v} ngày
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Chế độ ăn
              </p>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value as DietType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              >
                {DIET_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">{selectedDiet.desc}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Gợi ý cho bạn
            </h2>
            <span className="text-sm text-gray-500">
              {items.length} combo
            </span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Đang tải gợi ý...
            </p>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-sm">
                Chưa có gợi ý. Hãy chọn tuỳ chọn và bấm{' '}
                <span className="font-semibold text-gray-700">Gợi ý combo</span>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {items.map((c) => (
                <div
                  key={c.mealComboId}
                  className="rounded-lg border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 line-clamp-2">
                        {c.name}
                      </p>
                      {c.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Base</p>
                      <p className="font-bold text-primary-green">
                        {formatCurrency(c.basePrice)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Danh sách gợi ý ({c.items?.length ?? 0})
                    </p>
                    <div className="divide-y divide-gray-100">
                      {(c.items ?? []).slice(0, 6).map((it) => (
                        <div
                          key={`${c.mealComboId}-${it.productId}`}
                          className="flex items-center justify-between py-2 text-sm gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {it.productId && productImageById[it.productId] ? (
                              <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                                <Image
                                  src={productImageById[it.productId]}
                                  alt={it.productName}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-100 border border-gray-100" />
                            )}
                            <span className="text-gray-800 line-clamp-1">
                              {it.productName}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      ))}
                      {(c.items ?? []).length > 6 && (
                        <p className="pt-2 text-xs text-gray-500">
                          ... và {(c.items ?? []).length - 6} sản phẩm khác
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleAddCombo(c.mealComboId)}
                      disabled={cartLoading || addingComboId === c.mealComboId}
                      className="rounded-lg bg-primary-green px-4 py-2 text-sm font-semibold text-white hover:bg-primary-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingComboId === c.mealComboId ? 'Đang thêm...' : 'Thêm combo vào giỏ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

