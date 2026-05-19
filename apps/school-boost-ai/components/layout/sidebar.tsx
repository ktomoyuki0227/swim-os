'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  CreditCard,
  Bell,
  TrendingUp,
  Waves,
  LogOut,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'

const navGroups = [
  {
    label: '管理',
    items: [
      { href: '/admin/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
      { href: '/admin/members', label: '会員管理', icon: Users },
      { href: '/admin/schedules', label: 'スケジュール', icon: Calendar },
    ],
  },
  {
    label: '運営',
    items: [
      { href: '/admin/attendance', label: '出席管理', icon: ClipboardCheck },
      { href: '/admin/fees', label: '月謝管理', icon: CreditCard },
      { href: '/admin/grades', label: '育成級管理', icon: Star },
    ],
  },
  {
    label: 'その他',
    items: [
      { href: '/admin/announcements', label: 'お知らせ', icon: Bell },
      { href: '/admin/analytics', label: 'データ分析', icon: TrendingUp },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 flex flex-col z-30 bg-[oklch(0.17_0.055_240)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-500 text-white flex-shrink-0 shadow-lg shadow-sky-500/30">
            <Waves className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">SchoolBoost AI</p>
            <p className="text-xs text-sky-300/50 truncate">HYDOOR</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-sky-300/40 uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'text-sky-100/50 hover:bg-white/5 hover:text-sky-100'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-sky-100/40 hover:text-sky-100 hover:bg-white/5 text-sm"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </form>
      </div>
    </aside>
  )
}
