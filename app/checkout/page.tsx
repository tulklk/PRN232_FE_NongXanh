'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Truck, CreditCard, Wallet, Building2, X } from 'lucide-react'
import {
  formatCurrency,
  formatPhoneNumber,
  normalizePhoneNumber,
  calculateVoucherDiscount,
  formatDate,
} from '@/lib/utils'
import { FIXED_SHIPPING_FEE, PAYMENT_METHODS } from '@/lib/constants'
import { useCart } from '@/contexts/CartContext'
import { useUser } from '@/contexts/UserContext'
import {
  createOrder,
  checkoutOrder,
  previewCheckout,
} from '@/lib/api/orders'
import { createSubscription } from '@/lib/api/subscriptions'
import { getVoucherByCode, getVouchers } from '@/lib/api/vouchers'
import type { ApiVoucher, CheckoutPreviewResponse } from '@/lib/types/api'
import { createPayment, createVNPayPaymentUrl } from '@/lib/api/payments'
import {
  fetchLocationProvinces,
  fetchLocationDistricts,
  fetchLocationWards,
  getWardToCode,
  getWardDisplayName,
  type LocationProvince,
  type LocationDistrict,
  type LocationWard,
} from '@/lib/api/locations'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, tokens, isAuthenticated } = useUser()
  const { cart, clearCart } = useCart()

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    provinceId: '',
    provinceCode: '',
    districtId: '',
    districtCode: '',
    wardCode: '',
    address: '',
    addressType: 'home',
  })
  const [locationProvinces, setLocationProvinces] = useState<LocationProvince[]>([])
  const [locationWards, setLocationWards] = useState<LocationWard[]>([])
  const [locationDistricts, setLocationDistricts] = useState<LocationDistrict[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(true)
  const [loadingWards, setLoadingWards] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>(
    'express'
  )
  const [isSubscription, setIsSubscription] = useState(false)
  const [subscriptionFrequency, setSubscriptionFrequency] = useState<
    'Weekly' | 'BiWeekly' | 'Every3Days'
  >('Weekly')
  const [subscriptionPricingPolicy, setSubscriptionPricingPolicy] = useState<
    'FixedPrice' | 'MarketPrice'
  >('MarketPrice')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<ApiVoucher | null>(null)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherPanelOpen, setVoucherPanelOpen] = useState(false)
  const [panelVouchers, setPanelVouchers] = useState<ApiVoucher[]>([])
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [shippingFee, setShippingFee] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalAmount, setFinalAmount] = useState(0)

  const cartItems = useMemo(() => cart?.cartItems ?? [], [cart?.cartItems])
  const previewCacheRef = useRef<Map<string, CheckoutPreviewResponse>>(new Map())
  const cartItemIds = useMemo(
    () => cartItems.map((i) => i.cartItemId).filter(Boolean),
    [cartItems]
  )
  const cartItemIdsKey = useMemo(() => cartItemIds.join(','), [cartItemIds])
  const subtotal = cart?.totalAmount ?? 0
  const total = finalAmount > 0 ? finalAmount : subtotal + shippingFee - discountAmount

  const handleApplyVoucher = async () => {
    const code = discountCode.trim()
    if (!code) {
      setVoucherError('Vui lòng nhập mã')
      return
    }
    setVoucherLoading(true)
    setVoucherError(null)
    try {
      const voucher = await getVoucherByCode(code, tokens?.idToken ?? undefined)
      if (!voucher) {
        setVoucherError('Mã giảm giá không hợp lệ hoặc đã hết hạn')
        setAppliedVoucher(null)
        return
      }
      const discount = calculateVoucherDiscount(voucher, subtotal, shippingFee)
      const minOrder = voucher.minOrderValue ?? 0
      if (discount === 0 && minOrder > 0 && subtotal < minOrder) {
        setVoucherError('Đơn hàng chưa đủ điều kiện áp dụng mã')
        setAppliedVoucher(null)
        return
      }
      setAppliedVoucher(voucher)
      setVoucherError(null)
    } catch {
      setVoucherError('Mã giảm giá không hợp lệ hoặc đã hết hạn')
      setAppliedVoucher(null)
    } finally {
      setVoucherLoading(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherError(null)
    setDiscountCode('')
  }

  function isPublicVoucher(status?: string): boolean {
    return ['active', 'public'].includes((status ?? '').toLowerCase())
  }

  const applyVoucherFromPanel = (v: ApiVoucher) => {
    setAppliedVoucher(v)
    setDiscountCode(v.code ?? '')
    setVoucherError(null)
    setVoucherPanelOpen(false)
  }

  useEffect(() => {
    if (shippingMethod !== 'express') {
      const fallbackDiscount = appliedVoucher
        ? calculateVoucherDiscount(appliedVoucher, subtotal, FIXED_SHIPPING_FEE)
        : 0
      setShippingFee(FIXED_SHIPPING_FEE)
      setDiscountAmount(fallbackDiscount)
      setFinalAmount(subtotal + FIXED_SHIPPING_FEE - fallbackDiscount)
      setPreviewError(null)
      setPreviewLoading(false)
      return
    }

    // Bắt buộc đủ tỉnh + quận + phường để backend GHN tính được cước
    if (
      cartItemIds.length === 0 ||
      !formData.districtId ||
      !formData.wardCode ||
      !formData.provinceId
    ) {
      const fallbackDiscount = appliedVoucher
        ? calculateVoucherDiscount(appliedVoucher, subtotal, 0)
        : 0
      setShippingFee(0)
      setDiscountAmount(fallbackDiscount)
      setFinalAmount(subtotal - fallbackDiscount)
      setPreviewError(null)
      setPreviewLoading(false)
      return
    }
    if (!tokens?.idToken) {
      setPreviewLoading(false)
      return
    }

    const voucherRaw = (appliedVoucher?.code ?? discountCode).trim()
    const voucherCode = voucherRaw
    const provinceNumericId = Math.trunc(Number(formData.provinceId))
    const districtNumericId = Math.trunc(Number(formData.districtId))
    const wardCodeForGhn = String(formData.wardCode).trim()

    const previewKey = `${cartItemIdsKey}|${provinceNumericId}|${districtNumericId}|${wardCodeForGhn}|${voucherCode}`
    const cached = previewCacheRef.current.get(previewKey)
    if (cached) {
      setShippingFee(Number.isFinite(cached.shippingFee) ? cached.shippingFee : 0)
      setDiscountAmount(
        Number.isFinite(cached.discountAmount) ? cached.discountAmount : 0
      )
      setFinalAmount(Number.isFinite(cached.finalAmount) ? cached.finalAmount : subtotal)
      setPreviewError(null)
      setPreviewLoading(false)
      return
    }

    let cancelled = false
    const controller = new AbortController()

    // Debounce để tránh bắn GHN liên tục khi user đang đổi quận/phường hoặc state cập nhật nhiều lần
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    setPreviewLoading(true)
    setPreviewError(null)

    timeoutId = setTimeout(() => {
      previewCheckout(
        {
          cartItemIds,
          toWardCode: wardCodeForGhn,
          provinceId: provinceNumericId,
          toDistrictId: districtNumericId,
          insuranceValue: 0,
          voucherCode,
        },
        tokens.idToken,
        { signal: controller.signal }
      )
        .then((res) => {
          if (cancelled) return
          const shipping = Number((res as any).shippingFee ?? 0)
          const discount = Number((res as any).discountAmount ?? 0)
          const final = Number(
            (res as any).finalAmount ?? subtotal + shipping - discount
          )
          setShippingFee(Number.isFinite(shipping) ? shipping : 0)
          setDiscountAmount(Number.isFinite(discount) ? discount : 0)
          setFinalAmount(
            Number.isFinite(final) ? final : subtotal + shipping - discount
          )
          // Cache để lần sau đổi qua lại địa chỉ/voucher không phải gọi GHN lại
          previewCacheRef.current.set(
            previewKey,
            res as unknown as CheckoutPreviewResponse
          )
        })
        .catch((err) => {
          if (cancelled) return
          // Abort do effect re-run: bỏ qua để không làm UI “giật” / hiển thị lỗi giả
          if (err && typeof err === 'object' && 'name' in (err as any)) {
            if ((err as any).name === 'AbortError') return
          }
          setPreviewError(
            err instanceof Error ? err.message : 'Không thể tính phí giao hàng'
          )
          setShippingFee(0)
          setDiscountAmount(0)
          setFinalAmount(subtotal)
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false)
        })
    }, 400)

    return () => {
      cancelled = true
      controller.abort()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [
    cartItemIdsKey,
    cartItemIds,
    formData.districtId,
    formData.wardCode,
    formData.provinceId,
    appliedVoucher,
    discountCode,
    shippingMethod,
    tokens?.idToken,
    subtotal,
  ])

  useEffect(() => {
    if (!voucherPanelOpen) return
    setPanelLoading(true)
    setPanelError(null)
    getVouchers(1, 100, tokens?.idToken ?? undefined)
      .then((items) => {
        setPanelVouchers(items.filter((v) => isPublicVoucher(v.status)))
      })
      .catch(() => {
        setPanelError('Không thể tải danh sách mã giảm giá')
        setPanelVouchers([])
      })
      .finally(() => setPanelLoading(false))
  }, [voucherPanelOpen, tokens?.idToken])

  const hasInitializedForm = useRef(false)
  useEffect(() => {
    if (user && isAuthenticated && !hasInitializedForm.current) {
      hasInitializedForm.current = true
      setFormData((prev) => ({
        ...prev,
        fullName: user.displayName ?? prev.fullName,
        phone: formatPhoneNumber(user.phoneNumber ?? '') || prev.phone,
        email: user.email ?? prev.email,
      }))
    }
  }, [user, isAuthenticated])

  useEffect(() => {
    let cancelled = false
    setLoadingProvinces(true)
    fetchLocationProvinces(tokens?.idToken)
      .then((data) => {
        if (!cancelled) setLocationProvinces(data)
      })
      .catch(() => {
        if (!cancelled) setLocationProvinces([])
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false)
      })
    return () => {
      cancelled = true
    }
  }, [tokens?.idToken])

  useEffect(() => {
    if (!formData.provinceId) {
      setLocationDistricts([])
      setLocationWards([])
      setFormData((prev) =>
        prev.districtId || prev.districtCode || prev.wardCode
          ? { ...prev, districtId: '', districtCode: '', wardCode: '' }
          : prev
      )
      return
    }

    let cancelled = false
    setLoadingDistricts(true)

    // Đổi tỉnh -> reset district/ward để preview/checkout không dùng dữ liệu cũ
    setFormData((prev) => ({
      ...prev,
      districtId: '',
      districtCode: '',
      wardCode: '',
    }))
    setLocationDistricts([])
    setLocationWards([])

    fetchLocationDistricts(formData.provinceId, tokens?.idToken)
      .then((districts) => {
        if (!cancelled) {
          setLocationDistricts(districts)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationDistricts([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDistricts(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ load lại khi đổi tỉnh; token lấy từ closure
  }, [formData.provinceId])

  useEffect(() => {
    if (!formData.districtId) {
      setLocationWards([])
      setLoadingWards(false)
      setFormData((prev) =>
        prev.wardCode ? { ...prev, wardCode: '' } : prev
      )
      return
    }

    let cancelled = false
    setLoadingWards(true)
    setLocationWards([])
    setFormData((prev) => ({ ...prev, wardCode: '' }))

    fetchLocationWards(formData.districtId, tokens?.idToken)
      .then((wards) => {
        if (!cancelled) setLocationWards(wards)
      })
      .catch(() => {
        if (!cancelled) setLocationWards([])
      })
      .finally(() => {
        if (!cancelled) setLoadingWards(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ load lại khi đổi quận/huyện
  }, [formData.districtId])

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <p className="text-gray-600 mb-4">
            Vui lòng đăng nhập để tiến hành thanh toán
          </p>
          <Link
            href="/login"
            className="inline-block bg-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-green-dark"
          >
            ĐĂNG NHẬP
          </Link>
        </div>
      </div>
    )
  }

  if (!tokens?.idToken || !user?.userId) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart || cartItems.length === 0) {
      setSubmitError('Giỏ hàng trống')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const provinceName =
        locationProvinces.find((p) => String(p.provinceId) === formData.provinceId)
          ?.provinceName ?? formData.provinceId
      const wardMatch = locationWards.find(
        (w) => getWardToCode(w) === formData.wardCode
      )
      const districtIdFromWard =
        wardMatch?.districtId != null ? String(wardMatch.districtId) : ''
      const districtIdToUse = formData.districtId || districtIdFromWard
      const districtObj = locationDistricts.find(
        (d) => String(d.districtId) === districtIdToUse
      )
      const districtName =
        districtObj?.districtName ?? wardMatch?.districtName ?? ''
      const wardName = wardMatch
        ? getWardDisplayName(wardMatch)
        : formData.wardCode
      const shippingAddress = [
        formData.fullName,
        normalizePhoneNumber(formData.phone) || formData.phone,
        formData.address,
        wardName,
        districtName,
        provinceName,
      ]
        .filter(Boolean)
        .join(', ')

      const voucherCode =
        (appliedVoucher?.code ?? discountCode.trim()) || ''

      if (isSubscription) {
        const hasCombo = cartItems.some((i) => !!(i as any).mealComboId)
        if (hasCombo) {
          throw new Error('Giỏ hàng có Combo nên chưa thể đăng ký giao hàng định kỳ.')
        }
        const subItems = cartItems.map((item) => {
          const raw = item as unknown as Record<string, unknown>
          const productId =
            (raw.productId ?? raw.ProductId ?? raw.productID ?? raw.ProductID) as
              | string
              | number
              | null
              | undefined
          if (productId == null || String(productId).trim() === '') {
            throw new Error(
              'Không lấy được productId từ giỏ hàng để tạo Subscription. Vui lòng thử lại hoặc chọn mua 1 lần.'
            )
          }
          return { productId: String(productId), quantity: item.quantity }
        })

        await createSubscription(
          {
            frequency: subscriptionFrequency,
            pricingPolicy: subscriptionPricingPolicy,
            shippingAddress: shippingAddress || '',
            recipientName: formData.fullName,
            recipientPhone: normalizePhoneNumber(formData.phone) || formData.phone,
            items: subItems,
          },
          tokens.idToken
        )

        await clearCart()
        router.push('/account/subscriptions')
        return
      }
      let order
      if (shippingMethod === 'express') {
        const districtNumericId = Math.trunc(Number(formData.districtId))
        const wardCodeForGhn = String(formData.wardCode).trim()

        if (
          !formData.provinceId ||
          !formData.districtId ||
          !wardCodeForGhn ||
          !Number.isFinite(districtNumericId) ||
          districtNumericId <= 0
        ) {
          setSubmitError(
            'Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện và phường/xã'
          )
          setSubmitting(false)
          return
        }

        const expressCartIds = cartItems.map((item) => item.cartItemId)
        order = await checkoutOrder(
          {
            cartItemIds: expressCartIds,
            shippingAddress: shippingAddress || '',
            shippingMethod: 'EXPRESS',
            paymentMethod: paymentMethod === 'cod' ? 'COD' : 'VNPay',
            recipientName: formData.fullName,
            recipientPhone: normalizePhoneNumber(formData.phone) || formData.phone,
            toWardCode: formData.wardCode,
            provinceCode: formData.provinceCode,
            provinceId: Number(formData.provinceId),
            toDistrictId: districtNumericId,
            insuranceValue: 0,
            voucherCode,
          },
          tokens.idToken
        )
      } else {
        const hasCombo = cartItems.some((i) => !!(i as any).mealComboId)
        const hasNullVariant = cartItems.some((i) => (i as any).variantId == null)

        // Nếu có combo (hoặc item không có variantId), phải checkout theo cartItemIds để BE xử lý.
        if (hasCombo || hasNullVariant) {
          const districtNumericId = Math.trunc(Number(formData.districtId || districtIdFromWard))
          order = await checkoutOrder(
            {
              cartItemIds,
              shippingAddress: shippingAddress || '',
              shippingMethod: 'STANDARD',
              paymentMethod: paymentMethod === 'cod' ? 'COD' : 'VNPay',
              recipientName: formData.fullName,
              recipientPhone: normalizePhoneNumber(formData.phone) || formData.phone,
              toWardCode: formData.wardCode,
              provinceCode: formData.provinceCode,
              provinceId: Number(formData.provinceId),
              ...(Number.isFinite(districtNumericId) && districtNumericId > 0
                ? { toDistrictId: districtNumericId }
                : {}),
              insuranceValue: 0,
              voucherCode,
            },
            tokens.idToken
          )
        } else {
          const orderDetails = cartItems.map((item) => ({
            variantId: item.variantId as number,
            quantity: item.quantity,
          }))
          order = await createOrder(
            {
              shippingFee: FIXED_SHIPPING_FEE,
              shippingAddress: shippingAddress || undefined,
              userId: user.userId,
              orderDetails,
              voucherId: appliedVoucher?.voucherId ?? undefined,
            },
            tokens.idToken
          )
        }
      }

      const resolvedOrderId = order?.orderId != null ? String(order.orderId) : ''
      if (!resolvedOrderId) {
        throw new Error('Không lấy được orderId để tạo thanh toán VNPay')
      }

      if (paymentMethod === 'vnpay') {
        const { paymentUrl } = await createVNPayPaymentUrl(
          {
            orderId: resolvedOrderId,
            clientIp: '',
          },
          tokens.idToken
        )
        await clearCart()
        window.location.href = paymentUrl
        return
      }

      const isOnlinePayment = paymentMethod !== 'cod'
      if (isOnlinePayment) {
        await createPayment(
          {
            paymentMethod,
            orderId: order.orderId,
          },
          tokens.idToken
        )
      }

      await clearCart()
      const orderNumber = order.orderNumber ?? String(order.orderId)
      router.push(`/checkout/success?orderId=${order.orderId}&orderNumber=${encodeURIComponent(orderNumber)}`)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Không thể tạo đơn hàng'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-primary-green hover:underline mb-6"
        >
          <ArrowLeft size={20} />
          QUAY LẠI
        </Link>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {submitError}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 sm:p-12 text-center">
            <p className="text-gray-600 mb-4">Giỏ hàng trống</p>
            <Link
              href="/products"
              className="inline-block bg-primary-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-green-dark"
            >
              TIẾP TỤC MUA SẮM
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Subscription toggle */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Hình thức mua hàng
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Đăng ký giao hàng định kỳ
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        FixedPrice: giữ giá tại thời điểm đăng ký. MarketPrice: áp dụng giá thị trường tại ngày giao.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSubscription}
                        onChange={(e) => setIsSubscription(e.target.checked)}
                        className="h-4 w-4 accent-[#0A923C]"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {isSubscription ? 'Đang bật' : 'Tắt'}
                      </span>
                    </label>
                  </div>

                  {isSubscription && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Tần suất
                        </label>
                        <select
                          value={subscriptionFrequency}
                          onChange={(e) =>
                            setSubscriptionFrequency(
                              e.target.value as 'Weekly' | 'BiWeekly' | 'Every3Days'
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                        >
                          <option value="Weekly">Hàng tuần</option>
                          <option value="BiWeekly">2 tuần / lần</option>
                          <option value="Every3Days">3 ngày / lần</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Chính sách giá
                        </label>
                        <select
                          value={subscriptionPricingPolicy}
                          onChange={(e) =>
                            setSubscriptionPricingPolicy(
                              e.target.value as 'FixedPrice' | 'MarketPrice'
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                        >
                          <option value="MarketPrice">MarketPrice (giá thị trường)</option>
                          <option value="FixedPrice">FixedPrice (giữ giá)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Information */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl font-bold mb-4">Thông tin nhận hàng</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Đăng nhập để nhận được thông báo về tình trạng đơn hàng
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Họ Tên</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v) setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(v) }))
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Tỉnh/Thành phố</label>
                      <select
                        required
                        value={formData.provinceId}
                        onChange={(e) => {
                          const id = e.target.value
                          const p = locationProvinces.find(
                            (x) => String(x.provinceId) === id
                          )
                          setFormData({
                            ...formData,
                            provinceId: id,
                            provinceCode: p?.code ?? '',
                            districtId: '',
                            districtCode: '',
                            wardCode: '',
                          })
                        }}
                        disabled={loadingProvinces}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green disabled:opacity-60"
                      >
                        <option value="">
                          {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành'}
                        </option>
                        {locationProvinces.map((p) => (
                          <option key={p.provinceId} value={String(p.provinceId)}>
                            {p.provinceName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Quận/Huyện</label>
                      <select
                        required={shippingMethod === 'express'}
                        value={formData.districtId}
                        onChange={(e) => {
                          const id = e.target.value
                          const d = locationDistricts.find(
                            (x) => String(x.districtId) === id
                          )
                          setFormData({
                            ...formData,
                            districtId: id,
                            districtCode: d?.code ?? '',
                            wardCode: '',
                          })
                        }}
                        disabled={!formData.provinceId || loadingDistricts}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green disabled:opacity-60"
                      >
                        <option value="">
                          {!formData.provinceId
                            ? 'Chọn tỉnh trước'
                            : loadingDistricts
                              ? 'Đang tải...'
                              : 'Chọn quận/huyện'}
                        </option>
                        {locationDistricts.map((d) => (
                          <option key={d.districtId} value={String(d.districtId)}>
                            {d.districtName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Phường/Xã</label>
                      <select
                        required
                        value={formData.wardCode}
                        onChange={(e) => {
                          const code = e.target.value
                          const wardMatch = locationWards.find(
                            (w) => getWardToCode(w) === code
                          )
                          const districtIdFromWard =
                            wardMatch?.districtId != null
                              ? String(wardMatch.districtId)
                              : formData.districtId
                          const districtObj = locationDistricts.find(
                            (d) => String(d.districtId) === districtIdFromWard
                          )
                          setFormData({
                            ...formData,
                            wardCode: code,
                            districtId: districtIdFromWard,
                            districtCode: districtObj?.code ?? '',
                          })
                        }}
                        disabled={!formData.districtId || loadingWards}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green disabled:opacity-60"
                      >
                        <option value="">
                          {!formData.districtId
                            ? 'Chọn quận/huyện trước'
                            : loadingWards
                              ? 'Đang tải...'
                              : 'Chọn phường/xã'}
                        </option>
                        {locationWards.map((w, idx) => {
                          const code = getWardToCode(w)
                          return (
                            <option key={`${code}-${idx}`} value={code}>
                              {getWardDisplayName(w)}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Địa chỉ</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
                    />
                  </div>

                  {/* Removed address type selector (home/office) */}
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl font-bold mb-4">Phương thức giao hàng</h2>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                        shippingMethod === 'express'
                          ? 'border-primary-green bg-primary-green-light'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value="express"
                        checked={shippingMethod === 'express'}
                        onChange={(e) =>
                          setShippingMethod(
                            e.target.value as 'standard' | 'express'
                          )
                        }
                        className="mr-4 text-primary-green focus:ring-primary-green"
                      />
                      <div className="flex items-center gap-2">
                        <Truck size={20} />
                        <div>
                          <p>Giao hàng nhanh</p>
                          <p className="text-xs text-gray-500">
                            Đồng bộ vận đơn nhanh ngay sau khi tạo đơn
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                  {shippingMethod === 'express' && (
                    <div className="mt-3">
                      {previewLoading && (
                        <p className="text-sm text-gray-500">
                          Đang tính phí vận chuyển GHN...
                        </p>
                      )}
                      {previewError && (
                        <p className="text-sm text-red-600">{previewError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg p-4 sm:p-6">
                  <h2 className="text-xl font-bold mb-4">Hình thức thanh toán</h2>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer ${
                          paymentMethod === method.id
                            ? 'border-primary-green bg-primary-green-light'
                            : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-4 text-primary-green focus:ring-primary-green"
                        />
                        <div className="flex items-center gap-2">
                          {method.icon === 'truck' && <Truck size={20} />}
                          {method.icon === 'bank' && <Building2 size={20} />}
                          {method.icon === 'card' && <CreditCard size={20} />}
                          {method.icon === 'wallet' && <Wallet size={20} />}
                          <span>{method.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg p-4 sm:p-6 lg:sticky lg:top-4">
                  <h2 className="text-lg font-bold mb-4">Mã giảm giá</h2>
                  {appliedVoucher ? (
                    <div className="flex items-center justify-between gap-2 mb-4 p-3 bg-primary-green-light rounded-lg">
                      <span className="text-sm font-medium text-primary-green">
                        Đã áp dụng: {appliedVoucher.code ?? ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value)
                          setVoucherError(null)
                        }}
                        placeholder="Nhập mã giảm giá"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={voucherLoading}
                        className="bg-primary-green text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {voucherLoading ? 'ĐANG KIỂM TRA...' : 'ÁP DỤNG'}
                      </button>
                    </div>
                  )}
                  {voucherError && (
                    <p className="text-sm text-red-600 mb-4">{voucherError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setVoucherPanelOpen(true)}
                    className="text-primary-green underline hover:opacity-80 cursor-pointer text-sm mb-4 block"
                  >
                    Chọn mã giảm giá tại đây
                  </button>

                  <div className="border-t border-gray-200 pt-4">
                    <h2 className="text-lg font-bold mb-4">Thông tin đơn hàng</h2>
                    <div className="space-y-3 mb-4">
                      {cartItems.map((item) => {
                        const displayName = item.mealComboId
                          ? item.mealComboName || 'Combo'
                          : [item.productName, item.variantName]
                              .filter(Boolean)
                              .join(' - ') || 'Sản phẩm'
                        const imageSrc = item.imageUrl?.startsWith('http') ? item.imageUrl : '/images/logo.png'
                        return (
                        <div key={item.cartItemId} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
                          <div className="relative w-12 h-12 bg-white rounded-lg flex-shrink-0 overflow-hidden border border-gray-100">
                            <Image
                              src={imageSrc}
                              alt={displayName}
                              fill
                              className="object-contain p-1 rounded-lg"
                              sizes="48px"
                              unoptimized={imageSrc.startsWith('http')}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{displayName}</h3>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs text-gray-500">Số lượng: {item.quantity}</span>
                              <span className="font-semibold text-primary-green text-sm">
                                {formatCurrency(item.subTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                        )
                      })}
                      <div className="flex justify-between pt-2">
                        <span className="text-gray-600">Tạm tính:</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phí vận chuyển:</span>
                        <span className="font-semibold">{formatCurrency(shippingFee)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-primary-green">
                          <span>Giảm giá:</span>
                          <span className="font-semibold">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold">Tổng Cộng:</span>
                        <span className="text-lg font-bold text-primary-green">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="mt-1 mr-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                        />
                        <span className="text-sm text-gray-600">
                          Tôi đã đọc và đồng ý với điều khoản và điều kiện mua hàng của nongxanh
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !agreedToTerms}
                      className="w-full bg-primary-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {voucherPanelOpen &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setVoucherPanelOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="voucher-panel-title"
            >
              <div
                className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 id="voucher-panel-title" className="text-lg font-bold">
                    Danh sách mã giảm giá đơn hàng
                  </h2>
                  <button
                    type="button"
                    onClick={() => setVoucherPanelOpen(false)}
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label="Đóng"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="overflow-y-auto p-4 flex-1">
                  {panelLoading && (
                    <p className="text-gray-500 text-center py-6">Đang tải...</p>
                  )}
                  {panelError && (
                    <p className="text-red-600 text-sm mb-4">{panelError}</p>
                  )}
                  {!panelLoading && !panelError && panelVouchers.length === 0 && (
                    <p className="text-gray-500 text-center py-6">
                      Chưa có mã giảm giá nào.
                    </p>
                  )}
                  {!panelLoading && panelVouchers.length > 0 && (
                    <div className="space-y-3">
                      {panelVouchers.map((v) => {
                        const type = (v.discountType ?? '').toUpperCase()
                        const desc =
                          v.description ||
                          (type === 'PERCENT'
                            ? `Giảm ${v.discountValue}%`
                            : `Giảm ${formatCurrency(v.discountValue)}`)
                        const minOrder = v.minOrderValue
                          ? `Đơn tối thiểu ${formatCurrency(v.minOrderValue)}`
                          : ''
                        const maxD = v.maxDiscount
                          ? `Giảm tối đa: ${formatCurrency(v.maxDiscount)}`
                          : ''
                        const validity =
                          v.startDate && v.endDate
                            ? `Từ ${formatDate(v.startDate)} đến ${formatDate(v.endDate)}`
                            : ''
                        return (
                          <div
                            key={v.voucherId}
                            className="flex items-start justify-between gap-3 p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-primary-green">
                                Mã: {v.code ?? ''}
                              </p>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {desc}
                              </p>
                              {(minOrder || maxD) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {[minOrder, maxD].filter(Boolean).join(' · ')}
                                </p>
                              )}
                              {validity && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {validity}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => applyVoucherFromPanel(v)}
                              className="flex-shrink-0 bg-primary-green text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-green-dark"
                            >
                              Áp dụng
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  )
}
