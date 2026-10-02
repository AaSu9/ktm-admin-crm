'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  Shield, 
  Bell, 
  User, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Star, 
  Award, 
  DollarSign, 
  Sliders, 
  ExternalLink, 
  Unlink 
} from 'lucide-react'
import { updateProfile, changePassword } from '@/app/actions/settings'
import { updatePerformanceSettings } from '@/app/actions/commissions'
import { toast } from 'sonner'

interface SettingsClientProps {
  userName: string
  userEmail: string
  userRole: string
  userPhone?: string
  isGoogleConnected: boolean
  googleEmail?: string | null
  stars: number
  performancePoints: number
  settings: {
    defaultCommissionRate: number
    normalTaskPoints: number
    highTaskPoints: number
    urgentTaskPoints: number
    dealClosePoints: number
    saleClosePoints: number
  }
}

const roles = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full authority over employees, deals, task verification, commissions, and security logs.', color: 'bg-red-100 text-red-800' },
  { role: 'ADMIN', label: 'Admin', desc: 'Manage properties, schedules, client visits, and create permitted team tasks.', color: 'bg-purple-100 text-purple-800' },
  { role: 'AGENT', label: 'Agent', desc: 'Manage assigned properties, clients met personally, complete duties, and track commission ledger.', color: 'bg-blue-100 text-blue-800' },
  { role: 'EDITOR', label: 'Editor', desc: 'Edit website marketing banners, blogs, news, and client testimonials.', color: 'bg-emerald-100 text-emerald-800' },
]

export function SettingsClient({
  userName,
  userEmail,
  userRole,
  userPhone = '',
  isGoogleConnected,
  googleEmail,
  stars,
  performancePoints,
  settings,
}: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState(userPhone)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false)

  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  const handleSaveProfile = () => {
    setProfileMsg(null)
    startTransition(async () => {
      const result = await updateProfile({ name, phone: phone || undefined })
      if (result.success) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
        toast.success('Profile updated!')
      } else {
        setProfileMsg({ type: 'error', text: result.error || 'Failed to update profile' })
        toast.error(result.error || 'Failed to update profile')
      }
    })
  }

  const handleChangePassword = () => {
    setPasswordMsg(null)
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Both fields are required' })
      return
    }
    startTransition(async () => {
      const result = await changePassword({ currentPassword, newPassword })
      if (result.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' })
        toast.success('Password updated!')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        setPasswordMsg({ type: 'error', text: result.error || 'Failed to change password' })
        toast.error(result.error || 'Failed to change password')
      }
    })
  }

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar integration?')) return
    setIsDisconnectingGoogle(true)
    try {
      const res = await fetch('/api/auth/google/disconnect', { method: 'POST' })
      if (res.ok) {
        toast.success('Google Calendar disconnected.')
        router.refresh()
      } else {
        toast.error('Failed to disconnect Google Calendar')
      }
    } catch {
      toast.error('Error disconnecting Google Calendar')
    } finally {
      setIsDisconnectingGoogle(false)
    }
  }

  const handleSaveCommissionRules = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updatePerformanceSettings({
        defaultCommissionRate: Number(formData.get('defaultCommissionRate')),
        normalTaskPoints: Number(formData.get('normalTaskPoints')),
        highTaskPoints: Number(formData.get('highTaskPoints')),
        urgentTaskPoints: Number(formData.get('urgentTaskPoints')),
        dealClosePoints: Number(formData.get('dealClosePoints')),
        saleClosePoints: Number(formData.get('saleClosePoints')),
      })
      if (res.success) {
        toast.success('System commission & scoring rules saved!')
      } else {
        toast.error(res.error || 'Failed to update rules')
      }
    })
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Integrations</h1>
        <p className="text-gray-500 text-sm">Manage profile, Google Calendar synchronization, performance metrics, and security preferences.</p>
      </div>

      {/* Google Calendar Integration Box */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 text-md">
            <Calendar className="h-5 w-5 text-emerald-600" /> Google Calendar Integration (OAuth 2.0)
          </h2>
          <span className="text-xs text-gray-400">Timezone: Asia/Kathmandu (UTC+5:45)</span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Synchronize your property visits and client meetings directly with your Google Calendar. Any new visit scheduled or rescheduled will automatically update your personal appointments.
        </p>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${isGoogleConnected ? 'bg-emerald-600' : 'bg-gray-400'}`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                {isGoogleConnected ? `Connected Account: ${googleEmail || 'Google Calendar'}` : 'Google Calendar Not Connected'}
              </p>
              <p className="text-[11px] text-gray-500">
                {isGoogleConnected
                  ? 'Visits scheduled in CRM are automatically synchronized with Google Calendar.'
                  : 'Connect your Google account to enable 2-way appointment synchronization.'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {isGoogleConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                disabled={isDisconnectingGoogle}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Unlink className="h-3.5 w-3.5" /> Disconnect Calendar
              </button>
            ) : (
              <a
                href="/api/auth/google/connect?returnPath=/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Connect Google Calendar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Profile Section & Performance Points Badge */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 text-md">
            <User className="h-5 w-5 text-emerald-600" /> Account Profile
          </h2>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
              <Star className="h-3.5 w-3.5 fill-amber-400" /> {stars} Stars
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
              <Award className="h-3.5 w-3.5 text-emerald-600" /> {performancePoints} pts
            </div>
          </div>
        </div>

        {profileMsg && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {profileMsg.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {profileMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email Address</label>
            <input value={userEmail} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977-XXXXXXXXXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned Role</label>
            <input value={userRole} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 font-bold uppercase cursor-not-allowed" />
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs">
          {isPending ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </div>

      {/* Super Admin Commission & Scoring Rules Configuration */}
      {isSuperAdmin && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 text-md">
              <Sliders className="h-5 w-5 text-emerald-600" /> System Commission & Performance Rules
            </h2>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">Super Admin Only</span>
          </div>

          <form onSubmit={handleSaveCommissionRules} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Default Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="defaultCommissionRate"
                  defaultValue={settings.defaultCommissionRate}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Normal Task Points (+1 ⭐)</label>
                <input
                  type="number"
                  name="normalTaskPoints"
                  defaultValue={settings.normalTaskPoints}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">High Priority Points (+2 ⭐)</label>
                <input
                  type="number"
                  name="highTaskPoints"
                  defaultValue={settings.highTaskPoints}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Urgent Task Points (+3 ⭐)</label>
                <input
                  type="number"
                  name="urgentTaskPoints"
                  defaultValue={settings.urgentTaskPoints}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Closed Deal Points</label>
                <input
                  type="number"
                  name="dealClosePoints"
                  defaultValue={settings.dealClosePoints}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Property Sale Points</label>
                <input
                  type="number"
                  name="saleClosePoints"
                  defaultValue={settings.saleClosePoints}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                />
              </div>
            </div>

            <button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs">
              Save System Rules
            </button>
          </form>
        </div>
      )}

      {/* Role Management Guide */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 text-md">
          <Shield className="h-5 w-5 text-emerald-600" /> Roles & System Permissions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.role} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-1.5">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-block ${r.color}`}>{r.label}</span>
              <p className="text-xs text-gray-600 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security / Password Section */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 text-md">
          <Lock className="h-5 w-5 text-emerald-600" /> Password & Authentication Security
        </h2>

        {passwordMsg && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {passwordMsg.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {passwordMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <button onClick={handleChangePassword} disabled={isPending} className="bg-gray-900 hover:bg-black disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs">
          {isPending ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}
