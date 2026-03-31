'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { useCart } from '@/contexts/CartContext'
import {
  getMealComboSuggestions,
  type DietType,
} from '@/lib/api/mealCombos'
import { getProductById } from '@/lib/api/products'
import type { MealComboDto } from '@/lib/types/api'
import { formatCurrency } from '@/lib/utils'
import SuccessPopup from '@/components/common/SuccessPopup'

const PEOPLE_MIN = 1
const PEOPLE_MAX = 20
const DAYS_MIN = 1
const DAYS_MAX = 30

const PEOPLE_PRESETS = [1, 2, 4, 6, 8] as const
const DAYS_PRESETS = [3, 5, 7, 14] as const
const DIET_OPTIONS: Array<{ value: DietType; label: string; desc: string }> = [
  { value: '', label: 'Tất cả', desc: 'Không giới hạn chế độ ăn' },
  // IMPORTANT: send the exact user-selected text to BE.
  { value: 'Gia đình', label: 'Gia đình', desc: 'Phù hợp bữa cơm gia đình' },
  { value: 'Healthy', label: 'Healthy', desc: 'Ăn lành mạnh, cân bằng' },
  { value: 'Eat Clean', label: 'Eat Clean', desc: 'Ít chế biến, ưu tiên tươi sạch' },
  { value: 'Ăn chay', label: 'Ăn chay', desc: 'Ưu tiên rau củ, hạn chế thịt cá' },
  { value: 'Low Carb', label: 'Low Carb', desc: 'Giảm tinh bột, ưu tiên đạm và rau' },
  { value: 'Keto', label: 'Keto', desc: 'Rất ít carb, ưu tiên chất béo tốt' },
  { value: 'Giàu đạm', label: 'Giàu đạm', desc: 'Ưu tiên thực phẩm giàu protein' },
  { value: 'Tiểu đường', label: 'Tiểu đường', desc: 'Ưu tiên thực phẩm phù hợp kiểm soát đường huyết' },
  { value: 'Giảm cân', label: 'Giảm cân', desc: 'Giảm năng lượng, ưu tiên rau củ và protein nạc' },
]

export default function MealCombosPage() {
  const { tokens, isAuthenticated } = useUser()
  const { addMealCombo, loading: cartLoading } = useCart()
  const router = useRouter()

  const [peopleCount, setPeopleCount] = useState<number>(4)
  const [days, setDays] = useState<number>(7)
  const [dietType, setDietType] = useState<DietType>('Gia đình')

  const [items, setItems] = useState<MealComboDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingComboId, setAddingComboId] = useState<string | null>(null)
  const [productImageById, setProductImageById] = useState<Record<string, string>>(
    {}
  )
  const imageLoadSeqRef = useRef(0)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  function showToast(message: string) {
    setToastMessage(message)
    setToastOpen(true)
  }

  function clampInt(v: number, min: number, max: number): number {
    if (!Number.isFinite(v)) return min
    const n = Math.trunc(v)
    return Math.min(max, Math.max(min, n))
  }

  function setPeopleCountSafe(next: number) {
    const clamped = clampInt(next, PEOPLE_MIN, PEOPLE_MAX)
    if (clamped !== next) {
      showToast(`Số người hợp lệ: ${PEOPLE_MIN}–${PEOPLE_MAX}.`)
    }
    setPeopleCount(clamped)
  }

  function setDaysSafe(next: number) {
    const clamped = clampInt(next, DAYS_MIN, DAYS_MAX)
    if (clamped !== next) {
      showToast(`Số ngày hợp lệ: ${DAYS_MIN}–${DAYS_MAX}.`)
    }
    setDays(clamped)
  }

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
    if (!tokens?.idToken) {
      router.push('/login?from=/meal-combos')
      return
    }
    if (!Number.isFinite(peopleCount) || peopleCount < PEOPLE_MIN || peopleCount > PEOPLE_MAX) {
      setPeopleCountSafe(peopleCount)
      return
    }
    if (!Number.isFinite(days) || days < DAYS_MIN || days > DAYS_MAX) {
      setDaysSafe(days)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await getMealComboSuggestions(
        { peopleCount, days, dietType },
        tokens.idToken
      )
      const valid = (res ?? []).filter((c) => Array.isArray(c.items) && c.items.length > 0)
      if (!valid.length) {
        setItems([])
        showToast('Chưa đủ sản phẩm còn hàng để tạo combo.')
      } else {
        setItems(valid)
      }
    } catch (e) {
      setItems([])
      setError(e instanceof Error ? e.message : 'Không thể lấy gợi ý combo')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCombo = async (comboId: string, retry = false) => {
    if (!comboId || addingComboId) return
    if (!tokens?.idToken) {
      router.push('/login?from=/meal-combos')
      return
    }
    setAddingComboId(comboId)
    setError(null)
    try {
      await addMealCombo(comboId, 1)
      showToast('Đã thêm combo vào giỏ hàng.')
    } catch (e) {
      const err = e as Error & { status?: number }
      if (err.status === 401) {
        router.push('/login?from=/meal-combos')
      } else if (err.status === 404 && !retry) {
        // Combo đã hết hiệu lực, thử tạo combo mới và add lại một lần.
        showToast('Combo đã hết hiệu lực, đang tạo combo mới...')
        try {
          await handleSuggest()
          const first = (items ?? [])[0]
          if (first?.mealComboId && first.mealComboId !== comboId) {
            await handleAddCombo(first.mealComboId, true)
          } else {
            showToast('Chưa đủ sản phẩm còn hàng để tạo combo.')
          }
        } catch {
          setError('Không thể tạo combo mới, vui lòng thử lại sau.')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Không thể thêm combo vào giỏ')
      }
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
              Tự tạo giỏ nông sản theo nhu cầu
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
        <SuccessPopup
          message={toastMessage}
          isOpen={toastOpen}
          onClose={() => setToastOpen(false)}
        />
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Tự tạo giỏ nông sản theo nhu cầu
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
              <div className="flex flex-wrap gap-2">
                {PEOPLE_PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPeopleCountSafe(v)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      peopleCount === v
                        ? 'bg-primary-green text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {v} người
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Tùy chỉnh
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPeopleCountSafe(peopleCount - 1)}
                    className="h-9 w-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    aria-label="Giảm số người"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={PEOPLE_MIN}
                    max={PEOPLE_MAX}
                    step={1}
                    value={peopleCount}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw.trim() === '') return
                      const n = Number(raw)
                      if (!Number.isFinite(n)) return
                      setPeopleCountSafe(n)
                    }}
                    onBlur={() => setPeopleCountSafe(peopleCount)}
                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                  />
                  <button
                    type="button"
                    onClick={() => setPeopleCountSafe(peopleCount + 1)}
                    className="h-9 w-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    aria-label="Tăng số người"
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Hợp lệ: {PEOPLE_MIN}–{PEOPLE_MAX} người
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Số ngày sử dụng
              </p>
              <div className="flex flex-wrap gap-2">
                {DAYS_PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDaysSafe(v)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      days === v
                        ? 'bg-primary-green text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {v} ngày
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Tùy chỉnh
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDaysSafe(days - 1)}
                    className="h-9 w-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    aria-label="Giảm số ngày"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={DAYS_MIN}
                    max={DAYS_MAX}
                    step={1}
                    value={days}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw.trim() === '') return
                      const n = Number(raw)
                      if (!Number.isFinite(n)) return
                      setDaysSafe(n)
                    }}
                    onBlur={() => setDaysSafe(days)}
                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                  />
                  <button
                    type="button"
                    onClick={() => setDaysSafe(days + 1)}
                    className="h-9 w-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    aria-label="Tăng số ngày"
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Hợp lệ: {DAYS_MIN}–{DAYS_MAX} ngày
                </p>
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
                  {(() => {
                    const computedTotal = (c.items ?? []).reduce((s, it) => {
                      const v = Number((it as any).lineTotal ?? 0)
                      return s + (Number.isFinite(v) ? v : 0)
                    }, 0)

                    const totalToShow = computedTotal > 0 ? computedTotal : c.basePrice
                    const totalLabel = 'Tổng'
                    return (
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
                      <p className="text-sm text-gray-500">{totalLabel}</p>
                      <p className="font-bold text-primary-green">
                        {formatCurrency(totalToShow)}
                      </p>
                    </div>
                  </div>
                    )
                  })()}

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Danh sách gợi ý ({c.items?.length ?? 0})
                    </p>
                    <div className="max-h-[420px] overflow-auto overscroll-contain pr-1">
                      <div className="divide-y divide-gray-100">
                      {(c.items ?? []).map((it) => (
                        <div
                          key={`${c.mealComboId}-${it.productId}-${(it as any).variantId ?? ''}`}
                          className="py-2 text-sm"
                        >
                          {(() => {
                            const unitPrice = Number((it as any).unitPrice ?? 0)
                            const lineTotal = Number((it as any).lineTotal ?? 0)
                            const variantName = String((it as any).variantName ?? '').trim()
                            const qty = Number(it.quantity ?? 0)

                            return (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {it.productId && productImageById[it.productId] ? (
                                    <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                                      <Image
                                        src={productImageById[it.productId]}
                                        alt={it.productName}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                        unoptimized={productImageById[it.productId].startsWith('http')}
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-100 border border-gray-100" />
                                  )}
                                  <div className="min-w-0">
                                    <div className="text-gray-800 line-clamp-1">
                                      {it.productName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      x{qty}
                                      {variantName ? (
                                        <span className="ml-2">• {variantName}</span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs text-gray-500">
                                    {formatCurrency(unitPrice)}
                                  </div>
                                  <div className="font-semibold text-gray-900">
                                    {formatCurrency(lineTotal)}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      ))}
                      </div>
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

