'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { getMySubscriptions } from '@/lib/api/subscriptions'
import type { SubscriptionModel } from '@/lib/types/api'
import { formatDate } from '@/lib/utils'

function getSubId(s: SubscriptionModel): string {
  return String(s.subscriptionId ?? s.id ?? '')
}

export default function SubscriptionsPage() {
  const { tokens, isAuthenticated } = useUser()
  const [items, setItems] = useState<SubscriptionModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getMySubscriptions(tokens.idToken)
      .then(setItems)
      .catch((e) => {
        setItems([])
        setError(e instanceof Error ? e.message : 'Không thể tải subscriptions')
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, tokens?.idToken])

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-gray-600">Vui lòng đăng nhập để xem Subscription.</p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary-green px-4 py-2 text-sm font-semibold text-white hover:bg-primary-green-dark"
        >
          Đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Giao hàng định kỳ
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý các gói giao hàng định kỳ của bạn.
          </p>
        </div>
        <Link
          href="/checkout"
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          Tạo mới
        </Link>
      </div>

      {loading && (
        <p className="text-center py-12 text-sm text-gray-500">Đang tải...</p>
      )}

      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
          <div className="mt-2 text-xs text-amber-700">
            Nếu backend chưa hỗ trợ API lấy danh sách Subscription, trang này sẽ tạm thời hiển thị trống.
          </div>
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="flex items-center justify-center py-14">
          <p className="text-base text-gray-500">Bạn chưa có subscription nào!</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((s) => (
            <div
              key={getSubId(s) || JSON.stringify(s)}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    Subscription #{getSubId(s) || '—'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Tần suất: {String(s.frequency ?? '—')} • Chính sách giá:{' '}
                    {String(s.pricingPolicy ?? '—')}
                  </p>
                  {s.shippingAddress && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      Địa chỉ: {s.shippingAddress}
                    </p>
                  )}
                </div>
                <div className="text-sm text-gray-500 text-right">
                  {s.nextDeliveryAt && (
                    <div>Giao tiếp theo: {formatDate(s.nextDeliveryAt)}</div>
                  )}
                  {s.createdAt && <div>Tạo: {formatDate(s.createdAt)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

