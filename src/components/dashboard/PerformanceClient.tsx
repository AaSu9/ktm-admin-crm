'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Award, 
  Trophy, 
  Star, 
  TrendingUp, 
  CheckSquare, 
  DollarSign, 
  Calendar, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  Flame,
  Building2,
  Users
} from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { updatePerformanceSettings } from '@/app/actions/commissions'
import { toast } from 'sonner'
import { EmployeePerformanceData } from '@/app/actions/performance'

interface PerformanceClientProps {
  initialLeaderboard: EmployeePerformanceData[]
  employeeOfTheYear: EmployeePerformanceData | null
  currentUserRole: string
  settings: {
    normalTaskPoints: number
    highTaskPoints: number
    urgentTaskPoints: number
    dealClosePoints: number
    saleClosePoints: number
    defaultCommissionRate: number
  }
}

export function PerformanceClient({
  initialLeaderboard,
  employeeOfTheYear,
  currentUserRole,
  settings,
}: PerformanceClientProps) {
  const router = useRouter()
  const [period, setPeriod] = useState<'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'all_time'>('all_time')
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN'

  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod)
    router.push(`/performance?period=${newPeriod}`)
  }

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdatingSettings(true)
    const formData = new FormData(e.currentTarget)

    try {
      const res = await updatePerformanceSettings({
        normalTaskPoints: Number(formData.get('normalTaskPoints')),
        highTaskPoints: Number(formData.get('highTaskPoints')),
        urgentTaskPoints: Number(formData.get('urgentTaskPoints')),
        dealClosePoints: Number(formData.get('dealClosePoints')),
        saleClosePoints: Number(formData.get('saleClosePoints')),
        defaultCommissionRate: Number(formData.get('defaultCommissionRate')),
      })

      if (res.success) {
        toast.success('Performance scoring rules updated successfully!')
        setIsSettingsModalOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update settings')
      }
    } catch {
      toast.error('Unexpected error updating settings')
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" /> Team Performance & Star Leaderboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time ranking of employee achievements, verified tasks, property sales, and performance stars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sliders className="h-4 w-4 text-emerald-600" /> Configure Scoring Rules
            </button>
          )}
        </div>
      </div>

      {/* Employee of the Year Hero Banner */}
      {employeeOfTheYear && (
        <div className="relative overflow-hidden bg-linear-to-br from-[#0f2212] via-[#1a3a1f] to-[#0f2212] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-black tracking-wider uppercase backdrop-blur-xs">
                <Trophy className="h-4 w-4 text-amber-300 fill-amber-300" /> Employee of the Year 🏆
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-amber-400 to-amber-200 text-[#0f2212] font-black text-2xl flex items-center justify-center shadow-lg border-2 border-amber-300">
                  {employeeOfTheYear.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    {employeeOfTheYear.name}
                    <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Rank #1
                    </span>
                  </h2>
                  <p className="text-emerald-200/80 text-xs font-medium mt-0.5">
                    {employeeOfTheYear.designation} · {employeeOfTheYear.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Accomplishments Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                <p className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 fill-amber-300" /> {employeeOfTheYear.stars}
                </p>
                <p className="text-[11px] text-emerald-100/70 font-semibold mt-0.5">Total Stars</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                <p className="text-2xl font-black text-white">{employeeOfTheYear.verifiedTasks}</p>
                <p className="text-[11px] text-emerald-100/70 font-semibold mt-0.5">Verified Tasks</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                <p className="text-2xl font-black text-white">{employeeOfTheYear.salesCount}</p>
                <p className="text-[11px] text-emerald-100/70 font-semibold mt-0.5">Closed Sales</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
                <p className="text-lg font-black text-emerald-300 truncate">
                  {formatPrice(employeeOfTheYear.totalRevenue)}
                </p>
                <p className="text-[11px] text-emerald-100/70 font-semibold mt-0.5">Sales Revenue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-gray-700">Filter Ranking Period:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
          {[
            { key: 'this_week', label: 'This Week' },
            { key: 'this_month', label: 'This Month' },
            { key: 'this_quarter', label: 'This Quarter' },
            { key: 'this_year', label: 'This Year' },
            { key: 'all_time', label: 'All Time' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handlePeriodChange(tab.key as any)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                period === tab.key ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" /> Employee Leaderboard Standings
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Ranked by verified duties, deal transactions, stars, and scoring points
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            {initialLeaderboard.length} Active Consultants
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 text-xs font-semibold">
                <th className="px-5 py-3.5 text-left">Rank & Employee</th>
                <th className="px-4 py-3.5 text-center">Stars (⭐)</th>
                <th className="px-4 py-3.5 text-center">Verified Tasks</th>
                <th className="px-4 py-3.5 text-center hidden md:table-cell">Closed Deals</th>
                <th className="px-4 py-3.5 text-right hidden lg:table-cell">Revenue Volume</th>
                <th className="px-4 py-3.5 text-right hidden md:table-cell">Commission</th>
                <th className="px-5 py-3.5 text-right font-bold text-emerald-800">Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    No performance data recorded for this period.
                  </td>
                </tr>
              ) : (
                initialLeaderboard.map((emp) => {
                  const isGold = emp.rank === 1
                  const isSilver = emp.rank === 2
                  const isBronze = emp.rank === 3

                  return (
                    <tr
                      key={emp.id}
                      className={cn(
                        'hover:bg-gray-50/50 transition-colors',
                        isGold && 'bg-amber-50/20',
                        isSilver && 'bg-slate-50/30',
                        isBronze && 'bg-orange-50/20'
                      )}
                    >
                      {/* Rank & Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs',
                              isGold && 'bg-amber-400 text-amber-950 font-bold',
                              isSilver && 'bg-slate-200 text-slate-800 font-bold',
                              isBronze && 'bg-amber-700/20 text-amber-900 font-bold',
                              !isGold && !isSilver && !isBronze && 'bg-gray-100 text-gray-600 font-semibold'
                            )}
                          >
                            {isGold ? '🥇 1' : isSilver ? '🥈 2' : isBronze ? '🥉 3' : `#${emp.rank}`}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{emp.name}</p>
                            <p className="text-xs text-gray-400">
                              {emp.designation} · <span className="text-emerald-700">{emp.role}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Stars */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-0.5 text-amber-500 font-bold text-xs bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{emp.stars}</span>
                        </div>
                      </td>

                      {/* Verified Tasks */}
                      <td className="px-4 py-4 text-center font-semibold text-gray-800">
                        <div className="space-y-0.5">
                          <span className="font-bold">{emp.verifiedTasks}</span>
                          <span className="text-gray-400 text-xs"> / {emp.totalTasks}</span>
                        </div>
                      </td>

                      {/* Closed Deals */}
                      <td className="px-4 py-4 text-center font-bold text-gray-800 hidden md:table-cell">
                        {emp.salesCount}
                      </td>

                      {/* Revenue Volume */}
                      <td className="px-4 py-4 text-right font-semibold text-gray-800 hidden lg:table-cell">
                        {formatPrice(emp.totalRevenue)}
                      </td>

                      {/* Commission */}
                      <td className="px-4 py-4 text-right font-medium text-emerald-700 hidden md:table-cell">
                        {formatPrice(emp.totalCommission)}
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1 font-black text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{emp.score.toLocaleString()} pts</span>
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

      {/* Super Admin Scoring Rules Configuration Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-600" /> Performance Scoring Rules
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure how stars and points are awarded when tasks are verified and deals are closed.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Normal Task Points</label>
                  <input
                    type="number"
                    name="normalTaskPoints"
                    defaultValue={settings.normalTaskPoints}
                    required
                    min={1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">High Priority Task Points</label>
                  <input
                    type="number"
                    name="highTaskPoints"
                    defaultValue={settings.highTaskPoints}
                    required
                    min={1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Urgent Task Points</label>
                  <input
                    type="number"
                    name="urgentTaskPoints"
                    defaultValue={settings.urgentTaskPoints}
                    required
                    min={1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Closed Deal Points</label>
                  <input
                    type="number"
                    name="dealClosePoints"
                    defaultValue={settings.dealClosePoints}
                    required
                    min={1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Property Sale Points</label>
                  <input
                    type="number"
                    name="saleClosePoints"
                    defaultValue={settings.saleClosePoints}
                    required
                    min={1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Default Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="defaultCommissionRate"
                    defaultValue={settings.defaultCommissionRate}
                    required
                    min={0.1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {isUpdatingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
