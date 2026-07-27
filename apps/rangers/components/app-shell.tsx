import { Navigation } from "@/components/navigation"
import { NavigationProgress } from "@/components/navigation-progress"
import { ToastProvider } from "@/components/toast"

interface AppShellProps {
  userName: string
  avatarUrl?: string | null
  unreadCount?: number
  inactiveRoutes?: string[]
  showNavigationProgress?: boolean
  mainClassName?: string
  children: React.ReactNode
}

const DEFAULT_MAIN_CLASSNAME = "mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 pb-24 md:pb-6"

/**
 * ToastProvider + Navigation + main の組み合わせ。
 * app/(app)/layout.tsx と app/teams/[id]/page.tsx（ルートグループ外にある
 * チーム詳細ページ。非ログインユーザー向け公開ビューを出すため意図的に
 * (app) グループの外に置かれている）の両方で同じ構成が必要になるため共通化した。
 */
export function AppShell({
  userName,
  avatarUrl,
  unreadCount,
  inactiveRoutes,
  showNavigationProgress = false,
  mainClassName,
  children,
}: AppShellProps) {
  return (
    <ToastProvider>
      {showNavigationProgress && <NavigationProgress />}
      <Navigation
        userName={userName}
        avatarUrl={avatarUrl}
        unreadCount={unreadCount}
        inactiveRoutes={inactiveRoutes}
      />
      <main className={mainClassName ?? DEFAULT_MAIN_CLASSNAME}>{children}</main>
    </ToastProvider>
  )
}
