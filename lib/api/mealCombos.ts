import type { ApiResponse, MealComboDto } from '@/lib/types/api'

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

// Swagger defines dietType as free-form string (not enum).
export type DietType = string

export interface MealComboSuggestionsParams {
  peopleCount: number
  days: number
  dietType?: DietType | '' | null
}

export async function getMealComboSuggestions(
  params: MealComboSuggestionsParams,
  token: string
): Promise<MealComboDto[]> {
  const qs = new URLSearchParams({
    peopleCount: String(params.peopleCount),
    days: String(params.days),
  })
  const diet = params.dietType ?? ''
  if (diet) qs.set('dietType', String(diet))

  const res = await fetch(`${getBase()}/api/meal-combos/suggestions?${qs.toString()}`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể lấy gợi ý combo'
    )
  }

  // Backend chuẩn: ApiResponse<MealComboDto[]>
  const payload = json as unknown as ApiResponse<MealComboDto[]> | MealComboDto[] | null
  if (!payload) return []

  if (Array.isArray(payload)) return payload

  const data = (payload as ApiResponse<MealComboDto[]>).data ?? []
  if (!Array.isArray(data)) return []

  // Lọc bỏ combo không có items để UI show thông báo phù hợp.
  return data.filter((c) => Array.isArray(c.items) && c.items.length > 0)
}

export async function getMealComboById(id: string, token?: string): Promise<MealComboDto | null> {
  const trimmed = String(id ?? '').trim()
  if (!trimmed) return null

  const res = await fetch(`${getBase()}/api/meal-combos/${encodeURIComponent(trimmed)}`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể tải combo'
    )
  }

  const payload = json as unknown as ApiResponse<MealComboDto> | MealComboDto | null
  if (!payload) return null
  if (!('data' in (payload as ApiResponse<MealComboDto>))) {
    return payload as MealComboDto
  }
  return (payload as ApiResponse<MealComboDto>).data ?? null
}

