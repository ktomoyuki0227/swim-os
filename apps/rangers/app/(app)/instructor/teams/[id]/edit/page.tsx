import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InstructorTeamEditRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/teams/${id}/edit`)
}
