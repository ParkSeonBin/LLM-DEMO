import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  trend?: {
    value: number
    isUp: boolean
  }
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-white/60 backdrop-blur-md p-5 rounded-xl border border-white/50 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="p-2 bg-[#005F28]/10 rounded-lg">
          <Icon className="h-5 w-5 text-[#005F28]" />
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={`text-xs font-bold ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isUp ? '↑' : '↓'} {trend.value}%
            </span>
          )}
          <span className="text-xs text-gray-400">{description}</span>
        </div>
      </div>
    </div>
  )
}