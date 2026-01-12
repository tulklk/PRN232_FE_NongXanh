export interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  total: number
  status: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  createdAt: string
}

export interface RevenueData {
  date: string
  revenue: number
}

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  role: 'admin' | 'customer'
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Voucher {
  id: string
  code: string
  name: string
  type: 'amount' | 'percent'
  value: number
  minOrder?: number
  maxDiscount?: number
  validFrom: string
  validTo: string
  status: 'public' | 'hidden'
}

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: '8397255',
    customer: {
      name: 'VinFast Charging Station',
      email: 'tulklk32@gmail.com',
    },
    total: 35000,
    status: 'processing',
    paymentStatus: 'pending',
    createdAt: '2026-01-06',
  },
  {
    id: '2',
    orderNumber: '1500950',
    customer: {
      name: 'Nguyễn văn a',
      email: 'pudo218@gmail.com',
    },
    total: 1680000,
    status: 'confirmed',
    paymentStatus: 'pending',
    createdAt: '2026-01-04',
  },
  {
    id: '3',
    orderNumber: '1234567',
    customer: {
      name: 'Trần Thị B',
      email: 'tranthi@example.com',
    },
    total: 580000,
    status: 'processing',
    paymentStatus: 'pending',
    createdAt: '2026-01-02',
  },
  {
    id: '4',
    orderNumber: '7654321',
    customer: {
      name: 'Lê Văn C',
      email: 'levan@example.com',
    },
    total: 1200000,
    status: 'processing',
    paymentStatus: 'paid',
    createdAt: '2026-01-01',
  },
]

export const mockRevenueData: RevenueData[] = [
  { date: '2025-12-25', revenue: 7000000 },
  { date: '2025-12-26', revenue: 18000000 },
  { date: '2025-12-27', revenue: 4500000 },
  { date: '2025-12-28', revenue: 3000000 },
  { date: '2025-12-29', revenue: 8500000 },
  { date: '2025-12-30', revenue: 6200000 },
  { date: '2026-01-01', revenue: 12000000 },
  { date: '2026-01-02', revenue: 2840000 },
  { date: '2026-01-04', revenue: 1680000 },
  { date: '2026-01-06', revenue: 3500000 },
]

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'loclhse172459@fpt.edu.vn',
    fullName: 'Le Hoang Loc (K17 HCM)',
    role: 'customer',
    status: 'active',
    createdAt: '2026-01-02',
  },
  {
    id: '2',
    email: 'admin@nongxanh.vn',
    fullName: 'Nông Xanh Shop',
    role: 'admin',
    status: 'active',
    createdAt: '2025-12-22',
  },
  {
    id: '3',
    email: 'customer@example.com',
    fullName: 'Nguyễn Văn Nam',
    phone: '0901234567',
    role: 'customer',
    status: 'active',
    createdAt: '2025-12-26',
  },
  {
    id: '4',
    email: 'tulklk32@gmail.com',
    fullName: 'Thành Tú',
    phone: '0902366610',
    role: 'customer',
    status: 'active',
    createdAt: '2025-12-23',
  },
  {
    id: '5',
    email: 'lamtuyen151004@gmail.com',
    fullName: 'Bé Bông Sữa cute',
    phone: '0987654321',
    role: 'customer',
    status: 'active',
    createdAt: '2025-12-28',
  },
]

export const mockVouchers: Voucher[] = [
  {
    id: '1',
    code: 'SALE50K',
    name: 'Giảm 50.000₫ mọi đơn hàng',
    type: 'amount',
    value: 50000,
    validFrom: '2025-12-29',
    validTo: '2026-01-10',
    status: 'public',
  },
  {
    id: '2',
    code: 'NEWYEAR2026',
    name: 'Ưu đãi Tết Dương Lịch 2026',
    type: 'percent',
    value: 15,
    validFrom: '2025-12-30',
    validTo: '2026-01-06',
    status: 'public',
  },
]

export const adminStats = {
  totalRevenue: 41895000,
  totalOrders: 91,
  totalProducts: 14,
  totalCategories: 3,
  processingOrders: 91,
  revenueGrowth: '+18%',
}
