'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, ChevronRight, Loader2, Minus, Plus, X } from 'lucide-react'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { ApiCartItem } from '@/lib/types/api'
import { useUser } from '@/contexts/UserContext'
import { getMealComboById } from '@/lib/api/mealCombos'
import type { MealComboDto } from '@/lib/types/api'

interface CartPopupProps {
  items: ApiCartItem[]
  totalAmount: number
  loading?: boolean
  onUpdateQuantity: (cartItemId: number | string, quantity: number) => void
  onRemoveItem: (cartItemId: number | string) => void
  onClose: () => void
}

function getDisplayName(item: ApiCartItem): string {
  if (item.mealComboId) return item.mealComboName || 'Combo'
  const p = item.productName || ''
  const v = item.variantName || ''
  if (p && v) return `${p} - ${v}`
  return p || v || 'Sản phẩm'
}

function getImageSrc(item: ApiCartItem): string {
  return item.imageUrl && item.imageUrl.startsWith('http') ? item.imageUrl : '/images/logo.png'
}

function getCartItemKey(item: ApiCartItem): string {
  return String(item.cartItemId)
}

export default function CartPopup({
  items,
  totalAmount,
  loading,
  onUpdateQuantity,
  onRemoveItem,
  onClose,
}: CartPopupProps) {
  const { tokens } = useUser()
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(items.map((i) => [getCartItemKey(i), i.quantity]))
  )
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
    setLocalQuantities(Object.fromEntries(items.map((i) => [getCartItemKey(i), i.quantity])))
  }, [items])

  const comboIdsInCart = useMemo(() => {
    const ids = new Set<string>()
    for (const it of items) {
      if (it.mealComboId) ids.add(String(it.mealComboId))
    }
    return Array.from(ids)
  }, [items])

  useEffect(() => {
    if (comboIdsInCart.length === 0) return
    comboIdsInCart.forEach((id) => {
      if (!id) return
      if (comboById[id] !== undefined) return
      if (comboLoadingById[id]) return

      setComboLoadingById((prev) => ({ ...prev, [id]: true }))
      getMealComboById(id, tokens?.idToken)
        .then((combo) => setComboById((prev) => ({ ...prev, [id]: combo })))
        .catch(() => setComboById((prev) => ({ ...prev, [id]: null })))
        .finally(() => setComboLoadingById((prev) => ({ ...prev, [id]: false })))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comboIdsInCart.join('|'), tokens?.idToken])

  const toggleCombo = useCallback((id: string) => {
    const key = String(id ?? '').trim()
    if (!key) return
    setExpandedComboIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleQtyChange = (cartItemId: number | string, delta: number) => {
    const cartItemKey = String(cartItemId)
    const current = localQuantities[cartItemKey] ?? 1
    const next = Math.max(1, Math.min(999, current + delta))
    setLocalQuantities((prev) => ({ ...prev, [cartItemKey]: next }))
    onUpdateQuantity(cartItemId, next)
  }

  const displayTotal =
    items.reduce(
      (sum, i) => sum + i.priceAtTime * (localQuantities[getCartItemKey(i)] ?? i.quantity),
      0
    )

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-900">Giỏ hàng của bạn</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {items.length} sản phẩm
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-h-72">
        {loading ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            Đang tải...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            Giỏ hàng trống
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const cartItemId = item.cartItemId
              const cartItemKey = String(cartItemId)
              const isCombo = !!item.mealComboId
              const comboId = isCombo ? String(item.mealComboId ?? '') : ''
              const expanded = isCombo && expandedComboIds.has(comboId)
              const combo = isCombo ? comboById[comboId] : null
              const comboLoading = isCombo ? comboLoadingById[comboId] : false
              return (
              <div
                key={item.cartItemId}
                className="flex gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <div className="relative w-14 h-14 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  <Image
                    src={getImageSrc(item)}
                    alt={getDisplayName(item)}
                    fill
                    className="object-cover rounded"
                    sizes="56px"
                    unoptimized={getImageSrc(item).startsWith('http')}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    {isCombo ? (
                      <button
                        type="button"
                        onClick={() => toggleCombo(comboId)}
                        className="text-sm font-medium text-gray-900 truncate inline-flex items-center gap-1 hover:underline text-left min-w-0"
                      >
                        {expanded ? (
                          <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{getDisplayName(item)}</span>
                      </button>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getDisplayName(item)}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(cartItemId)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Xóa"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {isCombo && expanded && (
                    <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                      {comboLoading ? (
                        <div className="flex items-center gap-2 text-xs text-gray-600 py-1">
                          <Loader2 className="animate-spin" size={12} />
                          Đang tải...
                        </div>
                      ) : combo && Array.isArray(combo.items) && combo.items.length > 0 ? (
                        <div className="max-h-40 overflow-auto overscroll-contain pr-1">
                          <ul className="space-y-1.5">
                            {combo.items.map((it) => (
                              <li
                                key={`${combo.mealComboId}-${it.productId}`}
                                className="flex items-start justify-between gap-2"
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

                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center border border-gray-300 rounded text-sm bg-white">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(cartItemId, -1)}
                        disabled={(localQuantities[cartItemKey] ?? item.quantity) <= 1}
                        className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-3 py-1 min-w-[2rem] text-center font-medium text-gray-900 bg-gray-50 border-x border-gray-200">
                        {localQuantities[cartItemKey] ?? item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(cartItemId, 1)}
                        className="p-1.5 hover:bg-gray-100 text-gray-700"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#0A923C]">
                      {formatCurrency(item.priceAtTime * (localQuantities[cartItemKey] ?? item.quantity))}
                    </span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-gray-900">Tổng cộng:</span>
          <span className="text-lg font-bold text-[#0A923C]">
            {formatCurrency(displayTotal)}
          </span>
        </div>
        <div className="space-y-2">
          <Link
            href="/checkout"
            onClick={onClose}
            className={`block w-full py-2.5 rounded-lg font-semibold text-center transition-colors ${
              items.length === 0 || displayTotal <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
                : 'bg-[#0A923C] text-white hover:bg-[#087a32]'
            }`}
          >
            Thanh toán
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
