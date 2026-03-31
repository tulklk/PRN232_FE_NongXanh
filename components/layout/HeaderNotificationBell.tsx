"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationModel,
} from "@/lib/api/notifications";
import { createSignalrClient } from "@/lib/realtime/signalr";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function HeaderNotificationBell() {
  const { tokens, isAuthenticated } = useUser();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const refreshCount = useCallback(async () => {
    if (!tokens?.idToken) {
      setCount(0);
      return;
    }
    try {
      const n = await getUnreadNotificationCount(tokens.idToken);
      setCount(n);
    } catch {
      setCount(0);
    }
  }, [tokens?.idToken]);

  const loadNotifications = useCallback(async () => {
    if (!tokens?.idToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getNotifications(
        { pageNumber: 1, pageSize: 10 },
        tokens.idToken,
      );
      setItems(res.items ?? []);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  }, [tokens?.idToken]);

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setCount(0);
      setItems([]);
      return;
    }
    void refreshCount();
  }, [isAuthenticated, tokens?.idToken, refreshCount]);

  useEffect(() => {
    if (!isAuthenticated) setOpen(false);
  }, [isAuthenticated]);

  useEffect(() => {
    const onFocus = () => void refreshCount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshCount]);

  useEffect(() => {
    const onUpdated = () => void refreshCount();
    window.addEventListener("notifications-updated", onUpdated);
    return () => window.removeEventListener("notifications-updated", onUpdated);
  }, [refreshCount]);

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) return;
    const client = createSignalrClient(tokens.idToken);
    const off = client.onReceiveNotification(() => {
      void refreshCount();
      if (openRef.current) void loadNotifications();
    });
    void client.start().catch(() => {});
    return () => {
      off();
      void client.stop().catch(() => {});
    };
  }, [isAuthenticated, tokens?.idToken, refreshCount, loadNotifications]);

  useEffect(() => {
    if (!open || !isAuthenticated || !tokens?.idToken) return;
    void loadNotifications();
  }, [open, loadNotifications, isAuthenticated, tokens?.idToken]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const unreadIds = useMemo(
    () => new Set(items.filter((x) => !x.isRead).map((x) => x.id)),
    [items],
  );

  const handleMarkRead = async (id: string) => {
    if (!tokens?.idToken) return;
    try {
      await markNotificationRead(id, tokens.idToken);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      void refreshCount();
      window.dispatchEvent(new Event("notifications-updated"));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!tokens?.idToken || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(tokens.idToken);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      void refreshCount();
      window.dispatchEvent(new Event("notifications-updated"));
      // reload to keep list in sync (in case pagination / partial load)
      void loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleToggle = () => setOpen((v) => !v);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 hover:text-yellow-300 transition-colors"
        aria-label="Thông báo của tôi"
      >
        <span className="relative inline-flex">
          <Bell size={20} />
          {count > 0 && (
            <span
              className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-bold"
              aria-label={`${count} thông báo chưa đọc`}
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        <span className="text-sm hidden md:inline">Thông báo của tôi</span>
      </button>

      {open && !isAuthenticated && (
        <div className="absolute right-0 top-full mt-2 w-[300px] max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50 px-4 py-4">
          <p className="text-sm text-gray-700 text-center">
            Bạn cần đăng nhập để xem thông báo
          </p>
          <Link
            href="/login"
            className="mt-3 block w-full rounded-lg bg-primary-green py-2 text-center text-sm font-semibold text-white hover:bg-primary-green-dark"
            onClick={() => setOpen(false)}
          >
            Đăng nhập
          </Link>
        </div>
      )}

      {open && isAuthenticated && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Thông báo</p>
            <Link
              href="/account/notifications"
              className="text-xs font-semibold text-primary-green hover:underline"
              onClick={() => setOpen(false)}
            >
              Xem tất cả
            </Link>
          </div>

          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={
                markingAll || items.length === 0 || unreadIds.size === 0
              }
              className="text-xs font-semibold text-gray-700 hover:text-[#0A923C] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markingAll ? "Đang đánh dấu..." : "Đọc tất cả"}
            </button>
            {unreadIds.size > 0 && (
              <p className="text-[11px] text-gray-500">
                Chưa đọc:{" "}
                <span className="font-semibold">{unreadIds.size}</span>
              </p>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading && (
              <p className="px-4 py-4 text-sm text-gray-500">Đang tải...</p>
            )}
            {!loading && error && (
              <p className="px-4 py-4 text-sm text-red-600">{error}</p>
            )}
            {!loading && !error && items.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-500">
                Chưa có thông báo nào.
              </p>
            )}

            {!loading &&
              !error &&
              items.map((n) => {
                const isUnread = unreadIds.has(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void handleMarkRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isUnread ? "bg-primary-green/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {n.title || "Thông báo"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                          {n.content}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-gray-400">
                          {formatTime(n.createdAt)}
                        </p>
                        {isUnread && (
                          <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
