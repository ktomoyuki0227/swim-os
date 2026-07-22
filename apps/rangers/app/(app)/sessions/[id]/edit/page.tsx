export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { getSession } from "@/actions/sessions"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { EditSessionForm } from "./edit-session-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditSessionPage({ params }: PageProps) {
  const { id } = await params

  const result = await getSession(id)
  if (result.error || !result.data) notFound()

  const session = result.data
  const team = session.team as Record<string, unknown>

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const adminClient = createAdminClient()
  const { data: membership } = await adminClient
    .from("team_members")
    .select("role")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (membership?.role !== "admin") {
    redirect(`/sessions/${id}`)
  }

  return (
    <EditSessionForm
      session={session}
      teamId={session.team_id as string}
      teamName={(team?.name as string) || ""}
    />
  )
}
