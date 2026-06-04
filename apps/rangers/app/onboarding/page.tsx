import { redirect } from "next/navigation"

interface OnboardingPageProps {
  searchParams: Promise<{ invite?: string }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { invite } = await searchParams
  if (invite) {
    redirect(`/teams/join/${invite}`)
  }
  redirect("/dashboard")
}
