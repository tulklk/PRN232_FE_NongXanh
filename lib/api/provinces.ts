const BASE = 'https://provinces.open-api.vn/api/v2'

export interface Province {
  code: number
  name: string
}

export interface Ward {
  code: number
  name: string
  province_code?: number
}

export async function getProvinces(): Promise<Province[]> {
  const res = await fetch(`${BASE}/p/`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Không thể tải danh sách tỉnh/thành')
  const data = (await res.json()) as Province[]
  return Array.isArray(data) ? data : []
}

/** Lấy phường/xã theo tỉnh (API v2: 2 cấp Tỉnh -> Phường) */
export async function getWardsByProvince(provinceCode: number): Promise<Ward[]> {
  const res = await fetch(`${BASE}/w/?province=${provinceCode}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Không thể tải danh sách phường/xã')
  const data = (await res.json()) as Ward[]
  return Array.isArray(data) ? data : []
}
