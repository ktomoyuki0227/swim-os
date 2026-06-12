import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTeam } from "@/actions/teams"
import { EditTeamForm } from "./edit-team-form"

interface EditTeamPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 管理者権限チェック
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .single()

  if (membership?.role !== "admin") notFound()

  const result = await getTeam(id)
  if (result.error || !result.data) notFound()

  return <EditTeamForm team={result.data} />
}
