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

function parseDataArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (raw && typeof raw === 'object') {
    const o = raw as { data?: T[]; items?: T[] }
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.items)) return o.items
  }
  return []
}

export interface LocationProvince {
  provinceId: number
  provinceName: string
  code: string
}

export interface LocationDistrict {
  districtId: number
  provinceId: number
  districtName: string
  code: string
}

export interface LocationWard {
  wardId?: number
  districtId?: number
  districtName?: string
  wardName?: string
  /** Một số payload backend dùng `name` */
  name?: string
  code?: string
  wardCode?: string
}

function normalizeProvince(raw: Record<string, unknown>): LocationProvince | null {
  const provinceId = Number(
    raw.provinceId ?? raw.ProvinceId ?? raw.id ?? raw.Id
  )
  if (!Number.isFinite(provinceId)) return null
  const provinceName = String(
    raw.provinceName ?? raw.ProvinceName ?? raw.name ?? ''
  )
  const code = String(raw.code ?? raw.Code ?? '')
  return { provinceId, provinceName, code }
}

function normalizeDistrict(raw: Record<string, unknown>): LocationDistrict | null {
  const districtId = Number(raw.districtId ?? raw.DistrictId)
  const provinceId = Number(raw.provinceId ?? raw.ProvinceId)
  if (!Number.isFinite(districtId)) return null
  const districtName = String(
    raw.districtName ?? raw.DistrictName ?? raw.name ?? ''
  )
  const code = String(raw.code ?? raw.Code ?? '')
  return { districtId, districtName, provinceId: Number.isFinite(provinceId) ? provinceId : 0, code }
}

function normalizeWard(raw: Record<string, unknown>): LocationWard | null {
  const code = raw.wardCode ?? raw.WardCode ?? raw.code ?? raw.Code
  const c = code != null && code !== '' ? String(code) : ''
  if (!c) return null
  const wardName = String(
    raw.wardName ?? raw.WardName ?? raw.name ?? raw.Name ?? ''
  )
  const wardId = raw.wardId ?? raw.WardId
  const districtFromObj =
    raw.district ?? raw.District ?? (raw as { district?: unknown }).district
  const districtId =
    raw.districtId ?? raw.DistrictId ?? (districtFromObj as any)?.districtId
  const districtName = String(
    raw.districtName ??
      raw.DistrictName ??
      (districtFromObj as any)?.districtName ??
      (districtFromObj as any)?.DistrictName ??
      ''
  )
  return {
    code: c,
    wardName: wardName || c,
    wardId: wardId != null ? Number(wardId) : undefined,
    districtId: districtId != null ? Number(districtId) : undefined,
    districtName: districtName || undefined,
  }
}

/** Mã phường/xã gửi GHN (toWardCode) */
export function getWardToCode(ward: LocationWard): string {
  return String(ward.code ?? ward.wardCode ?? '')
}

export function getWardDisplayName(ward: LocationWard): string {
  return ward.wardName ?? ward.name ?? getWardToCode(ward)
}

export async function fetchLocationProvinces(token?: string): Promise<LocationProvince[]> {
  const res = await fetch(`${getBase()}/api/locations/provinces`, {
    headers: getHeaders(token),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải danh sách tỉnh/thành'
    )
  }
  const json = await res.json()
  const arr = parseDataArray<Record<string, unknown>>(json)
  const list: LocationProvince[] = []
  for (const row of arr) {
    const p = normalizeProvince(row)
    if (p) list.push(p)
  }
  return list.sort((a, b) => a.provinceName.localeCompare(b.provinceName, 'vi'))
}

export async function fetchLocationDistricts(
  provinceId: number | string,
  token?: string
): Promise<LocationDistrict[]> {
  const res = await fetch(
    `${getBase()}/api/locations/districts?provinceId=${encodeURIComponent(String(provinceId))}`,
    { headers: getHeaders(token) }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải danh sách quận/huyện'
    )
  }
  const json = await res.json()
  const arr = parseDataArray<Record<string, unknown>>(json)
  const list: LocationDistrict[] = []
  for (const row of arr) {
    const d = normalizeDistrict(row)
    if (d) list.push(d)
  }
  return list.sort((a, b) => a.districtName.localeCompare(b.districtName, 'vi'))
}

export async function fetchLocationWards(
  provinceId: number | string,
  token?: string
): Promise<LocationWard[]> {
  const res = await fetch(
    `${getBase()}/api/locations/wards?provinceId=${encodeURIComponent(String(provinceId))}`,
    { headers: getHeaders(token) }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(
      (err as { error?: string }).error || 'Không thể tải danh sách phường/xã'
    )
  }
  const json = await res.json()
  const arr = parseDataArray<Record<string, unknown>>(json)
  const list: LocationWard[] = []
  for (const row of arr) {
    const w = normalizeWard(row)
    if (w) list.push(w)
  }
  return list.sort((a, b) =>
    getWardDisplayName(a).localeCompare(getWardDisplayName(b), 'vi')
  )
}
