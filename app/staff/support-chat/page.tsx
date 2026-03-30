"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { createSignalrClient } from "@/lib/realtime/signalr";
import {
  getAdminRecentChats,
  getChatHistory,
  mapDtoToMessageModel,
  mapDtoToRecentModel,
  markChatRead,
  sendSupportMessage,
  type SupportChatMessageDto,
  type SupportChatMessageModel,
  type SupportChatRecentModel,
} from "@/lib/api/supportChat";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function StaffSupportChatPage() {
  const { tokens, isAuthenticated, user } = useUser();

  const [recent, setRecent] = useState<SupportChatRecentModel[]>([]);
  const [activeOtherId, setActiveOtherId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportChatMessageModel[]>([]);

  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const myId = user?.userId || "";
  const clientRef = useRef<ReturnType<typeof createSignalrClient> | null>(null);

  const canSend =
    isAuthenticated && !!tokens?.idToken && !!activeOtherId && input.trim();

  const sorted = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return ta - tb;
      }),
    [messages]
  );

  const refreshRecent = async () => {
    if (!tokens?.idToken) return;
    setLoadingRecent(true);
    setError(null);
    try {
      // Staff dùng chung endpoint recent giống admin UI (đã có trong hệ thống).
      const dtos = await getAdminRecentChats(tokens.idToken);
      const mapped = (dtos ?? [])
        .map(mapDtoToRecentModel)
        .filter((r) => r.otherUserId);
      setRecent(mapped);
      if (!activeOtherId && mapped.length > 0) setActiveOtherId(mapped[0].otherUserId);
    } catch (e) {
      setRecent([]);
      setError(e instanceof Error ? e.message : "Không thể tải inbox");
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoadingRecent(false);
      return;
    }
    void refreshRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tokens?.idToken]);

  useEffect(() => {
    if (!tokens?.idToken || !activeOtherId) return;
    setLoadingMessages(true);
    setError(null);
    getChatHistory(activeOtherId, tokens.idToken)
      .then((dtos) => {
        const mapped = (dtos ?? [])
          .map(mapDtoToMessageModel)
          .filter((m) => m.text);
        setMessages(mapped);
        void markChatRead(activeOtherId, tokens.idToken).catch(() => {});
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Không thể tải hội thoại")
      )
      .finally(() => setLoadingMessages(false));
  }, [activeOtherId, tokens?.idToken]);

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) return;
    const client = createSignalrClient(tokens.idToken);
    clientRef.current = client;

    const offMsg = client.onReceiveMessage((payload) => {
      const dto = (payload ?? {}) as SupportChatMessageDto;
      const model = mapDtoToMessageModel(dto);
      if (!model.senderId) return;

      const otherId = activeOtherId;
      if (
        otherId &&
        (model.senderId === otherId || model.receiverId === otherId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === model.id)) return prev;
          return [...prev, model];
        });
      }

      // Refresh recent list lazily.
      void refreshRecent();
    });

    void client.start().catch(() => {});
    return () => {
      offMsg();
      void client.stop().catch(() => {});
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tokens?.idToken, activeOtherId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !tokens?.idToken || !activeOtherId || isSending) return;

    setIsSending(true);
    setInput("");
    try {
      await sendSupportMessage({ receiverId: activeOtherId, message: text }, tokens.idToken);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          senderId: myId,
          receiverId: activeOtherId,
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
      void refreshRecent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-gray-600">Vui lòng đăng nhập Staff.</p>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden border border-gray-200 lg:h-[calc(100vh-180px)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
        <aside className="lg:col-span-4 border-r border-gray-200 bg-gray-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="font-semibold text-gray-900">Support Inbox</p>
            <p className="text-xs text-gray-500">Khách hàng chat gần đây</p>
          </div>
          <div className="h-full overflow-y-auto">
            {loadingRecent && (
              <p className="text-sm text-gray-500 py-6 text-center">Đang tải...</p>
            )}
            {!loadingRecent && recent.length === 0 && (
              <p className="text-sm text-gray-500 py-6 text-center">
                Chưa có cuộc trò chuyện nào.
              </p>
            )}
            {recent.map((r) => {
              const active = r.otherUserId === activeOtherId;
              return (
                <button
                  key={r.otherUserId}
                  type="button"
                  onClick={() => setActiveOtherId(r.otherUserId)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-colors ${
                    active ? "bg-white" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {r.displayName}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {r.lastMessage}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">
                        {formatTime(r.lastMessageAt)}
                      </p>
                      {r.unreadCount > 0 && (
                        <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0A923C] px-1.5 text-[11px] font-semibold text-white">
                          {r.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:col-span-8 flex flex-col min-h-[520px]">
          <div className="flex items-center gap-3 bg-[#0A923C] px-4 py-3 text-white">
            <Image
              src="/images/chatbox/chatboxicon.png"
              alt="Support"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold line-clamp-1">
                {recent.find((x) => x.otherUserId === activeOtherId)?.displayName ||
                  "Chọn khách hàng"}
              </p>
              <p className="text-[11px] text-green-100">Realtime (ReceiveMessage)</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50">
            {error && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {error}
              </div>
            )}
            {loadingMessages && (
              <p className="text-sm text-gray-500 py-6 text-center">
                Đang tải hội thoại...
              </p>
            )}
            <div className="space-y-3">
              {sorted.map((m) => {
                const isMe = myId && m.senderId === myId;
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700">
                        {m.senderDisplayName
                          ?.trim()
                          ?.charAt(0)
                          ?.toUpperCase() || "K"}
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                        isMe
                          ? "bg-[#0A923C] text-sm text-white rounded-br-sm"
                          : "bg-white text-[13px] text-gray-700 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isMe ? "text-green-100" : "text-gray-400"
                        }`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white p-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#0A923C] focus:ring-2 focus:ring-[#0A923C]/20"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!Boolean(canSend)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A923C] text-white transition-colors hover:bg-[#087a32] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

