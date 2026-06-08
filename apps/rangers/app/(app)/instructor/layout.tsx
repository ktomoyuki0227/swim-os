import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"

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

  // adminClient でRLSをバイパスしてチーム管理者かどうかを判定
  const adminClient = createAdminClient()
  const { data: adminMemberships } = await adminClient
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
