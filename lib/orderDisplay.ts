/** Vietnamese labels for order + VNPay status in account UI */

export function getOrderStatusLabel(status?: string | null): string {
  const s = (status ?? '').trim().toLowerCase()
  const labels: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao',
    delivered: 'Đã nhận hàng',
    cancelled: 'Đã hủy',
  }
  return labels[s] ?? (status?.trim() || '—')
}

export function getVnPayStatusLabel(vnPayStatus?: string | null): string {
  const raw = vnPayStatus?.trim()
  if (!raw) return '—'
  const s = raw.toLowerCase()
  const labels: Record<string, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán thất bại',
    refunded: 'Đã hoàn tiền',
  }
  return labels[s] ?? raw
}
