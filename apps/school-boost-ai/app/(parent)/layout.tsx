import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParentBottomNav } from '@/components/layout/parent-bottom-nav'
import { Waves } from 'lucide-react'
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

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.004_240)] pb-20">
      {/* Mobile header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[oklch(0.9_0.008_240)] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm shadow-sky-500/30">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900">SchoolBoost</span>
        </div>
        <form action={logout}>
          <Button variant="ghost" size="sm" type="submit" className="text-xs text-gray-400 h-8 px-3">
            ログアウト
          </Button>
        </form>
      </header>

      <main>{children}</main>

      <ParentBottomNav />
    </div>
  )
}
