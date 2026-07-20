'use client'

import { useState, useTransition } from 'react'
import { formatDate, getStatusColor, cn } from '@/lib/utils'
import { Mail, MessageSquare, Search, Filter, Download, Trash2, CheckCheck, Reply, X, Send } from 'lucide-react'
import { markMessageRead, replyToMessage, deleteMessage, bulkMarkMessagesRead, bulkDeleteMessages } from '@/app/actions/messages'
import { exportToCSV } from '@/lib/csvExport'
import { toast } from 'sonner'

interface Message {
  id: string
  senderName: string
  email: string
  phone: string | null
  subject: string | null
  content: string
  reply: string | null
  status: string
  createdAt: Date | string
}

export function MessagesClient({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState(initialMessages)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isPending, startTransition] = useTransition()

  // Filter
  const filtered = messages.filter((msg) => {
    const matchesSearch = !search ||
      msg.senderName.toLowerCase().includes(search.toLowerCase()) ||
      msg.email.toLowerCase().includes(search.toLowerCase()) ||
      (msg.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      msg.content.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || msg.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const unread = messages.filter(m => m.status === 'UNREAD').length
  const allSelected = filtered.length > 0 && filtered.every(m => selectedIds.has(m.id))

  // Bulk actions
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(m => m.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkMarkRead = () => {
    const ids = Array.from(selectedIds)
    setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'READ' } : m))
    setSelectedIds(new Set())
    startTransition(() => { bulkMarkMessagesRead(ids) })
  }

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.size} message(s)?`)) return
    const ids = Array.from(selectedIds)
    setMessages(prev => prev.filter(m => !ids.includes(m.id)))
    setSelectedIds(new Set())
    startTransition(() => { bulkDeleteMessages(ids) })
  }

  const handleMarkRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'READ' } : m))
    startTransition(() => { markMessageRead(id) })
  }

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return
    const currentReplyText = replyText
    
    // Save previous state in case we need to revert on failure
    const originalMessages = [...messages]
    
    // Optimistic UI update
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'REPLIED', reply: currentReplyText } : m))
    setReplyingTo(null)
    setReplyText('')
    
    try {
      const res = await replyToMessage(id, currentReplyText)
      if (res.success) {
        if (res.warning) {
          toast.warning(res.warning, { duration: 8000 })
        } else {
          toast.success('Reply saved and email sent successfully!')
        }
      } else {
        toast.error(res.error || 'Failed to save reply')
        setMessages(originalMessages)
      }
    } catch (err: any) {
      toast.error('Failed to send reply. Please try again.')
      setMessages(originalMessages)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this message?')) return
    setMessages(prev => prev.filter(m => m.id !== id))
    startTransition(() => { deleteMessage(id) })
  }

  const handleExportCSV = () => {
    exportToCSV(filtered, [
      { key: 'senderName', label: 'Sender' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'subject', label: 'Subject' },
      { key: 'content', label: 'Message' },
      { key: 'status', label: 'Status' },
      { key: 'reply', label: 'Reply' },
      { key: 'createdAt', label: 'Date', format: (v: any) => new Date(v).toLocaleDateString('en-IN') },
    ], 'messages-export')
  }

  const statusTabs = [
    { id: 'ALL', label: 'All', count: messages.length },
    { id: 'UNREAD', label: 'Unread', count: messages.filter(m => m.status === 'UNREAD').length },
    { id: 'READ', label: 'Read', count: messages.filter(m => m.status === 'READ').length },
    { id: 'REPLIED', label: 'Replied', count: messages.filter(m => m.status === 'REPLIED').length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 text-sm">{unread} unread · {messages.length} total</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sender, email, subject..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
          />
        </div>
        {/* Status tabs */}
        <div className="flex gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-sm font-medium text-emerald-700">{selectedIds.size} selected</p>
          <div className="flex gap-2">
            <button onClick={handleBulkMarkRead} className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">
              <CheckCheck className="h-3.5 w-3.5" /> Mark Read
            </button>
            <button onClick={handleBulkDelete} className="inline-flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Select all header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-xs text-gray-500 font-medium">Select all ({filtered.length})</span>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>{search || statusFilter !== 'ALL' ? 'No messages match your filter' : 'No messages yet'}</p>
            </div>
          ) : filtered.map((msg) => (
            <div key={msg.id} className={cn('px-5 py-4 hover:bg-gray-50/50 transition-colors', msg.status === 'UNREAD' && 'bg-emerald-50/30')}>
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(msg.id)}
                  onChange={() => toggleSelect(msg.id)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer flex-shrink-0"
                />
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {msg.senderName.charAt(0)}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm font-medium text-gray-800', msg.status === 'UNREAD' && 'font-semibold')}>{msg.senderName}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(msg.status))}>{msg.status}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(msg.createdAt)}</span>
                  </div>
                  {msg.subject && <p className="text-sm text-gray-700 font-medium truncate">{msg.subject}</p>}
                  <p className="text-sm text-gray-500 truncate">{msg.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{msg.email}</div>
                    {msg.phone && <div className="text-xs text-gray-400">{msg.phone}</div>}
                    <div className="ml-auto flex items-center gap-2">
                      {msg.status === 'UNREAD' && (
                        <button onClick={() => handleMarkRead(msg.id)} className="text-xs text-blue-600 hover:underline font-medium">Mark Read</button>
                      )}
                      {msg.status !== 'REPLIED' && (
                        <button onClick={() => { setReplyingTo(msg.id); setReplyText('') }} className="text-xs text-emerald-600 hover:underline font-medium flex items-center gap-0.5">
                          <Reply className="h-3 w-3" /> Reply
                        </button>
                      )}
                      <button onClick={() => handleDelete(msg.id)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                    </div>
                  </div>

                  {/* Reply display */}
                  {msg.reply && (
                    <div className="mt-2 pl-3 border-l-2 border-emerald-300 bg-emerald-50/50 rounded-r-lg p-2">
                      <p className="text-xs text-gray-500 font-medium">Your reply:</p>
                      <p className="text-xs text-gray-600">{msg.reply}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingTo === msg.id && (
                    <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(msg.id)}
                      />
                      <button onClick={() => handleReply(msg.id)} disabled={!replyText.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1">
                        <Send className="h-3.5 w-3.5" /> Send
                      </button>
                      <button onClick={() => setReplyingTo(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
