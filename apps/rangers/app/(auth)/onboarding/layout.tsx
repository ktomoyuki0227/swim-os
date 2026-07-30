import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/actions/auth"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (profile?.onboarding_completed_at) {
    redirect("/dashboard")
  }

  return (
    <>
      {/* 途中で別アカウントに切り替えたい場合の離脱導線。
          ログイン中は /login に来ても自動でここへ戻されるため、
          明示的なログアウト手段がないと別アカウントに切り替えられない */}
      <div className="mx-auto mb-3 flex w-full max-w-lg items-center justify-between text-xs text-[#64748b]">
        <span className="truncate">{user.email ?? "アカウント"} としてログイン中</span>
        <form action={logout}>
          <button type="submit" className="shrink-0 text-[#005F8C] underline hover:no-underline">
            別のアカウントで登録する
          </button>
        </form>
      </div>
      {children}
    </>
  )
}
