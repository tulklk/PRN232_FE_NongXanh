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
  let list: ApiProductVariant[] = []
  if (Array.isArray(raw)) {
    list = raw
  } else if (raw && typeof raw === 'object') {
    const obj = raw as { data?: ApiProductVariant[]; items?: ApiProductVariant[] }
    list = obj.data ?? obj.items ?? []
  }
  if (productId != null && list.length > 0) {
    const pidStr = String(productId)
    list = list.filter((v) => {
      const vPid = v.productId
      return String(vPid) === pidStr || vPid === productId
    })
  }
  return list
}
