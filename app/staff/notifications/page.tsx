'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import {
  deleteNotification,
  getNotifications,
  markNotificationRead,
  type NotificationModel,
} from '@/lib/api/notifications'
import { createSignalrClient } from '@/lib/realtime/signalr'
import { formatDate } from '@/lib/utils'

export default function StaffNotificationsPage() {
  const { tokens, isAuthenticated } = useUser()
  const [items, setItems] = useState<NotificationModel[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
    [totalCount, pageSize]
  )

  const fetchPage = async (p: number) => {
    if (!tokens?.idToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await getNotifications({ pageNumber: p, pageSize }, tokens.idToken)
      setItems(res.items)
      setTotalCount(res.totalCount)
      setPageNumber(res.pageNumber)
    } catch (e) {
      setItems([])
      setTotalCount(0)
      setError(e instanceof Error ? e.message : 'Không thể tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoading(false)
      return
    }
    void fetchPage(pageNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tokens?.idToken, pageNumber])

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) return
    const client = createSignalrClient(tokens.idToken)
    const off = client.onReceiveNotification(() => {
      void fetchPage(pageNumber)
    })
    void client.start().catch(() => {})
    return () => {
      off()
      void client.stop().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tokens?.idToken, pageNumber])

  const handleRead = async (id: string) => {
    if (!tokens?.idToken) return
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await markNotificationRead(id, tokens.idToken)
      window.dispatchEvent(new Event('notifications-updated'))
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)))
    }
  }

  const handleDelete = async (id: string) => {
    if (!tokens?.idToken) return
    const before = items
    setItems((prev) => prev.filter((n) => n.id !== id))
    try {
      await deleteNotification(id, tokens.idToken)
      setTotalCount((c) => Math.max(0, c - 1))
      window.dispatchEvent(new Event('notifications-updated'))
    } catch (e) {
      setItems(before)
      setError(e instanceof Error ? e.message : 'Không thể xóa thông báo')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-gray-600">Vui lòng đăng nhập Admin/Staff.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="mb-4 flex items-center gap-2">
        <Bell size={18} className="text-[#0A923C]" />
        <h2 className="text-base font-bold text-gray-900">Thông báo</h2>
      </div>

      {loading && <p className="py-10 text-center text-sm text-gray-500">Đang tải...</p>}
      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="flex items-center justify-center py-14">
          <p className="text-base text-gray-500">Chưa có thông báo nào.</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border p-3 transition-colors ${
              n.isRead ? 'border-gray-200 bg-white' : 'border-green-200 bg-green-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => void handleRead(n.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                    {n.title || 'Thông báo'}
                  </p>
                  {!n.isRead && (
                    <span className="h-2 w-2 rounded-full bg-[#0A923C]" aria-label="Chưa đọc" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatDate(n.createdAt)} • {n.type || 'System'}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{n.content}</p>
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(n.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label="Xóa thông báo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            {pageNumber} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            disabled={pageNumber >= totalPages}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
