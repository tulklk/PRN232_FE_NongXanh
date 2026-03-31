import type { RecipeModel } from '@/lib/types/api'

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

type RecipesResponse =
  | { success?: boolean; data?: RecipeModel[]; message?: string }
  | RecipeModel[]
  | { items?: RecipeModel[]; data?: { items?: RecipeModel[] } }
  | { data?: RecipeModel[] }

type RecipeResponse =
  | { success?: boolean; data?: RecipeModel; message?: string }
  | RecipeModel
  | { data?: RecipeModel }

type CreateRecipeRequest = {
  title: string
  description?: string
  instructions: string
  /** BE Swagger có field này; gửi null nếu không có ảnh để bind đủ DTO */
  imageUrl?: string | null
  cookingTimeMinutes: number
  servings: number
  ingredients: Array<{
    productId: string
    ingredientName: string
    quantity: number
    unit: string
  }>
}

type UpdateRecipeRequest = Partial<Omit<CreateRecipeRequest, 'ingredients'>> & {
  ingredients?: CreateRecipeRequest['ingredients']
}

function normalizeRecipeDto(raw: RecipeModel | null | undefined): RecipeModel | null {
  if (!raw || typeof raw !== 'object') return raw ?? null
  const r = raw as Record<string, unknown>
  const ing = r.ingredients ?? r.Ingredients
  if (Array.isArray(ing)) {
    return { ...r, ingredients: ing } as RecipeModel
  }
  return raw
}

export async function getRecipes(
  params: { pageNumber?: number; pageSize?: number } | undefined,
  token: string
): Promise<RecipeModel[]> {
  const qs = new URLSearchParams()
  if (params?.pageNumber) qs.set('pageNumber', String(params.pageNumber))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''

  const res = await fetch(`${getBase()}/api/recipes${suffix}`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể tải recipes'
    )
  }

  const payload = json as unknown as RecipesResponse
  const mapList = (list: RecipeModel[]) => list.map((x) => normalizeRecipeDto(x) ?? x)
  if (Array.isArray(payload)) return mapList(payload)
  if (payload && typeof payload === 'object') {
    const p = payload as { data?: RecipeModel[] }
    if (Array.isArray(p.data)) return mapList(p.data)
    const p2 = payload as { items?: RecipeModel[]; data?: { items?: RecipeModel[] } }
    if (Array.isArray(p2.items)) return mapList(p2.items)
    if (p2.data && Array.isArray(p2.data.items)) return mapList(p2.data.items)
  }
  return []
}

export async function getRecipeById(id: string, token: string): Promise<RecipeModel | null> {
  const res = await fetch(`${getBase()}/api/recipes/${encodeURIComponent(id)}`, {
    headers: getHeaders(token),
    cache: 'no-store',
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể tải recipe'
    )
  }

  const payload = json as unknown as RecipeResponse
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const d = (payload as { data?: RecipeModel }).data
    if (d) return normalizeRecipeDto(d) ?? d
  }
  return normalizeRecipeDto(payload as RecipeModel) ?? (payload as RecipeModel)
}

export async function addRecipeIngredientsToCart(
  recipeId: string,
  token: string
): Promise<boolean> {
  const res = await fetch(
    `${getBase()}/api/recipes/${encodeURIComponent(recipeId)}/add-to-cart`,
    {
      method: 'POST',
      headers: {
        ...getHeaders(token),
        'Content-Type': 'application/json',
      },
      body: '{}',
    }
  )

  const json = await res.json().catch(() => ({} as unknown))
  if (!res.ok) {
    const err = json as { error?: string; message?: string }
    throw new Error(err.error || err.message || 'Không thể thêm nguyên liệu vào giỏ')
  }

  if (typeof json === 'boolean') return json
  if (typeof json === 'number') return json > 0
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    const data = o.data
    if (typeof data === 'boolean') return data
    if (typeof o.success === 'boolean' && typeof data === 'boolean') return data
  }
  return true
}

export async function createRecipe(
  payload: CreateRecipeRequest,
  token: string
): Promise<RecipeModel> {
  const body = {
    ...payload,
    imageUrl: payload.imageUrl ?? null,
    ingredients: payload.ingredients.map((row) => ({
      productId: String(row.productId).trim(),
      ingredientName: String(row.ingredientName).trim(),
      quantity: Number(row.quantity),
      unit: String(row.unit).trim(),
    })),
  }

  const res = await fetch(`${getBase()}/api/recipes`, {
    method: 'POST',
    headers: {
      ...getHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể tạo recipe'
    )
  }

  const data = (json as { data?: RecipeModel }).data
  if (data) return normalizeRecipeDto(data) ?? data
  return normalizeRecipeDto(json as RecipeModel) ?? (json as unknown as RecipeModel)
}

export async function updateRecipe(
  id: string,
  payload: UpdateRecipeRequest,
  token: string
): Promise<RecipeModel> {
  const rid = String(id ?? '').trim()
  if (!rid) throw new Error('Thiếu recipeId')

  const body = {
    ...payload,
    imageUrl: payload.imageUrl ?? null,
    ...(payload.ingredients
      ? {
          ingredients: payload.ingredients.map((row) => ({
            productId: String(row.productId).trim(),
            ingredientName: String(row.ingredientName).trim(),
            quantity: Number(row.quantity),
            unit: String(row.unit).trim(),
          })),
        }
      : {}),
  }

  const res = await fetch(`${getBase()}/api/recipes/${encodeURIComponent(rid)}`, {
    method: 'PUT',
    headers: {
      ...getHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể cập nhật recipe'
    )
  }

  const data = (json as { data?: RecipeModel }).data
  if (data) return normalizeRecipeDto(data) ?? data
  return normalizeRecipeDto(json as RecipeModel) ?? (json as unknown as RecipeModel)
}

export async function deleteRecipe(id: string, token: string): Promise<boolean> {
  const rid = String(id ?? '').trim()
  if (!rid) throw new Error('Thiếu recipeId')

  const res = await fetch(`${getBase()}/api/recipes/${encodeURIComponent(rid)}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        'Không thể xóa recipe'
    )
  }

  if (typeof (json as any) === 'boolean') return Boolean(json)
  if (typeof (json as any)?.success === 'boolean') return Boolean((json as any).success)
  return true
}

