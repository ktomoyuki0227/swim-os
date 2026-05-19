'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, CreditCard, Star, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/parent/mypage', label: 'ホーム', icon: Home },
  { href: '/parent/attendance', label: '出席', icon: Calendar },
  { href: '/parent/fees', label: '月謝', icon: CreditCard },
  { href: '/parent/grades', label: '育成級', icon: Star },
  { href: '/parent/announcements', label: 'お知らせ', icon: Bell },
]

export function ParentBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[oklch(0.9_0.008_240)] z-30 pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-6 rounded-full transition-all',
                isActive ? 'bg-sky-500/10' : ''
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-sky-500' : 'text-gray-400'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-sky-500' : 'text-gray-400'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
