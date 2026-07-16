'use client'

import { useState, useTransition } from 'react'
import { Settings, Shield, Bell, User, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { updateProfile, changePassword } from '@/app/actions/settings'

interface SettingsClientProps {
  userName: string
  userEmail: string
  userRole: string
}

const roles = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full access to all modules. Can manage users, roles, and settings.', color: 'bg-red-100 text-red-700' },
  { role: 'ADMIN', label: 'Admin', desc: 'Access to all CRM features except user and role management.', color: 'bg-purple-100 text-purple-700' },
  { role: 'AGENT', label: 'Agent', desc: 'Can manage leads, visits, and properties assigned to them.', color: 'bg-blue-100 text-blue-700' },
  { role: 'EDITOR', label: 'Editor', desc: 'Can edit website content, blogs, testimonials, and CMS sections.', color: 'bg-emerald-100 text-emerald-700' },
]

const notificationSettings = [
  ['New Lead Alert', 'Get notified when a new lead is submitted'],
  ['Visit Reminders', 'Reminder 1 hour before a scheduled visit'],
  ['Message Alerts', 'Email notification for new contact messages'],
  ['Property Updates', 'Notify when a property status changes'],
]

export function SettingsClient({ userName, userEmail, userRole }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [notifToggles, setNotifToggles] = useState([true, true, true, true])

  const handleSaveProfile = () => {
    setProfileMsg(null)
    startTransition(async () => {
      const result = await updateProfile({ name, phone: phone || undefined })
      if (result.success) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        setProfileMsg({ type: 'error', text: result.error || 'Failed to update profile' })
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
        setCurrentPassword('')
        setNewPassword('')
      } else {
        setPasswordMsg({ type: 'error', text: result.error || 'Failed to change password' })
      }
    })
  }

  const toggleNotif = (index: number) => {
    setNotifToggles(prev => {
      const next = [...prev]
      next[index] = !next[index]
      // Persist to localStorage
      try { localStorage.setItem('notif_prefs', JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account and system preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <User className="h-5 w-5 text-emerald-600" /> Profile Settings
        </h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white font-bold text-2xl">
            {userName?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{userName}</p>
            <p className="text-sm text-gray-500">{userEmail}</p>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
              {userRole || 'ADMIN'}
            </span>
          </div>
        </div>

        {profileMsg && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl mb-4 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {profileMsg.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {profileMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
            <input value={userEmail} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977-XXXXXXXXXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</label>
            <input defaultValue="Kathmandu, Nepal" disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 cursor-not-allowed" />
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={isPending} className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Role Management */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <Shield className="h-5 w-5 text-emerald-600" /> Roles & Permissions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.role} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.color}`}>{r.label}</span>
              </div>
              <p className="text-sm text-gray-500">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <Bell className="h-5 w-5 text-emerald-600" /> Notification Settings
        </h2>
        <div className="space-y-4">
          {notificationSettings.map(([label, desc], i) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <button
                onClick={() => toggleNotif(i)}
                className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${notifToggles[i] ? 'bg-emerald-500' : 'bg-gray-300'}`}
                role="switch"
                aria-checked={notifToggles[i]}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${notifToggles[i] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <Lock className="h-5 w-5 text-emerald-600" /> Security
        </h2>

        {passwordMsg && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl mb-4 ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {passwordMsg.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {passwordMsg.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={isPending} className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            {isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
