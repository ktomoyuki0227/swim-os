import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Waves, Home, Calendar, CreditCard, Star, Bell } from 'lucide-react'
import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Admins and coaches can also access parent view for demo
  // In production, parents are role='parent'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">SchoolBoost</span>
        </div>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit" className="text-xs text-gray-500">
            ログアウト
          </Button>
        </form>
      </header>

      <main>{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 pb-safe">
        <div className="grid grid-cols-5 h-16">
          {[
            { href: '/parent/mypage', label: 'ホーム', icon: Home },
            { href: '/parent/attendance', label: '出席', icon: Calendar },
            { href: '/parent/fees', label: '月謝', icon: CreditCard },
            { href: '/parent/grades', label: '育成級', icon: Star },
            { href: '/parent/announcements', label: 'お知らせ', icon: Bell },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
