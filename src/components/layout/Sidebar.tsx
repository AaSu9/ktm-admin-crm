'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users2,
  UserRound,
  CalendarCheck,
  UserCog,
  MessageSquare,
  BarChart3,
  FileEdit,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  X,
  Sparkles,
  DollarSign,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/leads', label: 'Leads', icon: Users2 },
  { href: '/matches', label: 'Auto Matching', icon: Sparkles },
  { href: '/customers', label: 'Customers', icon: UserRound },
  { href: '/visits', label: 'Visits', icon: CalendarCheck },
  { href: '/deals', label: 'Deals & Commission', icon: DollarSign },
  { href: '/agents', label: 'Agents', icon: UserCog },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/content', label: 'Content', icon: FileEdit },
  { href: '/blogs', label: 'Blogs', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0f2212] border-r border-white/5 transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="KTM RealState" className="h-8 w-8 rounded-lg object-contain flex-shrink-0" />
            <div>
              <p className="text-white font-bold text-sm leading-none">KTM RealState</p>
              <p className="text-emerald-400/70 text-xs mt-0.5">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/logo.png" alt="KTM RealState" className="h-9 w-9 rounded-xl object-contain" />
        )}
        <button onClick={onMobileClose} className="lg:hidden text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-emerald-400' : 'text-white/50 group-hover:text-white')} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
