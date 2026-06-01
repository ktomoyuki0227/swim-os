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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    // プロフィールなし = 不完全なアカウント状態。サインアウトしてから /login に戻す
    // （サインアウトせずにリダイレクトすると middleware が /dashboard に戻してループする）
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <ToastProvider>
      <Navigation role={profile.role} userName={profile.name} avatarUrl={profile.avatar_url} />
      <main className="mx-auto max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-6">{children}</main>
    </ToastProvider>
  )
}
