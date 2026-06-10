import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InstructorTeamDetailRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/teams/${id}`)
}
