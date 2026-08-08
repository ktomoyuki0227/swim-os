import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { AvatarWarningBanner } from "@/components/avatar-warning-banner"
import { PageTransition } from "@/components/page-transition"
import { getUnreadNotificationCount } from "@/actions/notifications"
import { getOrCreateStripeCustomer } from "@/lib/stripe-helpers"

export default async function AppLayout({
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

  const [profileResult, unreadResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, avatar_url, onboarding_completed_at, stripe_customer_id")
      .eq("id", user.id)
      .single(),
    getUnreadNotificationCount(),
  ])

  const profile = profileResult.data

  if (!profile) {
    // プロフィールなし = 不完全なアカウント状態。サインアウトしてから /login に戻す
    try { await supabase.auth.signOut() } catch { /* ネットワーク障害時もリダイレクトを続行 */ }
    redirect("/login")
  }

  if (!profile.onboarding_completed_at) {
    redirect("/onboarding")
  }

  // Stripe Customer 自動マイグレーション: 未作成のユーザーは非同期で作成（ページ描画はブロックしない）
  if (!profile.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
    getOrCreateStripeCustomer(user.id, user.email ?? "", profile.name).catch((err) =>
      console.error("[stripe] auto-migration failed:", err)
    )
  }

  return (
    <AppShell userName={profile.name} avatarUrl={profile.avatar_url} unreadCount={unreadResult.count} showNavigationProgress>
      {!profile.avatar_url && <AvatarWarningBanner />}
      <PageTransition>{children}</PageTransition>
    </AppShell>
  )
}
