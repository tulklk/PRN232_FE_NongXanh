import type { MealComboSuggestion } from '@/lib/types/api'

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

export type DietType = 'Healthy' | 'EatClean' | 'GiaDinh'

export interface MealComboSuggestionsParams {
  peopleCount: number
  days: number
  dietType: DietType
}

type SuggestionsResponse =
  | { success?: boolean; data?: MealComboSuggestion[]; message?: string }
  | MealComboSuggestion[]
  | { data?: MealComboSuggestion[] }

export async function getMealComboSuggestions(
  params: MealComboSuggestionsParams,
  token: string
): Promise<MealComboSuggestion[]> {
  const qs = new URLSearchParams({
    peopleCount: String(params.peopleCount),
    days: String(params.days),
    dietType: params.dietType,
  })
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

  const payload = json as unknown as SuggestionsResponse
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const p = payload as { data?: MealComboSuggestion[] }
    if (Array.isArray(p.data)) return p.data
    const p2 = payload as { success?: boolean; data?: MealComboSuggestion[] }
    if (Array.isArray(p2.data)) return p2.data
  }
  return []
}

