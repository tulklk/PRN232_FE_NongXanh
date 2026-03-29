'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Send } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { createSignalrClient } from '@/lib/realtime/signalr'
import {
  markChatRead,
  mapDtoToMessageModel,
  sendSupportMessage,
  getMyChatHistory,
  type SupportChatMessageDto,
  type SupportChatMessageModel,
} from '@/lib/api/supportChat'

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export default function SupportChatPage() {
  const { user, tokens, isAuthenticated } = useUser()
  const [messages, setMessages] = useState<SupportChatMessageModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  const clientRef = useRef<ReturnType<typeof createSignalrClient> | null>(null)
  const lastMarkedSenderRef = useRef<string | null>(null)

  const myId = user?.userId || ''
  const canSend = isAuthenticated && !isSending && input.trim().length > 0

  const sorted = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const ta = new Date(a.createdAt).getTime()
        const tb = new Date(b.createdAt).getTime()
        return ta - tb
      }),
    [messages]
  )

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setLoading(false)
      return
    }

    setMessages([])
    setError(null)

    setLoading(true)
    getMyChatHistory(tokens.idToken)
      .then((dtos) => {
        const mapped = (dtos ?? []).map(mapDtoToMessageModel).filter((m) => m.text)
        setMessages(mapped)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể tải lịch sử chat'))
      .finally(() => setLoading(false))
  }, [isAuthenticated, tokens?.idToken])

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) return

    const client = createSignalrClient(tokens.idToken)
    clientRef.current = client

    const offMsg = client.onReceiveMessage((payload) => {
      const dto = (payload ?? {}) as SupportChatMessageDto
      const model = mapDtoToMessageModel(dto)

      // Append messages that involve me.
      if (!model.senderId) return
      const me = myId
      if (me && model.senderId !== me && model.receiverId !== me) return

      setMessages((prev) => {
        if (prev.some((m) => m.id === model.id)) return prev
        return [...prev, model]
      })

      // Mark as read when receiving from other side.
      if (
        tokens?.idToken &&
        me &&
        model.senderId !== me &&
        model.receiverId === me &&
        lastMarkedSenderRef.current !== model.senderId
      ) {
        lastMarkedSenderRef.current = model.senderId
        void markChatRead(model.senderId, tokens.idToken).catch(() => {})
      }
    })

    void client.start().catch(() => {})

    return () => {
      offMsg()
      void client.stop().catch(() => {})
      clientRef.current = null
    }
  }, [isAuthenticated, tokens?.idToken, myId])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !tokens?.idToken || isSending) return

    setIsSending(true)
    setInput('')
    try {
      await sendSupportMessage({ receiverId: null, message: text }, tokens.idToken)
      // rely on realtime echo; fallback optimistic append:
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          senderId: myId,
          receiverId: null,
          text,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể gửi tin nhắn')
    } finally {
      setIsSending(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5">
        <p className="text-gray-600">Vui lòng đăng nhập để sử dụng chat hỗ trợ.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 bg-[#0A923C] px-4 py-3 text-white">
        <Image
          src="/images/chatbox/chatboxicon.png"
          alt="Support"
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold">Hỗ trợ Nông Xanh</p>
          <p className="text-[11px] text-green-100">Online - Phản hồi nhanh</p>
        </div>
      </div>

      <div className="max-h-[520px] min-h-[420px] overflow-y-auto bg-gray-50 px-3 py-3">
        {loading && <p className="text-sm text-gray-500 py-6 text-center">Đang tải...</p>}
        {error && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {error}
          </div>
        )}
        <div className="space-y-3">
          {sorted.map((m) => {
            const isMe = myId && m.senderId === myId
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Image
                    src="/images/chatbox/chatboxicon.png"
                    alt="Support"
                    width={28}
                    height={28}
                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                  />
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                    isMe
                      ? 'bg-[#0A923C] text-sm text-white rounded-br-sm'
                      : 'bg-white text-[13px] text-gray-700 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`mt-1 text-[10px] ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            )
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
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Nhập tin nhắn..."
            className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#0A923C] focus:ring-2 focus:ring-[#0A923C]/20"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A923C] text-white transition-colors hover:bg-[#087a32] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Gửi tin nhắn"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

