import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // チーム管理者かどうかを team_members で判定（profile.role に依存しない）
  const { data: adminMemberships } = await supabase
    .from("team_members")
    .select("id")
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .limit(1)

  if (!adminMemberships || adminMemberships.length === 0) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
