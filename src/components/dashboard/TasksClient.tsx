'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  User, 
  Building2, 
  DollarSign, 
  Star, 
  ShieldCheck, 
  Trash2, 
  FileText,
  Filter,
  X,
  UserCheck
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { createTask, startTask, completeTask, verifyTask, rejectTask, deleteTask } from '@/app/actions/tasks'
import { toast } from 'sonner'

export interface TaskRecord {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  dueDate: string | Date
  dueTime: string | null
  attachmentUrl: string | null
  notes: string | null
  rejectionReason: string | null
  starsAwarded: number
  pointsAwarded: number
  completedAt: string | Date | null
  verifiedAt: string | Date | null
  assignedTo: { id: string; name: string; email: string; role: string }
  createdBy: { id: string; name: string }
  customer?: { id: string; name: string; phone: string } | null
  property?: { id: string; title: string; location: string } | null
  deal?: { id: string; title: string } | null
  visit?: { id: string; time: string } | null
}

interface TasksClientProps {
  tasks: TaskRecord[]
  employees: { id: string; name: string; role: string; designation?: string | null }[]
  customers: { id: string; name: string; phone: string }[]
  properties: { id: string; title: string; location: string }[]
  deals: { id: string; title: string }[]
  visits: { id: string; time: string; date: Date | string }[]
  currentUserId: string
  currentUserRole: string
}

export function TasksClient({
  tasks,
  employees,
  customers,
  properties,
  deals,
  visits,
  currentUserId,
  currentUserRole,
}: TasksClientProps) {
  const router = useRouter()
  const [filterTab, setFilterTab] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<TaskRecord | null>(null)
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSuperAdminOrAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)

  // Automatic overdue check helper
  const now = new Date()
  const isOverdue = (task: TaskRecord) => {
    return task.status !== 'VERIFIED' && task.status !== 'COMPLETED' && new Date(task.dueDate) < now
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Tab filter
    if (filterTab === 'MY_TASKS' && t.assignedTo.id !== currentUserId) return false
    if (filterTab === 'PENDING' && t.status !== 'PENDING') return false
    if (filterTab === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false
    if (filterTab === 'AWAITING_VERIFICATION' && t.status !== 'COMPLETED') return false
    if (filterTab === 'VERIFIED' && t.status !== 'VERIFIED') return false
    if (filterTab === 'NEEDS_REVISION' && t.status !== 'NEEDS_REVISION') return false
    if (filterTab === 'OVERDUE' && !isOverdue(t)) return false

    // Priority filter
    if (priorityFilter && t.priority !== priorityFilter) return false

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const titleMatch = t.title.toLowerCase().includes(q)
      const descMatch = t.description?.toLowerCase().includes(q)
      const empMatch = t.assignedTo.name.toLowerCase().includes(q)
      const custMatch = t.customer?.name.toLowerCase().includes(q)
      const propMatch = t.property?.title.toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !empMatch && !custMatch && !propMatch) return false
    }

    return true
  })

  // Metric counts
  const totalCount = tasks.length
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const awaitingVerificationCount = tasks.filter((t) => t.status === 'COMPLETED').length
  const verifiedCount = tasks.filter((t) => t.status === 'VERIFIED').length
  const overdueCount = tasks.filter((t) => isOverdue(t)).length

  // Action handlers
  const handleStartTask = async (id: string) => {
    setIsSubmitting(true)
    try {
      const res = await startTask(id)
      if (res.success) {
        toast.success('Task marked in progress')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to start task')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteTask = async (id: string) => {
    setIsSubmitting(true)
    try {
      const res = await completeTask(id)
      if (res.success) {
        toast.success('Task completed! Waiting for Admin verification.')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to complete task')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyTask = async (id: string) => {
    setIsSubmitting(true)
    try {
      const res = await verifyTask(id)
      if (res.success) {
        toast.success('Task verified! Performance points & Stars awarded ⭐')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to verify task')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingTaskId || !rejectReason.trim()) return
    setIsSubmitting(true)
    try {
      const res = await rejectTask(rejectingTaskId, rejectReason)
      if (res.success) {
        toast.success('Task returned for revision with feedback')
        setRejectingTaskId(null)
        setRejectReason('')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to reject task')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    setIsSubmitting(true)
    try {
      const res = await deleteTask(id)
      if (res.success) {
        toast.success('Task deleted')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete task')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await createTask({
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || undefined,
        assignedToId: formData.get('assignedToId') as string,
        customerId: (formData.get('customerId') as string) || undefined,
        propertyId: (formData.get('propertyId') as string) || undefined,
        dealId: (formData.get('dealId') as string) || undefined,
        visitId: (formData.get('visitId') as string) || undefined,
        priority: formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        dueDate: formData.get('dueDate') as string,
        dueTime: (formData.get('dueTime') as string) || undefined,
        attachmentUrl: (formData.get('attachmentUrl') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
      })

      if (res.success) {
        toast.success('Task created and assigned successfully!')
        setIsCreateModalOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to create task')
      }
    } catch {
      toast.error('Unexpected error occurred while creating task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-emerald-600" /> Task Management & Verification
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Assign duties to team members, track completions, and verify tasks to grant performance stars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdminOrAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Widget with Click-to-Filter */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'ALL', label: 'Total Tasks', count: totalCount, color: 'border-gray-200 bg-white text-gray-900' },
          { key: 'PENDING', label: 'Pending', count: pendingCount, color: 'border-yellow-200 bg-yellow-50/50 text-yellow-800' },
          { key: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount, color: 'border-blue-200 bg-blue-50/50 text-blue-800' },
          { key: 'AWAITING_VERIFICATION', label: 'Awaiting Verification', count: awaitingVerificationCount, color: 'border-purple-200 bg-purple-50/50 text-purple-800' },
          { key: 'VERIFIED', label: 'Verified', count: verifiedCount, color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800' },
          { key: 'OVERDUE', label: 'Overdue', count: overdueCount, color: 'border-red-200 bg-red-50/50 text-red-800' },
        ].map((card) => (
          <button
            key={card.key}
            onClick={() => setFilterTab(card.key)}
            className={cn(
              'p-4 rounded-2xl border text-left transition-all hover:shadow-xs cursor-pointer',
              card.color,
              filterTab === card.key && 'ring-2 ring-emerald-500 shadow-xs'
            )}
          >
            <p className="text-2xl font-black">{card.count}</p>
            <p className="text-xs font-semibold opacity-80 mt-1">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
          {[
            { key: 'ALL', label: 'All Tasks' },
            { key: 'MY_TASKS', label: 'My Tasks' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'AWAITING_VERIFICATION', label: 'Needs Verification' },
            { key: 'VERIFIED', label: 'Verified' },
            { key: 'NEEDS_REVISION', label: 'Needs Revision' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                filterTab === tab.key ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Priority Selection */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-70">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, agents, properties..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-200 rounded-xl text-xs px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Task Cards & Listing */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Task Records ({filteredTasks.length})</h3>
          <span className="text-xs text-gray-400">Showing filtered team duties</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs font-semibold">
                <th className="px-5 py-3.5 text-left">Task & Details</th>
                <th className="px-4 py-3.5 text-left">Assigned Employee</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Due Date</th>
                <th className="px-4 py-3.5 text-left">Priority</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                    <p className="font-medium text-gray-500">No tasks found matching your filters</p>
                    <p className="text-xs mt-1">Create a task or clear your search filters</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const overdue = isOverdue(task)
                  const isAssignedToMe = task.assignedTo.id === currentUserId
                  return (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Title & Context */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <button
                            onClick={() => setSelectedTaskDetails(task)}
                            className="font-bold text-gray-900 hover:text-emerald-600 text-left transition-colors text-sm line-clamp-1 cursor-pointer"
                          >
                            {task.title}
                          </button>
                          {task.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 pt-0.5">
                            {task.customer && (
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                                <User className="h-3 w-3" /> {task.customer.name}
                              </span>
                            )}
                            {task.property && (
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                                <Building2 className="h-3 w-3" /> {task.property.title}
                              </span>
                            )}
                            {task.deal && (
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                                <DollarSign className="h-3 w-3" /> {task.deal.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            {task.assignedTo.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800 leading-tight">
                              {task.assignedTo.name}
                              {isAssignedToMe && (
                                <span className="ml-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-sm">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{task.assignedTo.role}</p>
                          </div>
                        </div>
                      </td>

                      {/* Due Date & Time */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                          {task.dueTime && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Clock className="h-3 w-3" /> {task.dueTime}
                            </div>
                          )}
                          {overdue && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                              <AlertCircle className="h-3 w-3" /> Overdue
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider',
                            task.priority === 'URGENT' && 'bg-red-100 text-red-800 border border-red-200',
                            task.priority === 'HIGH' && 'bg-orange-100 text-orange-800 border border-orange-200',
                            task.priority === 'MEDIUM' && 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                            task.priority === 'LOW' && 'bg-gray-100 text-gray-700 border border-gray-200'
                          )}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              'text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1',
                              task.status === 'VERIFIED' && 'bg-emerald-100 text-emerald-800',
                              task.status === 'COMPLETED' && 'bg-purple-100 text-purple-800',
                              task.status === 'IN_PROGRESS' && 'bg-blue-100 text-blue-800',
                              task.status === 'PENDING' && 'bg-yellow-100 text-yellow-800',
                              task.status === 'NEEDS_REVISION' && 'bg-rose-100 text-rose-800'
                            )}
                          >
                            {task.status === 'VERIFIED' && <ShieldCheck className="h-3.5 w-3.5" />}
                            {task.status === 'COMPLETED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {task.status === 'IN_PROGRESS' && <Play className="h-3 w-3" />}
                            {task.status.replace('_', ' ')}
                          </span>

                          {task.status === 'VERIFIED' && task.starsAwarded > 0 && (
                            <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                              {Array.from({ length: task.starsAwarded }).map((_, idx) => (
                                <Star key={idx} className="h-3 w-3 fill-amber-400" />
                              ))}
                              <span className="text-[10px] text-gray-500 font-bold ml-1">
                                +{task.pointsAwarded} pts
                              </span>
                            </div>
                          )}

                          {task.status === 'NEEDS_REVISION' && task.rejectionReason && (
                            <p className="text-[10px] text-rose-600 font-medium line-clamp-1">
                              Note: {task.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          {/* Agent Actions */}
                          {isAssignedToMe && task.status === 'PENDING' && (
                            <button
                              onClick={() => handleStartTask(task.id)}
                              disabled={isSubmitting}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition-colors cursor-pointer"
                            >
                              Start
                            </button>
                          )}

                          {isAssignedToMe && ['PENDING', 'IN_PROGRESS', 'NEEDS_REVISION'].includes(task.status) && (
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              disabled={isSubmitting}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              Complete
                            </button>
                          )}

                          {/* Super Admin / Admin Verification Actions */}
                          {isSuperAdminOrAdmin && task.status === 'COMPLETED' && (
                            <>
                              <button
                                onClick={() => handleVerifyTask(task.id)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Verify
                              </button>

                              <button
                                onClick={() => setRejectingTaskId(task.id)}
                                disabled={isSubmitting}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => setSelectedTaskDetails(task)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {/* Delete (Admin only) */}
                          {isSuperAdminOrAdmin && (
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={isSubmitting}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject / Revision Modal */}
      {rejectingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Request Revision / Reject Task</h3>
            <p className="text-xs text-gray-500">
              Provide feedback or instructions explaining why this task needs revision before it can be verified.
            </p>

            <form onSubmit={handleRejectTask} className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Please attach customer inspection sign-off document..."
                className="w-full border border-gray-200 rounded-2xl p-3 text-sm bg-gray-50 focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingTaskId(null)
                    setRejectReason('')
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Submit Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTaskDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                  Task #{selectedTaskDetails.id.slice(0, 8)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{selectedTaskDetails.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {selectedTaskDetails.description && (
                <div>
                  <p className="font-semibold text-gray-700">Description:</p>
                  <p className="mt-0.5 text-gray-600">{selectedTaskDetails.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div>
                  <span className="text-gray-400">Assigned To:</span>
                  <p className="font-bold text-gray-800">{selectedTaskDetails.assignedTo.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Created By:</span>
                  <p className="font-bold text-gray-800">{selectedTaskDetails.createdBy.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Due Date:</span>
                  <p className="font-bold text-gray-800">
                    {formatDate(selectedTaskDetails.dueDate)} {selectedTaskDetails.dueTime || ''}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Priority:</span>
                  <p className="font-bold text-gray-800">{selectedTaskDetails.priority}</p>
                </div>
              </div>

              {selectedTaskDetails.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <p className="font-bold">Revision Requested:</p>
                  <p className="mt-0.5">{selectedTaskDetails.rejectionReason}</p>
                </div>
              )}

              {selectedTaskDetails.starsAwarded > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
                  <span className="font-bold">Stars & Performance Points:</span>
                  <div className="flex items-center gap-1 font-bold text-amber-600">
                    {Array.from({ length: selectedTaskDetails.starsAwarded }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-500" />
                    ))}
                    <span>(+{selectedTaskDetails.pointsAwarded} pts)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTaskDetails(null)}
                className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-xl text-xs hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-emerald-600" /> Assign New Task
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Create and assign duties, follow-ups, or property inspections to team members.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Task Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Call John Doe to confirm mortgage approval"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Description / Instructions</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Specific requirements, checklist items, questions to ask..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Assign To Employee *</label>
                  <select
                    name="assignedToId"
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="" disabled selected>
                      Select Employee...
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Priority *</label>
                  <select
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="LOW">Low Priority (+1 Star)</option>
                    <option value="MEDIUM">Medium Priority (+1 Star)</option>
                    <option value="HIGH">High Priority (+2 Stars)</option>
                    <option value="URGENT">Urgent Priority (+3 Stars)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Due Date *</label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Due Time</label>
                  <input
                    type="text"
                    name="dueTime"
                    placeholder="e.g. 02:00 PM"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Related CRM Entities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Related Customer (Optional)</label>
                  <select
                    name="customerId"
                    defaultValue="none"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="none">None</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Related Property (Optional)</label>
                  <select
                    name="propertyId"
                    defaultValue="none"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="none">None</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
