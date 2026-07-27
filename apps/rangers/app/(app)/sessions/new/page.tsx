import { Suspense } from "react"
import { getTeamTemplates } from "@/actions/templates"
import { getMyTeams } from "@/actions/teams"
import { NewSessionForm } from "./new-session-form"
import type { AdminTeamOption, TemplateOption } from "./types"

interface Props {
  searchParams: Promise<{ team?: string; copy?: string }>
}

export default async function NewSessionPage({ searchParams }: Props) {
  const { team: teamId } = await searchParams

  let initialTemplates: TemplateOption[] = []
  let initialTeamId = teamId || ""

  if (teamId) {
    const { data } = await getTeamTemplates(teamId)
    initialTemplates = (data || []) as TemplateOption[]
  } else {
    const { data: teams } = await getMyTeams()
    const adminOnly = ((teams || []) as AdminTeamOption[]).filter(
      (t) => t.my_role === "admin"
    )
    if (adminOnly.length === 1) {
      initialTeamId = adminOnly[0].id
      const { data } = await getTeamTemplates(initialTeamId)
      initialTemplates = (data || []) as TemplateOption[]
    }
  }

  return (
    <Suspense fallback={<div className="p-4 text-sm text-[#475569]">読み込み中...</div>}>
      <NewSessionForm initialTemplates={initialTemplates} initialTeamId={initialTeamId} />
    </Suspense>
  )
}
