import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500 text-white', badge: 'text-emerald-600' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-500 text-white', badge: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-500 text-white', badge: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-500 text-white', badge: 'text-orange-600' },
  cyan: { bg: 'bg-cyan-50', icon: 'bg-cyan-500 text-white', badge: 'text-cyan-600' },
  green: { bg: 'bg-green-50', icon: 'bg-green-500 text-white', badge: 'text-green-600' },
}

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  change?: string
}

export function StatCard({ label, value, icon: Icon, color, change }: StatCardProps) {
  const colors = colorMap[color] || colorMap.emerald
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', colors.icon)}>
          <Icon className="h-4.5 w-4.5 h-5 w-5" />
        </div>
        {change && (
          <span className={cn('text-xs font-medium', colors.badge)}>{change}</span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
    </div>
  )
}
