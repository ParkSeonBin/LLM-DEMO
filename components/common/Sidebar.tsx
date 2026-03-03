import { Activity, BookOpen, History, Network, Database, LucideIcon } from 'lucide-react'

interface Tab {
  id: string
  name: string
  icon: LucideIcon
}

interface SidebarProps {
  activeTab: string
  setActiveTab: (id: string) => void
  tabs: Tab[]
}

export function Sidebar({ activeTab, setActiveTab, tabs }: SidebarProps) {
  return (
    <div className="w-32 flex-shrink-0">
      <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-lg shadow-sm overflow-hidden">
        <div className="p-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-1.5 px-1.5 py-1.5 rounded text-left transition-all duration-200 mb-0.5 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#005F28] to-[#007A35] text-white shadow-md'
                    : 'text-gray-700 hover:bg-white/50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-3 w-3 flex-shrink-0" />
                <span className="text-[11px] font-normal truncate leading-tight">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}