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
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="検索..."
            className="pl-9 w-64 h-9 bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
            {profile?.name?.charAt(0) ?? 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
