import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InstructorSessionDetailRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/sessions/${id}`)
}
