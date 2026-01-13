import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'processing' | 'confirmed' | 'pending' | 'paid' | 'public' | 'hidden' | 'published' | 'unpublished' | 'shipped' | 'delivered' | 'cancelled'
  children: React.ReactNode
  className?: string
}

const statusConfig = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  processing: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  pending: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  public: 'bg-green-100 text-green-800',
  hidden: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  unpublished: 'bg-gray-100 text-gray-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusConfig[status],
        className
      )}
    >
      {children}
    </span>
  )
}
