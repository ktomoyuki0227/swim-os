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
  ChevronRight,
  Waves,
  LogOut,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/admin/members', label: '会員管理', icon: Users },
  { href: '/admin/schedules', label: 'スケジュール', icon: Calendar },
  { href: '/admin/attendance', label: '出席管理', icon: ClipboardCheck },
  { href: '/admin/fees', label: '月謝管理', icon: CreditCard },
  { href: '/admin/grades', label: '育成級管理', icon: Star },
  { href: '/admin/announcements', label: 'お知らせ', icon: Bell },
  { href: '/admin/analytics', label: 'データ分析', icon: TrendingUp },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white flex-shrink-0">
          <Waves className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">SchoolBoost AI</p>
          <p className="text-xs text-gray-400 truncate">HYDOOR</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </Button>
        </form>
      </div>
    </aside>
  )
}
