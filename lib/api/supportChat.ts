export interface SupportChatSendRequest {
  receiverId?: string | null
  message: string
}

export interface SupportChatMessageDto {
  messageId?: string
  id?: string
  senderId?: string
  receiverId?: string | null
  message?: string
  content?: string
  createdAt?: string
  sentAt?: string
  senderDisplayName?: string
  receiverDisplayName?: string
  isRead?: boolean
  [k: string]: unknown
}

export interface SupportChatRecentDto {
  otherUserId?: string
  userId?: string
  otherUserDisplayName?: string
  displayName?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
  [k: string]: unknown
}

export interface SupportChatMessageModel {
  id: string
  senderId: string
  receiverId: string | null
  text: string
  createdAt: string
  senderDisplayName?: string
  isRead?: boolean
}

export interface SupportChatRecentModel {
  otherUserId: string
  displayName: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

const getBase = () =>
  typeof window !== 'undefined'
    ? ''
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function getJsonHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function unwrapItems(json: unknown): unknown[] {
  if (Array.isArray(json)) return json
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    if (Array.isArray(o.items)) return o.items
    const data = o.data
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      if (Array.isArray(d.items)) return d.items
    }
  }
  return []
}

export function mapDtoToMessageModel(dto: SupportChatMessageDto): SupportChatMessageModel {
  const id = String(dto.messageId ?? dto.id ?? '')
  const senderId = String(dto.senderId ?? '')
  const receiverId = dto.receiverId !== undefined && dto.receiverId !== null
    ? String(dto.receiverId)
    : null
  const text = String(dto.message ?? dto.content ?? '')
  const createdAt = String(dto.createdAt ?? dto.sentAt ?? new Date().toISOString())
  return {
    id: id || `${senderId}-${createdAt}`,
    senderId,
    receiverId,
    text,
    createdAt,
    senderDisplayName:
      typeof dto.senderDisplayName === 'string' ? dto.senderDisplayName : undefined,
    isRead: typeof dto.isRead === 'boolean' ? dto.isRead : undefined,
  }
}

export function mapDtoToRecentModel(dto: SupportChatRecentDto): SupportChatRecentModel {
  const otherUserId = String(dto.otherUserId ?? dto.userId ?? '')
  return {
    otherUserId,
    displayName: String(dto.otherUserDisplayName ?? dto.displayName ?? otherUserId),
    lastMessage: String(dto.lastMessage ?? ''),
    lastMessageAt: String(dto.lastMessageAt ?? new Date().toISOString()),
    unreadCount: Number(dto.unreadCount ?? 0) || 0,
  }
}

export async function sendSupportMessage(
  data: SupportChatSendRequest,
  token?: string
): Promise<SupportChatMessageDto> {
  const res = await fetch(`${getBase()}/api/support-chat/send`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(data),
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) || (json.message as string) || 'Không thể gửi tin nhắn'
    )
  }
  return json as unknown as SupportChatMessageDto
}

export async function getChatHistory(
  otherId: string,
  token?: string
): Promise<SupportChatMessageDto[]> {
  const res = await fetch(
    `${getBase()}/api/support-chat/history/${encodeURIComponent(otherId)}`,
    { headers: getHeaders(token), cache: 'no-store' }
  )
  const json = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    const err = json as { error?: string; message?: string }
    throw new Error(err.error || err.message || 'Không thể tải lịch sử chat')
  }
  return unwrapItems(json) as SupportChatMessageDto[]
}

export async function getMyChatHistory(token?: string): Promise<SupportChatMessageDto[]> {
  const res = await fetch(`${getBase()}/api/support-chat/history`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    const err = json as { error?: string; message?: string }
    throw new Error(err.error || err.message || 'Không thể tải lịch sử chat')
  }
  return unwrapItems(json) as SupportChatMessageDto[]
}

export async function getAdminRecentChats(
  token?: string
): Promise<SupportChatRecentDto[]> {
  const res = await fetch(`${getBase()}/api/support-chat/admin/recent`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    const err = json as { error?: string; message?: string }
    throw new Error(err.error || err.message || 'Không thể tải danh sách chat gần đây')
  }
  return unwrapItems(json) as SupportChatRecentDto[]
}

export async function markChatRead(senderId: string, token?: string): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/support-chat/mark-read/${encodeURIComponent(senderId)}`,
    { method: 'POST', headers: getHeaders(token) }
  )
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể đánh dấu đã đọc'
    )
  }
}

