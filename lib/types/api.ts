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
  /** Backend có thể trả providerId / ProviderId */
  providerId?: number | string
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

// API Provider structure
export interface ApiProvider {
  providerId: number | string
  providerName: string
  imageUrl?: string | null
  description?: string | null
  phoneNumber?: string | null
  ratingAverage?: number | null
  email?: string | null
  address?: string | null
  status?: string | null
  createdAt?: string | null
}

export interface ApiProvidersPagedResponse {
  items: ApiProvider[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages?: number
}

// API Cart structure
export interface ApiCartItem {
  /** BE có thể trả Guid string */
  cartItemId: number | string
  quantity: number
  priceAtTime: number
  subTotal: number
  cartId: number
  /** null nếu là combo */
  variantId: number | null
  variantName?: string | null
  productName?: string | null
  /** present nếu là combo */
  mealComboId?: string | null
  mealComboName?: string | null
  imageUrl?: string | null
}

export interface ApiCart {
  cartId: number
  totalAmount: number
  status?: string | null
  userId: string
  cartItems?: ApiCartItem[] | null
}

export interface AddCartItemRequest {
  variantId?: number | null
  mealComboId?: string
  quantity: number
}

export interface UpdateCartItemRequest {
  cartItemId: number | string
  quantity: number
}

// API Order structure
export interface ApiOrderDetail {
  orderDetailId: number
  quantity: number
  price: number
  subTotal: number
  orderId: number
  variantId: number | null
  variantName?: string | null
  productId?: string | number | null
  productName?: string | null
  productImageUrl?: string | null
  mealComboId?: string | null
  mealComboName?: string | null
  imageUrl?: string | null
}

export interface ApiOrder {
  orderId: number | string
  orderNumber?: string | null
  orderDate: string
  totalAmount: number
  shippingFee: number
  discountAmount: number
  finalAmount: number
  shippingAddress?: string | null
  status?: string | null
  vnPayStatus?: string | null
  userId: string
  displayName?: string | null
  customerDisplayName?: string | null
  customerEmail?: string | null
  customerPhoneNumber?: string | null
  orderDetails?: ApiOrderDetail[] | null
}

export interface CreateOrderDetailRequest {
  variantId: number
  quantity: number
}

export interface CreateOrderRequest {
  shippingFee?: number
  shippingAddress?: string | null
  userId?: string | null
  orderDetails?: CreateOrderDetailRequest[] | null
  voucherId?: number | null
}

export interface CheckoutPreviewRequest {
  /** BE Swagger: mảng string (Guid) */
  cartItemIds: (number | string)[]
  /** Mã phường/xã — buildCheckoutPreviewBody gửi `towardCode` (+ `toWardCode` dự phòng) */
  toWardCode: string
  provinceId: number
  /** Không bắt buộc (BE yêu cầu tùy phiên bản) */
  toDistrictId?: number
  insuranceValue?: number
  voucherCode?: string
}

export interface CheckoutPreviewResponse {
  shippingFee: number
  discountAmount: number
  totalAmount: number
  finalAmount: number
  [key: string]: unknown
}

export interface CheckoutOrderRequest {
  /** BE Swagger: mảng string (Guid) */
  cartItemIds: (number | string)[]
  shippingAddress: string
  shippingMethod: string
  paymentMethod: 'COD' | 'VNPay'
  recipientName: string
  recipientPhone: string
  /** Mã phường/xã — BE Swagger checkout: `toWardCode` */
  toWardCode: string
  provinceCode: string
  provinceId: number
  toDistrictId?: number
  insuranceValue?: number
  voucherCode?: string
}

export interface ShipmentInfo {
  [key: string]: unknown
}

export interface ApiOrdersPagedResponse {
  items: ApiOrder[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages?: number
}

// API Blog structure
export interface ApiBlog {
  blogId: string
  title: string
  content?: string | null
  description?: string | null
  thumbnailUrl?: string | null
  url?: string | null
  source?: string | null
  status?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  authorId?: string | null
  authorName?: string | null
}

export interface ApiBlogsPagedResponse {
  items: ApiBlog[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages?: number
}

// MealCombos / Weekly Basket suggestions
export interface MealComboSuggestionItem {
  productId: string
  productName: string
  quantity: number
  unit: string
  price: number
}

export interface MealComboSuggestion {
  mealComboId: string
  name: string
  description?: string | null
  basePrice: number
  items: MealComboSuggestionItem[]
}

// Subscriptions
export type SubscriptionFrequency = 'Weekly' | 'BiWeekly' | 'Every3Days'
export type SubscriptionPricingPolicy = 'FixedPrice' | 'MarketPrice'

export interface CreateSubscriptionRequest {
  frequency: SubscriptionFrequency
  shippingAddress: string
  recipientName: string
  recipientPhone: string
  pricingPolicy: SubscriptionPricingPolicy
  items: Array<{ productId: string; quantity: number }>
}

export interface SubscriptionModel {
  subscriptionId?: string | number
  id?: string | number
  frequency?: SubscriptionFrequency | string
  pricingPolicy?: SubscriptionPricingPolicy | string
  shippingAddress?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  status?: string | null
  nextDeliveryAt?: string | null
  createdAt?: string | null
  items?: Array<{ productId: string; productName?: string | null; quantity: number }>
  [k: string]: unknown
}

// Recipes
export interface RecipeIngredient {
  productId: string
  productName?: string | null
  quantity: number
  unit?: string | null
  price?: number | null
  [k: string]: unknown
}

export interface RecipeModel {
  recipeId?: string
  id?: string
  title?: string
  name?: string
  description?: string | null
  content?: string | null
  imageUrl?: string | null
  thumbnailUrl?: string | null
  createdAt?: string | null
  ingredients?: RecipeIngredient[] | null
  items?: RecipeIngredient[] | null
  [k: string]: unknown
}

// API Payment structure
export interface ApiPayment {
  paymentId: number
  paymentMethod?: string | null
  paymentStatus?: string | null
  paidAt?: string | null
  orderId: number
}

export interface CreatePaymentRequest {
  paymentMethod?: string | null
  orderId: number | string
}

// API ProductVariant structure
export interface ApiProductVariant {
  variantId: number
  variantName: string
  price: number
  stockQuantity: number
  sku?: string | null
  status?: string | null
  productId: number
  product?: ApiProduct | null
  isDeleted?: boolean
}

// API Wishlist structure
export interface ApiWishlistItem {
  wishlistId?: number | string
  userId?: string | null
  productId: number | string
  productName?: string | null
  imageUrl?: string | null
  price?: number | null
  originalPrice?: number | null
  product?: ApiProduct | null
}

export interface ApiWishlistListResponse {
  items?: ApiWishlistItem[]
  data?: ApiWishlistItem[] | { items?: ApiWishlistItem[] }
}

export interface AddWishlistRequest {
  productId: number | string
}
