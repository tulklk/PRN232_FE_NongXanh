import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(dateObj.getTime())) return '—'
  return format(dateObj, 'dd/MM/yyyy')
}

/**
 * Format phone number to Vietnamese display standard.
 * Handles: +84906337965, 84906337965, 0906337965
 * Output: 0906 337 965 (mobile) or 0XXX XXX XXXX (landline)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+84')) cleaned = '0' + cleaned.slice(3)
  else if (cleaned.startsWith('84') && cleaned.length >= 10)
    cleaned = '0' + cleaned.slice(2)
  if (cleaned.length === 10 && cleaned.startsWith('0'))
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
  if (cleaned.length === 11 && cleaned.startsWith('0'))
    return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')
  return phone
}

/**
 * Normalize phone to digits only (for API/submit).
 * Keeps leading 0 for Vietnamese format.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('84') && cleaned.length >= 10) return '0' + cleaned.slice(2)
  return cleaned
}

export function calculateDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100)
}

/** Voucher shape for discount calculation */
export interface VoucherForDiscount {
  discountType?: string | null
  discountValue: number
  minOrderValue?: number | null
  maxDiscount?: number | null
}

/**
 * Tính số tiền giảm từ voucher.
 * - minOrderValue: so sánh với subtotal (đơn tạm tính trước ship).
 * - FIXED: giảm tiền cố định, tối đa = subtotal + shippingFee.
 * - PERCENT: giảm % trên (subtotal + shippingFee), bị giới hạn bởi maxDiscount.
 */
export function calculateVoucherDiscount(
  voucher: VoucherForDiscount,
  subtotal: number,
  shippingFee: number
): number {
  const minOrder = voucher.minOrderValue ?? 0
  if (minOrder > 0 && subtotal < minOrder) return 0

  const totalBeforeDiscount = subtotal + shippingFee
  const type = (voucher.discountType ?? '').toUpperCase()

  let discount = 0
  if (type === 'FIXED') {
    discount = Math.min(voucher.discountValue ?? 0, totalBeforeDiscount)
  } else if (type === 'PERCENT') {
    discount = (totalBeforeDiscount * (voucher.discountValue ?? 0)) / 100
    const max = voucher.maxDiscount ?? Infinity
    if (max > 0) discount = Math.min(discount, max)
  }

  return Math.max(0, Math.round(discount))
}
