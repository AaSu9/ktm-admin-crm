'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
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

  const breadcrumb = pathname
    .split('/')
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 flex items-center justify-between gap-4 flex-shrink-0 z-10">
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
          <span className="text-gray-400">RealtoCRM</span>
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
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hidden sm:flex">
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications — now using real NotificationBell component */}
        <NotificationBell />

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-100">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
            {getInitials(session?.user?.name || 'Admin')}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-none">{session?.user?.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{(session?.user as any)?.role || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
