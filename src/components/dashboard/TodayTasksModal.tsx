'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, CheckCircle2, Play, X, AlertTriangle, ArrowRight, Clock } from 'lucide-react'
import { startTask, completeTask } from '@/app/actions/tasks'
import { toast } from 'sonner'

interface TaskItem {
  id: string
  title: string
  priority: string
  status: string
  dueTime: string | null
  property?: { title: string } | null
  customer?: { name: string } | null
}

interface TodayTasksModalProps {
  tasks: TaskItem[]
  userName: string
}

export function TodayTasksModal({ tasks, userName }: TodayTasksModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [taskList, setTaskList] = useState(tasks)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    // Check if dismissed in this browser session
    const isDismissed = sessionStorage.getItem('ktm_today_tasks_dismissed')
    if (!isDismissed && tasks.length > 0) {
      setIsOpen(true)
    }
  }, [tasks])

  const handleDismiss = () => {
    sessionStorage.setItem('ktm_today_tasks_dismissed', 'true')
    setIsOpen(false)
  }

  const handleStart = async (taskId: string) => {
    setLoadingId(taskId)
    try {
      const res = await startTask(taskId)
      if (res.success) {
        toast.success('Task started!')
        setTaskList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'IN_PROGRESS' } : t))
        )
      } else {
        toast.error(res.error || 'Failed to start task')
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleComplete = async (taskId: string) => {
    setLoadingId(taskId)
    try {
      const res = await completeTask(taskId)
      if (res.success) {
        toast.success('Task completed and submitted for verification!')
        setTaskList((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' } : t))
        )
      } else {
        toast.error(res.error || 'Failed to complete task')
      }
    } finally {
      setLoadingId(null)
    }
  }

  if (!isOpen || taskList.length === 0) return null

  const pendingOrInProgress = taskList.filter((t) => t.status !== 'COMPLETED' && t.status !== 'VERIFIED')
  if (pendingOrInProgress.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Today&apos;s Scheduled Tasks</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Hello {userName}, you have <strong className="text-emerald-600">{pendingOrInProgress.length} task(s)</strong> due today.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {pendingOrInProgress.map((task, idx) => (
            <div
              key={task.id}
              className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-200 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                  <p className="text-sm font-bold text-gray-800 truncate">{task.title}</p>
                  {task.priority === 'URGENT' && (
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3" /> Urgent
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {task.dueTime && (
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      <Clock className="h-3.5 w-3.5" /> {task.dueTime}
                    </span>
                  )}
                  {task.customer && <span className="truncate">👤 {task.customer.name}</span>}
                  {task.property && <span className="truncate">🏢 {task.property.title}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {task.status === 'PENDING' && (
                  <button
                    onClick={() => handleStart(task.id)}
                    disabled={loadingId === task.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" /> Start
                  </button>
                )}
                <button
                  onClick={() => handleComplete(task.id)}
                  disabled={loadingId === task.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            Dismiss for this session
          </button>
          <Link
            href="/tasks"
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Open Tasks Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
