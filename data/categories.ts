export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string
}

export const categories: Category[] = [
  { id: '1', name: 'Đi chợ online', slug: 'market' },
  { id: '2', name: 'Trái cây tươi ngon', slug: 'fruits', parentId: '1' },
  { id: '3', name: 'Trái cây nội địa', slug: 'local-fruits', parentId: '2' },
  { id: '4', name: 'Trái cây sấy', slug: 'dried-fruits', parentId: '2' },
  { id: '5', name: 'Đặc sản vùng miền', slug: 'specialties', parentId: '1' },
  { id: '6', name: 'Trà - Cà phê - Socola', slug: 'tea-coffee', parentId: '1' },
  { id: '7', name: 'Đồ uống có cồn', slug: 'alcoholic-drinks', parentId: '1' },
  { id: '8', name: 'Đồ uống', slug: 'drinks', parentId: '1' },
  { id: '9', name: 'Ăn vặt', slug: 'snacks', parentId: '1' },
]
