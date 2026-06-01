import { notFound } from "next/navigation"
import { getTeam } from "@/actions/teams"
import { EditTeamForm } from "./edit-team-form"

interface EditTeamPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id } = await params
  const result = await getTeam(id)
  if (result.error || !result.data) notFound()

  return <EditTeamForm team={result.data} />
}
