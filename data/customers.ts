export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  registeredAt: string
  totalOrders: number
  totalSpent: number
  status: 'active' | 'inactive'
  address?: string
}

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    phone: '0901234567',
    registeredAt: '2024-01-15',
    totalOrders: 12,
    totalSpent: 2500000,
    status: 'active',
    address: '123 Nguyễn Trãi, Q.1, TP.HCM',
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    email: 'tranthibinh@gmail.com',
    phone: '0912345678',
    registeredAt: '2024-02-20',
    totalOrders: 8,
    totalSpent: 1800000,
    status: 'active',
    address: '456 Lê Lợi, Q.3, TP.HCM',
  },
  {
    id: '3',
    name: 'Lê Văn Cường',
    email: 'levancuong@gmail.com',
    phone: '0923456789',
    registeredAt: '2024-03-10',
    totalOrders: 5,
    totalSpent: 950000,
    status: 'active',
    address: '789 Hai Bà Trưng, Q.1, TP.HCM',
  },
  {
    id: '4',
    name: 'Phạm Thị Dung',
    email: 'phamthidung@gmail.com',
    phone: '0934567890',
    registeredAt: '2024-04-05',
    totalOrders: 3,
    totalSpent: 650000,
    status: 'active',
    address: '321 Võ Văn Tần, Q.3, TP.HCM',
  },
  {
    id: '5',
    name: 'Hoàng Văn Em',
    email: 'hoangvanem@gmail.com',
    phone: '0945678901',
    registeredAt: '2024-05-12',
    totalOrders: 15,
    totalSpent: 3200000,
    status: 'active',
    address: '654 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
  },
  {
    id: '6',
    name: 'Vũ Thị Phương',
    email: 'vuthiphuong@gmail.com',
    phone: '0956789012',
    registeredAt: '2024-06-18',
    totalOrders: 7,
    totalSpent: 1450000,
    status: 'active',
    address: '987 Nguyễn Đình Chiểu, Q.3, TP.HCM',
  },
  {
    id: '7',
    name: 'Đỗ Văn Giang',
    email: 'dovangiang@gmail.com',
    phone: '0967890123',
    registeredAt: '2024-07-22',
    totalOrders: 2,
    totalSpent: 420000,
    status: 'inactive',
    address: '147 Trần Hưng Đạo, Q.5, TP.HCM',
  },
  {
    id: '8',
    name: 'Ngô Thị Hà',
    email: 'ngothiha@gmail.com',
    phone: '0978901234',
    registeredAt: '2024-08-30',
    totalOrders: 9,
    totalSpent: 1980000,
    status: 'active',
    address: '258 Cách Mạng Tháng 8, Q.10, TP.HCM',
  },
  {
    id: '9',
    name: 'Bùi Văn Hoàng',
    email: 'buivanhoang@gmail.com',
    phone: '0989012345',
    registeredAt: '2024-09-15',
    totalOrders: 6,
    totalSpent: 1320000,
    status: 'active',
    address: '369 Phan Đình Phùng, Q.Phú Nhuận, TP.HCM',
  },
  {
    id: '10',
    name: 'Đinh Thị Kim',
    email: 'dinhthikim@gmail.com',
    phone: '0990123456',
    registeredAt: '2024-10-08',
    totalOrders: 4,
    totalSpent: 850000,
    status: 'active',
    address: '741 Hoàng Sa, Q.3, TP.HCM',
  },
]
