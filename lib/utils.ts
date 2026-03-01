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

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
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
