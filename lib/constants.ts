export const NAVIGATION_LINKS = [
  { label: 'DANH MỤC SẢN PHẨM', href: '/products' },
  { label: 'ĐI CHỢ ONLINE', href: '/products' },
  { label: 'TRÁI CÂY', href: '/products' },
  { label: 'TRÀ - CÀ PHÊ', href: '/products' },
  { label: 'ĐẶC SẢN', href: '/products' },
  { label: 'Tin tức', href: '/news' },
  { label: 'Liên hệ', href: '/contact' },
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
  { label: 'Liên hệ', href: '/contact' },
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

/** Khoảng giá lọc sidebar; `max: null` = không giới hạn trên */
export interface PriceRangeOption {
  min: number
  max: number | null
  label: string
}

export const PRICE_RANGES: PriceRangeOption[] = [
  { min: 0, max: 30_000, label: 'Dưới 30.000 đ' },
  { min: 30_000, max: 100_000, label: '30.000 – 100.000 đ' },
  { min: 100_000, max: 300_000, label: '100.000 – 300.000 đ' },
  { min: 300_000, max: 1_000_000, label: '300.000 – 1.000.000 đ' },
  { min: 1_000_000, max: null, label: 'Trên 1.000.000 đ' },
]

export const FIXED_SHIPPING_FEE = 35000

export const PAYMENT_METHODS = [
  { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', icon: 'truck' },
  { id: 'vnpay', name: 'Thanh toán qua VNPay', icon: 'bank' },
]
