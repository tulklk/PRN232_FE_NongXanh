// API Category structure
export interface ApiCategory {
  categoryId: number
  categoryName: string
  description?: string
  isDeleted?: boolean
  parentId?: number | null
  children?: ApiCategory[]
}

// API Product Image
export interface ApiProductImage {
  imageId: number
  imageUrl: string
  isPrimary?: boolean
}

// API Product structure
export interface ApiProduct {
  productId: number
  productName: string
  description?: string
  origin?: string
  unit?: string
  basePrice: number
  isOrganic?: boolean
  status?: string
  categoryId: number
  productImages?: ApiProductImage[]
  originalPrice?: number
  rating?: number
  reviewCount?: number
  salesCount?: number
  provider?: string
}

// API response wrappers
export interface ApiCategoriesResponse {
  success?: boolean
  message?: string
  data: ApiCategory[]
}

export interface ApiProductsResponse {
  success?: boolean
  message?: string
  data: {
    items: ApiProduct[]
    totalCount?: number
    pageNumber?: number
    pageSize?: number
    totalPages?: number
  }
}

export interface ApiProductDetailResponse {
  success?: boolean
  message?: string
  data?: ApiProduct
}

// API Voucher structure
export interface ApiVoucher {
  voucherId: number
  code?: string
  description?: string
  discountType?: string
  discountValue: number
  minOrderValue?: number
  maxDiscount?: number
  quantity?: number
  startDate?: string
  endDate?: string
  status?: string
}

export interface ApiVouchersPagedResponse {
  items: ApiVoucher[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages?: number
}

// API User structure (UserDto)
export interface ApiUser {
  id: string
  email?: string | null
  phoneNumber?: string | null
  displayName?: string | null
  provider?: string | null
  createdAt: string
  isActive: boolean
  role?: string | null
  lastLoginAt?: string | null
}

export interface ApiUsersPagedResponse {
  items: ApiUser[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages?: number
}
