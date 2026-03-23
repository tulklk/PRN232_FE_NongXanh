import type { ApiProductVariant } from '@/lib/types/api'

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
  return {
    ...getHeaders(token),
    'Content-Type': 'application/json',
  }
}

type VariantPayload = {
  variantName: string
  price: number
  stockQuantity: number
  sku?: string | null
  status?: string | null
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const obj = data as { error?: string; message?: string }
    return obj.error || obj.message || fallback
  }
  return fallback
}

function parseVariantList(raw: unknown): ApiProductVariant[] {
  if (Array.isArray(raw)) return raw.map(normalizeVariantItem)
  if (raw && typeof raw === 'object') {
    const obj = raw as { data?: ApiProductVariant[]; items?: ApiProductVariant[] }
    const list = obj.data ?? obj.items ?? []
    return list.map(normalizeVariantItem)
  }
  return []
}

function parseVariantItem(raw: unknown): ApiProductVariant {
  if (raw && typeof raw === 'object') {
    const obj = raw as { data?: ApiProductVariant; item?: ApiProductVariant }
    return normalizeVariantItem(obj.data ?? obj.item ?? (raw as ApiProductVariant))
  }
  throw new Error('Dữ liệu biến thể không hợp lệ')
}

function normalizeVariantItem(raw: ApiProductVariant | Record<string, unknown>): ApiProductVariant {
  const row = raw as Record<string, unknown>
  return {
    ...(raw as ApiProductVariant),
    variantId: (row.variantId ?? row.VariantId ?? row.id ?? row.Id) as any,
    variantName: String(row.variantName ?? row.VariantName ?? row.name ?? row.Name ?? ''),
    price: Number(row.price ?? row.Price ?? 0),
    stockQuantity: Number(row.stockQuantity ?? row.StockQuantity ?? 0),
    sku: (row.sku ?? row.Sku ?? null) as string | null,
    status: (row.status ?? row.Status ?? null) as string | null,
    productId: (row.productId ?? row.ProductId) as any,
  }
}

export async function getProductVariants(
  productId?: number | string,
  token?: string
): Promise<ApiProductVariant[]> {
  let url = `${getBase()}/api/product-variants`
  if (productId) {
    url += `?productId=${productId}`
  }
  const res = await fetch(url, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải biến thể sản phẩm'
    )
  }
  const raw = await res.json()
  let list: ApiProductVariant[] = parseVariantList(raw)
  if (productId != null && list.length > 0) {
    const pidStr = String(productId)
    list = list.filter((v) => {
      const vPid = v.productId
      return String(vPid) === pidStr || vPid === productId
    })
  }
  return list
}

export async function createProductVariant(
  productId: number | string,
  payload: VariantPayload,
  token?: string
): Promise<ApiProductVariant> {
  const res = await fetch(`${getBase()}/api/product-variants`, {
    method: 'POST',
    headers: getJsonHeaders(token),
    body: JSON.stringify({
      name: payload.variantName,
      price: payload.price,
      stockQuantity: payload.stockQuantity,
      sku: payload.sku ?? '',
      status: payload.status ?? 'Active',
      productId: String(productId),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(extractErrorMessage(err, 'Không thể tạo biến thể sản phẩm'))
  }
  const data = await res.json().catch(() => null)
  return parseVariantItem(data)
}

export async function getProductVariantById(
  id: number | string,
  token?: string
): Promise<ApiProductVariant> {
  const res = await fetch(`${getBase()}/api/product-variants/${id}`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(extractErrorMessage(err, 'Không thể tải chi tiết biến thể sản phẩm'))
  }
  const data = await res.json()
  return parseVariantItem(data)
}

export async function updateProductVariant(
  id: number | string,
  payload: VariantPayload,
  token?: string
): Promise<ApiProductVariant> {
  const res = await fetch(`${getBase()}/api/product-variants/${id}`, {
    method: 'PUT',
    headers: getJsonHeaders(token),
    body: JSON.stringify({
      name: payload.variantName,
      price: payload.price,
      stockQuantity: payload.stockQuantity,
      sku: payload.sku ?? '',
      status: payload.status ?? 'Active',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(extractErrorMessage(err, 'Không thể cập nhật biến thể sản phẩm'))
  }
  const data = await res.json()
  return parseVariantItem(data)
}

export async function deleteProductVariant(id: number | string, token?: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/product-variants/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(extractErrorMessage(err, 'Không thể xóa biến thể sản phẩm'))
  }
}
