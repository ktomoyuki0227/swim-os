import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getCurrentProfile } from '@/actions/auth'

interface HeaderProps {
  title: string
}

export async function Header({ title }: HeaderProps) {
  const profile = await getCurrentProfile()

  return (
    <header className="h-16 border-b border-[oklch(0.9_0.008_240)] bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20">
      <h1 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="検索..."
            className="pl-9 w-56 h-8 bg-gray-50 border-gray-200 focus:bg-white text-sm rounded-lg"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative w-8 h-8 rounded-lg hover:bg-gray-100">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </Button>

        <Avatar className="w-8 h-8 ring-2 ring-sky-100">
          <AvatarFallback className="bg-sky-500 text-white text-xs font-semibold">
            {profile?.name?.charAt(0) ?? 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
