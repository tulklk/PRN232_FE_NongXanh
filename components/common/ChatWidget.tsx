'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Send, X } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

type ChatRole = 'bot' | 'user'

interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  time: string
}

const initialMessages: ChatMessage[] = [
  {
    id: 'bot-1',
    role: 'bot',
    text: 'Xin chào! Mình là trợ lý của Nông Xanh. Bạn cần hỗ trợ gì hôm nay?',
    time: 'Vừa xong',
  },
  {
    id: 'bot-2',
    role: 'bot',
    text: 'Bạn có thể hỏi về sản phẩm, đơn hàng, voucher hoặc chính sách giao hàng.',
    time: 'Vừa xong',
  },
]

export default function ChatWidget() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [renderPanel, setRenderPanel] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

  const canSend = input.trim().length > 0
  const userDisplayName = user?.displayName?.trim() || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase() || 'U'

  const groupedMessages = useMemo(() => messages, [messages])

  const handleSend = () => {
    const value = input.trim()
    if (!value) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: value,
      time: 'Vừa xong',
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
  }

  const handleTogglePanel = () => {
    if (open) {
      setOpen(false)
      setTimeout(() => {
        setRenderPanel(false)
      }, 260)
      return
    }
    setRenderPanel(true)
    // Trigger enter animation after mount.
    requestAnimationFrame(() => {
      setOpen(true)
    })
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={handleTogglePanel}
          aria-label="Mở khung chat"
          className="fixed bottom-6 right-6 z-[70] inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#73C66B] shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#5fb657] active:scale-95 animate-[chatPulse_2.2s_ease-in-out_infinite]"
        >
          <Image
            src="/images/chatbox/chatboxicon.png"
            alt="AI chat"
            width={56}
            height={56}
            className="h-full w-full rounded-full object-cover transition-transform duration-300 scale-[1.35]"
          />
        </button>
      )}

      {renderPanel && (
        <div
          className={`fixed bottom-24 right-4 z-[80] w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out sm:right-6 sm:w-[360px] ${
            open
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-5 scale-90 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between bg-[#0A923C] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/chatbox/chatboxicon.png"
                alt="AI chat avatar"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold">Trợ lý Nông Xanh</p>
                <p className="text-[11px] text-green-100">Online - Trả lời nhanh</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePanel}
              className="rounded p-1 hover:bg-white/15 transition-colors"
              aria-label="Đóng chat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[500px] min-h-[420px] overflow-y-auto bg-gray-50 px-3 py-3">
            <div className="space-y-3">
              {groupedMessages.map((message) => {
                const isUser = message.role === 'user'
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <Image
                        src="/images/chatbox/chatboxicon.png"
                        alt="AI"
                        width={32}
                        height={32}
                        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                      />
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                        isUser
                          ? 'bg-[#0A923C] text-sm text-white rounded-br-sm'
                          : 'bg-white text-[13px] text-gray-700 border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isUser ? 'text-green-100' : 'text-gray-400'
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>
                    {isUser && (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#dff3dc] text-xs font-semibold text-[#0A923C]">
                        {userInitial}
                      </div>
                    )}
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
                    handleSend()
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#0A923C] focus:ring-2 focus:ring-[#0A923C]/20"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A923C] text-white transition-colors hover:bg-[#087a32] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes chatPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </>
  )
}
