export interface Product {
  id: string
  name: string
  seller: string
  image: string
  rating: number
  reviewCount: number
  salesCount: number
  currentPrice: number
  originalPrice?: number
  category: string
  description?: string
  specifications?: Record<string, string>
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Dừa Sọ Tươi Ngon - Size L (450gr UP) - Trái - FOODMAP Fruits',
    seller: 'FOODMAP FRUITS',
    image: '/images/coconut.jpg',
    rating: 5.0,
    reviewCount: 7,
    salesCount: 1324,
    currentPrice: 15000,
    originalPrice: 29000,
    category: 'fruits',
    description: 'Dừa Sọ Tươi Size L (450gr UP): Giải Khát Tiện Lợi, Nước Ngọt Thanh, Cơm Dẻo Dày',
    specifications: {
      'Thương hiệu': 'NONGXANH FRUITS',
      'Mã nhóm': 'G400050000326',
      'Mã sản phẩm': '400050000326',
      'Xuất xứ': 'Tiền Giang',
      'Hạn sử dụng': '20 ngày',
      'Thành phần': 'Dừa tươi gọt trọc',
      'Hướng dẫn sử dụng': 'Dùng làm thực phẩm',
      'Hướng dẫn bảo quản': 'Ngăn mát tủ lạnh',
    },
  },
  {
    id: '2',
    name: '[Trái] Sầu Riêng Musang King Miền Tây - Sượng bao đồi trê',
    seller: 'FOODMAP FRUITS',
    image: '/images/durian-musang.jpg',
    rating: 0,
    reviewCount: 0,
    salesCount: 273,
    currentPrice: 608000,
    originalPrice: 850000,
    category: 'fruits',
  },
  {
    id: '3',
    name: 'Trà Sữa Oolong Nương Trân Châu 3G - Maloca',
    seller: 'MALOCA',
    image: '/images/milk-tea.jpg',
    rating: 0,
    reviewCount: 0,
    salesCount: 777,
    currentPrice: 71960,
    category: 'tea-coffee',
  },
  {
    id: '4',
    name: 'Nước Tăng Lực RedBull Bò Húc Việt - Lon 250ml',
    seller: 'REDBULL',
    image: '/images/redbull.jpg',
    rating: 0,
    reviewCount: 0,
    salesCount: 777,
    currentPrice: 22880,
    category: 'drinks',
  },
  {
    id: '5',
    name: 'Hồng Treo Gió Đà Lạt Không Hạt - Đặc Sản Ngon Lành',
    seller: 'Đặc Sản Ngon Lành',
    image: '/images/persimmon.jpg',
    rating: 4.5,
    reviewCount: 80,
    salesCount: 500,
    currentPrice: 136000,
    originalPrice: 160000,
    category: 'specialties',
  },
  {
    id: '6',
    name: '[Trái] Sầu Riêng Ri6 Miền Tây - Sượng bao đổi trả',
    seller: 'VUA SẦU RIÊNG',
    image: '/images/durian-ri6.jpg',
    rating: 4.5,
    reviewCount: 28,
    salesCount: 1206,
    currentPrice: 299000,
    originalPrice: 412000,
    category: 'fruits',
  },
  {
    id: '7',
    name: '[Cơm] Sầu riêng Ri6 Tươi Tách Múi Sẵn - Sượng bao...',
    seller: 'VUA SẦU RIÊNG',
    image: '/images/durian-flesh.jpg',
    rating: 4.5,
    reviewCount: 56,
    salesCount: 13789,
    currentPrice: 109000,
    originalPrice: 163000,
    category: 'fruits',
  },
  {
    id: '8',
    name: 'Dầu Ăn Cooking Oil Nutri Plus Tường An',
    seller: 'TƯỜNG AN',
    image: '/images/cooking-oil.jpg',
    rating: 4.5,
    reviewCount: 0,
    salesCount: 200,
    currentPrice: 65000,
    originalPrice: 109000,
    category: 'groceries',
  },
]
