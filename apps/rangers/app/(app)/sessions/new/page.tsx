import { Suspense } from "react"
import { getTeamTemplates } from "@/actions/templates"
import { getMyTeams } from "@/actions/teams"
import { NewSessionForm } from "./new-session-form"

interface Props {
  searchParams: Promise<{ team?: string; copy?: string }>
}

export default async function NewSessionPage({ searchParams }: Props) {
  const { team: teamId } = await searchParams

  let initialTemplates: Record<string, unknown>[] = []
  let initialTeamId = teamId || ""

  if (teamId) {
    const { data } = await getTeamTemplates(teamId)
    initialTemplates = data || []
  } else {
    const { data: teams } = await getMyTeams()
    const adminOnly = ((teams || []) as Record<string, unknown>[]).filter(
      (t) => t.my_role === "admin"
    )
    if (adminOnly.length === 1) {
      initialTeamId = adminOnly[0].id as string
      const { data } = await getTeamTemplates(initialTeamId)
      initialTemplates = data || []
    }
  }

  return (
    <Suspense fallback={<div className="p-4 text-sm text-[#475569]">読み込み中...</div>}>
      <NewSessionForm initialTemplates={initialTemplates} initialTeamId={initialTeamId} />
    </Suspense>
  )
}
