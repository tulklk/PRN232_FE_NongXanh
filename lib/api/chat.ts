export interface ChatCompletionMessage {
  role: string
  content: string
}

export interface SendChatMessageRequest {
  message: string
  messages?: ChatCompletionMessage[]
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface SendChatMessageResult {
  text: string
  raw: unknown
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

function readTextFromUnknown(data: unknown): string | null {
  if (!data) return null
  if (typeof data === 'string') return data.trim() || null
  if (typeof data !== 'object') return null

  const record = data as Record<string, unknown>
  const directCandidates = [
    'response',
    'message',
    'content',
    'answer',
    'output',
    'text',
  ]
  for (const key of directCandidates) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  const nestedData = record.data
  if (nestedData && typeof nestedData === 'object') {
    const nested = nestedData as Record<string, unknown>
    for (const key of directCandidates) {
      const value = nested[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }

  const choices = record.choices
  if (Array.isArray(choices) && choices.length > 0) {
    const firstChoice = choices[0] as Record<string, unknown>
    const choiceText = firstChoice?.text
    if (typeof choiceText === 'string' && choiceText.trim()) return choiceText.trim()
    const choiceMessage = firstChoice?.message
    if (choiceMessage && typeof choiceMessage === 'object') {
      const content = (choiceMessage as Record<string, unknown>).content
      if (typeof content === 'string' && content.trim()) return content.trim()
    }
  }

  return null
}

export async function sendChatMessage(
  payload: SendChatMessageRequest,
  token?: string
): Promise<SendChatMessageResult> {
  const res = await fetch(`${getBase()}/api/chat`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify(payload),
  })

  const json = (await res.json().catch(() => ({}))) as unknown
  if (!res.ok) {
    const err = json as { error?: string; message?: string }
    throw new Error(
      err.error || err.message || 'Không thể gửi tin nhắn tới AI chat'
    )
  }

  return {
    text: readTextFromUnknown(json) || 'Mình đã nhận tin nhắn của bạn.',
    raw: json,
  }
}

export async function getChatDiagnostic(
  token?: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${getBase()}/api/chat/diagnostic`, {
    headers: getHeaders(token),
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể kiểm tra trạng thái AI chat'
    )
  }
  return json
}

