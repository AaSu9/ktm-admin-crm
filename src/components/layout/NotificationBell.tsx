'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'success': return 'bg-emerald-500'
    case 'warning': return 'bg-amber-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-blue-500'
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      // Silent fail — keep whatever we have
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', id }),
      })
    } catch {
      // Silent fail
    }
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      })
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Notifications</p>
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-emerald-50/30' : ''}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getTypeColor(n.type)} ${!n.read ? 'ring-2 ring-offset-1 ring-current/20' : 'opacity-50'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 truncate">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                        className="p-1 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3 text-emerald-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-center bg-gray-50/50">
              <p className="text-xs text-gray-400">{notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
