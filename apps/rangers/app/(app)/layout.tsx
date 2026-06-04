import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { ToastProvider } from "@/components/toast"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [{ data: profile }, { data: adminMemberships }] = await Promise.all([
    supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single(),
    supabase.from("team_members").select("id").eq("swimmer_id", user.id).eq("role", "admin").limit(1),
  ])

  if (!profile) {
    // プロフィールなし = 不完全なアカウント状態。サインアウトしてから /login に戻す
    await supabase.auth.signOut()
    redirect("/login")
  }

  const hasAdminTeams = (adminMemberships?.length ?? 0) > 0

  return (
    <ToastProvider>
      <Navigation hasAdminTeams={hasAdminTeams} userName={profile.name} avatarUrl={profile.avatar_url} />
      <main className="mx-auto max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
    </ToastProvider>
  )
}
