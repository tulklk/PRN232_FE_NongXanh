export const NAVIGATION_LINKS = [
  { label: 'DANH MỤC SẢN PHẨM', href: '/products' },
  { label: 'ĐI CHỢ ONLINE', href: '/products' },
  { label: 'TRÁI CÂY', href: '/products?category=fruits' },
  { label: 'TRÀ - CÀ PHÊ', href: '/products?category=tea-coffee' },
  { label: 'ĐẶC SẢN', href: '/products?category=specialties' },
  { label: 'AGRISHOW', href: '/agrishow' },
  { label: 'MY FARM', href: '/my-farm' },
]

export const ACCOUNT_LINKS = [
  { label: 'Tài khoản của tôi', href: '/account' },
  { label: 'Điểm thưởng của bạn', href: '/account/rewards' },
  { label: 'Giỏ hàng', href: '/cart' },
]

export const INFO_LINKS = [
  { label: 'Về Nông Xanh', href: '/about' },
  { label: 'Điều khoản và điều kiện sử dụng', href: '/terms' },
  { label: 'Chính sách bảo mật thông tin', href: '/privacy' },
  { label: 'Xuất khẩu/Export', href: '/export' },
  { label: 'Tuyển dụng', href: '/careers' },
  { label: 'Dự án Nông sản Việt', href: '/projects' },
  { label: 'Nông Xanh CSR', href: '/csr' },
  { label: 'My Farm', href: '/my-farm' },
]

export const SUPPORT_LINKS = [
  { label: 'Phương thức thanh toán', href: '/support/payment' },
  { label: 'Vận chuyển, giao nhận và kiểm hàng', href: '/support/shipping' },
  { label: 'Chính sách đổi trả và hoàn tiền', href: '/support/returns' },
  { label: 'Liên hệ', href: '/contact' },
]

export const COMPANY_INFO = {
  name: 'CÔNG TY TNHH NÔNG SẢN NÔNG XANH',
  registeredAddress: 'Tầng 1, Tòa nhà số 109-111, Đường D8, KDC Trung Sơn, Xã Bình Hưng, Thành phố Hồ Chí Minh, Việt Nam',
  contactAddress: '262/3 Lũy Bán Bích, Phường Tân Phú, Thành phố Hồ Chí Minh, Việt Nam',
  warehouseAddress: '284/11 Lũy Bán Bích, Phường Tân Phú, Thành phố Hồ Chí Minh, Việt Nam',
  email: 'info@nongxanh.vn',
  hotline: '1800 1234',
  businessLicense: 'Giấy chứng nhận Đăng ký Kinh doanh số 0314580854 do Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh cấp ngày 24/08/2017',
  foodSafetyLicense: 'Giấy chứng nhận Cơ sở đủ điều kiện an toàn thực phẩm số 191/2025/SATTP-HCM ngày 14/07/2005 được cấp bởi Sở An Toàn Thực Phẩm Thành Phố Hồ Chí Minh',
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'bestseller', label: 'Bán chạy' },
  { value: 'price-low', label: 'Giá từ thấp đến cao' },
  { value: 'price-high', label: 'Giá từ cao đến thấp' },
]

export const PRICE_RANGES = [
  { min: 20000, max: 50000, label: '20.000 - 50.000' },
  { min: 50000, max: 100000, label: '50.000 - 100.000' },
  { min: 100000, max: 200000, label: '100.000 - 200.000' },
  { min: 200000, max: 500000, label: '200.000 - 500.000' },
  { min: 500000, max: 1000000, label: '500.000 - 1 triệu đồng' },
]

export const DELIVERY_METHODS = [
  {
    id: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    price: 35000,
    estimatedDays: 3,
  },
  {
    id: 'fast',
    name: 'Giao hàng nhanh',
    price: 45000,
    estimatedDays: 1,
  },
]

export const PAYMENT_METHODS = [
  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: 'truck' },
  { id: 'bank', name: 'Chuyển khoản - Mua trước trả sau', icon: 'bank' },
  { id: 'atm', name: 'Thẻ ATM/Internet Banking', icon: 'card' },
  { id: 'momo', name: 'Ví điện tử MoMo', icon: 'wallet' },
]
