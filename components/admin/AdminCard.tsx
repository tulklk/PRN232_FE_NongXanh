import { LucideIcon } from 'lucide-react'

interface AdminCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  description?: string
  trend?: string
  className?: string
}

export default function AdminCard({
  icon: Icon,
  title,
  value,
  description,
  trend,
  className = '',
}: AdminCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary-green-light rounded-lg">
          <Icon className="text-primary-green" size={24} />
        </div>
        {trend && (
          <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  )
}
