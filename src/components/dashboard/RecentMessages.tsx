import Link from 'next/link'
import { formatDate, getStatusColor, cn } from '@/lib/utils'
import { ArrowRight, Mail } from 'lucide-react'

export function RecentMessages({ messages }: { messages: any[] }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Recent Messages</h3>
        <Link href="/messages" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {messages.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No messages yet</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800 truncate">{msg.senderName}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', getStatusColor(msg.status))}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{msg.subject || msg.content}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(msg.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
