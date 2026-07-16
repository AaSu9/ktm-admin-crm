import Link from 'next/link'
import { formatDate, getStatusColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

export function RecentLeads({ leads }: { leads: any[] }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Recent Leads</h3>
        <Link href="/leads" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {leads.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No leads yet</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                {lead.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{lead.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{lead.property?.title || 'No property'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(lead.status))}>
                  {lead.status.replace(/_/g, ' ')}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(lead.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
