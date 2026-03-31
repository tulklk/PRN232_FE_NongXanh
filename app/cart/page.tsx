'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import QuantitySelector from '@/components/common/QuantitySelector'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/contexts/CartContext'
import { useUser } from '@/contexts/UserContext'
import { getMealComboById } from '@/lib/api/mealCombos'
import type { MealComboDto } from '@/lib/types/api'

export default function CartPage() {
  const { isAuthenticated, tokens } = useUser()
  const {
    cart,
    loading,
    error,
    refreshCart,
    updateItem,
    removeItem,
  } = useCart()

  const [expandedComboIds, setExpandedComboIds] = useState<Set<string>>(
    () => new Set()
  )
  const [comboById, setComboById] = useState<Record<string, MealComboDto | null>>(
    {}
  )
  const [comboLoadingById, setComboLoadingById] = useState<Record<string, boolean>>(
    {}
  )

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart()
    }
  }, [isAuthenticated, refreshCart])

  const items = useMemo(() => cart?.cartItems ?? [], [cart?.cartItems])
  const totalAmount = cart?.totalAmount ?? 0

  const comboIdsInCart = useMemo(() => {
    const ids = new Set<string>()
    for (const it of items) {
      if (it.mealComboId) ids.add(String(it.mealComboId))
    }
    return Array.from(ids)
  }, [items])

  // Prefetch combo details for any combo items in cart (best-effort).
  useEffect(() => {
    if (!isAuthenticated) return
    if (comboIdsInCart.length === 0) return

    comboIdsInCart.forEach((id) => {
      if (comboById[id] !== undefined) return
      if (comboLoadingById[id]) return

      setComboLoadingById((prev) => ({ ...prev, [id]: true }))
      getMealComboById(id, tokens?.idToken)
        .then((combo) => {
          setComboById((prev) => ({ ...prev, [id]: combo }))
        })
        .catch(() => {
          setComboById((prev) => ({ ...prev, [id]: null }))
        })
        .finally(() => {
          setComboLoadingById((prev) => ({ ...prev, [id]: false }))
        })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboIdsInCart.join('|'), isAuthenticated, tokens?.idToken])

  const toggleCombo = useCallback(
    (id: string) => {
      const key = String(id ?? '').trim()
      if (!key) return
      setExpandedComboIds((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    []
  )

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
          >
            <ArrowLeft size={20} />
            TIẾP TỤC MUA SẮM
          </Link>
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">
              Đăng nhập để xem giỏ hàng của bạn
            </p>
            <Link
              href="/login"
              className="inline-block bg-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-green-dark"
            >
              ĐĂNG NHẬP
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          TIẾP TỤC MUA SẮM
        </Link>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-lg p-4 sm:p-6">
            <h2 className="font-semibold mb-6">
              Giỏ hàng ({items.length} sản phẩm)
            </h2>

            {loading && items.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Đang tải giỏ hàng...
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Giỏ hàng trống
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const isCombo = !!item.mealComboId
                  const comboId = isCombo ? String(item.mealComboId ?? '') : ''
                  const isExpanded = isCombo && expandedComboIds.has(comboId)
                  const combo = isCombo ? comboById[comboId] : null
                  const comboLoading = isCombo ? comboLoadingById[comboId] : false
                  const displayName = isCombo
                    ? item.mealComboName || 'Combo'
                    : [item.productName, item.variantName].filter(Boolean).join(' - ') ||
                      'Sản phẩm'
                  const href = isCombo
                    ? `/meal-combos/${encodeURIComponent(String(item.mealComboId))}`
                    : item.variantId != null
                      ? `/products?variantId=${encodeURIComponent(String(item.variantId))}`
                      : '/products'
                  const imageSrc = item.imageUrl?.startsWith('http')
                    ? item.imageUrl
                    : '/images/logo.png'
                  return (
                  <div
                    key={item.cartItemId}
                    className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <Link
                      href={href}
                      className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden"
                    >
                      <Image
                        src={imageSrc}
                        alt={displayName}
                        fill
                        className="object-cover rounded-lg"
                        sizes="80px"
                        unoptimized={imageSrc.startsWith('http')}
                      />
                    </Link>
                    <div className="flex-1 w-full">
                      {isCombo ? (
                        <button
                          type="button"
                          onClick={() => toggleCombo(comboId)}
                          className="text-left font-semibold text-gray-900 mb-1 text-sm sm:text-base hover:underline inline-flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <ChevronDown size={18} className="text-gray-500" />
                          ) : (
                            <ChevronRight size={18} className="text-gray-500" />
                          )}
                          <span className="min-w-0 line-clamp-2">{displayName}</span>
                        </button>
                      ) : (
                        <Link
                          href={href}
                          className="font-semibold text-gray-900 mb-1 text-sm sm:text-base hover:underline inline-block"
                        >
                          {displayName}
                        </Link>
                      )}

                      {isCombo && isExpanded && (
                        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold text-gray-700">
                              Danh sách sản phẩm trong combo
                            </p>
                            <Link
                              href={href}
                              className="text-xs text-primary-green hover:underline"
                            >
                              Xem chi tiết
                            </Link>
                          </div>

                          {comboLoading ? (
                            <div className="flex items-center gap-2 text-xs text-gray-600 py-2">
                              <Loader2 className="animate-spin" size={14} />
                              Đang tải...
                            </div>
                          ) : combo && Array.isArray(combo.items) && combo.items.length > 0 ? (
                            <div className="max-h-[220px] overflow-auto pr-1 overscroll-contain">
                              <ul className="space-y-2">
                                {combo.items.map((it) => (
                                  <li
                                    key={`${combo.mealComboId}-${it.productId}`}
                                    className="flex items-start justify-between gap-3"
                                  >
                                    <span className="text-xs text-gray-800 min-w-0 line-clamp-2">
                                      {it.productName}
                                    </span>
                                    <span className="text-xs text-gray-600 whitespace-nowrap">
                                      {it.quantity} {it.unit ?? ''}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-600">
                              Không tải được chi tiết combo.
                            </p>
                          )}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-lg font-bold text-primary-green">
                          {formatCurrency(item.priceAtTime)}
                        </span>
                        <div className="flex items-center gap-3">
                          <QuantitySelector
                            defaultValue={item.quantity}
                            onChange={(qty) => updateItem(item.cartItemId, qty)}
                          />
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              try {
                                await removeItem(item.cartItemId)
                              } catch {
                                // Lỗi đã được xử lý trong CartContext (setError + rollback).
                              }
                            }}
                            disabled={loading}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Tạm tính: {formatCurrency(item.subTotal)}
                      </p>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-4 sm:p-6 lg:sticky lg:top-4">
              <h2 className="text-lg font-bold mb-4">Thông tin đơn hàng</h2>

              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">Sản phẩm ({items.length})</p>
                </div>

                {items.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">Chưa có sản phẩm nào.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {items.map((item) => {
                      const displayName = item.mealComboId
                        ? item.mealComboName || 'Combo'
                        : [item.productName, item.variantName]
                            .filter(Boolean)
                            .join(' - ') || 'Sản phẩm'
                      return (
                        <div key={item.cartItemId} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(item.subTotal)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-b border-gray-200 py-4 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-semibold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-semibold">
                    Tính tại bước thanh toán
                  </span>
                </div>
              </div>

              {totalAmount === 0 && items.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm font-semibold">
                    QUÝ KHÁCH VUI LÒNG KIỂM TRA LẠI ĐƠN HÀNG.
                  </p>
                </div>
              )}

              <div className="flex justify-between mb-4">
                <span className="text-lg font-bold">Tổng Cộng:</span>
                <span className="text-lg font-bold text-primary-green">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <Link
                href={totalAmount > 0 ? '/checkout' : '#'}
                className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                  totalAmount === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-green text-white hover:bg-primary-green-dark'
                }`}
              >
                XÁC NHẬN ĐẶT HÀNG
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
