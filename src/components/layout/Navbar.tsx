'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, CheckSquare, Settings, Calendar, ShieldCheck } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'

interface NavbarProps {
  onMenuClick: () => void
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

export function Navbar({ onMenuClick, onToggleSidebar, sidebarCollapsed }: NavbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userRole = (session?.user as { role?: string })?.role || 'AGENT'

  const breadcrumb = pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setUserDropdownOpen(false)
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 flex items-center justify-between gap-4 shrink-0 z-20 sticky top-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <Menu className="h-5 w-5" />
        </button>
        {/* Desktop collapse */}
        <button onClick={onToggleSidebar} className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1.5 text-sm">
          <span className="text-gray-400">KTM RealEstate</span>
          {breadcrumb.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-gray-300">/</span>
              <span className={i === breadcrumb.length - 1 ? 'text-gray-800 font-semibold' : 'text-gray-500'}>
                {seg}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Quick link: Calendar */}
        <Link
          href="/visits"
          title="Visits & Calendar"
          className="p-2 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors hidden md:flex items-center gap-1.5 text-xs font-semibold"
        >
          <Calendar className="h-4 w-4" />
          <span>Visits</span>
        </Link>

        {/* Quick link: My Tasks */}
        <Link
          href="/tasks"
          title="Task Management"
          className="p-2 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors hidden md:flex items-center gap-1.5 text-xs font-semibold"
        >
          <CheckSquare className="h-4 w-4" />
          <span>Tasks</span>
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* User Session Dropdown */}
        <div className="relative pl-2 border-l border-gray-100" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-50 transition-colors text-left focus:outline-none"
            aria-label="User Account Menu"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
              {getInitials(session?.user?.name || 'Admin')}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-gray-800 leading-none">{session?.user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{userRole.replace('_', ' ')}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">{session?.user?.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{session?.user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                  <ShieldCheck className="h-3 w-3" /> {userRole.replace('_', ' ')}
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/tasks"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                >
                  <CheckSquare className="h-4 w-4 text-gray-400" /> My Assigned Tasks
                </Link>
                <Link
                  href="/visits"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                >
                  <Calendar className="h-4 w-4 text-gray-400" /> Visits & Calendar Sync
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-400" /> Settings & Integrations
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1 mt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2 w-full text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500" /> End Session / Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
