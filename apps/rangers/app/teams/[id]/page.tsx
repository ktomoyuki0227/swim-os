export const dynamic = "force-dynamic"

import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTeam, getTeamMembers, getTeamFeeStats, getPublicTeam } from "@/actions/teams"
import { getTeamSessions } from "@/actions/sessions"
import { AppShell } from "@/components/app-shell"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicTeamView } from "@/components/teams/public-team-view"
import { AdminActionButtons } from "@/app/(app)/teams/[id]/admin-action-buttons"
import { getTeamJoinRequests, getMyJoinRequest } from "@/actions/join-requests"
import { ContactInfoButton } from "@/components/teams/contact-info-button"
import { AdminTeamActions } from "@/app/(app)/teams/[id]/admin-team-actions"
import { TeamDescription } from "@/app/(app)/teams/[id]/team-description"
import { MemberSessionList } from "@/app/(app)/teams/[id]/member-session-list"
import { AdminSessionList } from "@/app/(app)/teams/[id]/admin-session-list"
import { MemberPreviewBar } from "@/app/(app)/teams/[id]/member-preview-bar"
import { InviteButton } from "@/app/(app)/teams/[id]/invite-button"
import { StripeSetupBanner } from "@/app/(app)/teams/[id]/stripe-setup-banner"
import { BackLink } from "@/components/back-link"

interface TeamPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ─── 非ログインユーザー: 公開グループページ ─────────────────────────────
  if (!user) {
    const result = await getPublicTeam(id)
    if (result.error || !result.data) notFound()

    return (
      <div className="flex min-h-screen flex-col">
        <PublicHeader user={null} />
        <main className="flex-1">
          <PublicTeamView data={result.data} hasBottomNav={false} isLoggedIn={false} />
        </main>
        <PublicFooter />
      </div>
    )
  }

  // ─── ログイン済み: プロフィール取得 ──────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url, onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect("/login")
  }

  if (!profile.onboarding_completed_at) {
    redirect("/onboarding")
  }

  // メンバーシップ確認（RLS バイパスのため adminClient 使用）
  const adminClient = createAdminClient()
  const { data: myMembership } = await adminClient
    .from("team_members")
    .select("role")
    .eq("team_id", id)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  const isAdmin = myMembership?.role === "admin"
  const isMember = !!myMembership

  // ─── 非メンバー: 公開ビュー（アプリナビ付き）──────────────────────────
  if (!isMember) {
    const [publicResult, joinRequestResult] = await Promise.all([
      getPublicTeam(id),
      getMyJoinRequest(id),
    ])
    if (publicResult.error || !publicResult.data) notFound()

    const joinRequestStatus = (joinRequestResult.data?.status ?? null) as "pending" | "approved" | "rejected" | null

    return (
      <AppShell
        userName={profile.name}
        avatarUrl={profile.avatar_url}
        inactiveRoutes={["/teams"]}
        mainClassName="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-6 pb-24 md:pb-6"
      >
        {/* -mx-4 -mt-6 は layout の padding を打ち消して PublicTeamView をフルブリードにする */}
        <div className="-mx-4 -mt-6">
          <PublicTeamView data={publicResult.data} hasBottomNav={true} joinRequestStatus={joinRequestStatus} isLoggedIn={true} />
        </div>
      </AppShell>
    )
  }

  // ─── 管理者ビュー ─────────────────────────────────────────────────
  if (isAdmin) {
    const [teamResult, membersResult, sessionsResult, feeStatsResult, joinRequestsResult] = await Promise.all([
      getTeam(id),
      getTeamMembers(id),
      getTeamSessions(id),
      getTeamFeeStats(id),
      getTeamJoinRequests(id),
    ])

    if (teamResult.error || !teamResult.data) notFound()

    const team = teamResult.data
    const members = membersResult.data || []
    // 中止済みも含めて全件保持する(過去タブで「なぜ消えたか」がわかるよう中止バッジで表示するため。
    // MemberSessionListと同じ方針)。今後/過去の絞り込み・件数上限はAdminSessionList側で行う
    const allSessions = (sessionsResult.data || []) as Record<string, unknown>[]
    const joinRequests = joinRequestsResult.data || []
    const feeStats = feeStatsResult.data ?? null

    // 現金払いでまだ受領済みになっていない参加登録の件数をセッションごとに集計
    // (過去タブで「集金し忘れ」を一目でわかるようにするため。フィードバック対応)
    const sessionIds = allSessions.map((s) => s.id as string)
    const { data: pendingCashRegs } = sessionIds.length > 0
      ? await adminClient
          .from("session_registrations")
          .select("session_id")
          .in("session_id", sessionIds)
          .eq("payment_method", "cash")
          .eq("payment_status", "pending")
          .is("cancelled_at", null)
      : { data: [] as { session_id: string }[] | null }
    const pendingCashCountBySession = new Map<string, number>()
    for (const reg of pendingCashRegs || []) {
      pendingCashCountBySession.set(reg.session_id, (pendingCashCountBySession.get(reg.session_id) ?? 0) + 1)
    }

    const adminSessionItems = allSessions.map((s) => ({
      id: s.id as string,
      title: s.title as string,
      scheduled_at: s.scheduled_at as string,
      location: s.location as string | null,
      type: s.type as string,
      session_status: s.session_status as string,
      pendingCashCount: pendingCashCountBySession.get(s.id as string) ?? 0,
    }))

    const adminMembers = members.filter((m: Record<string, unknown>) => m.role === "admin")
    const previewMembers = members.slice(0, 3)

    return (
      <AppShell
        userName={profile.name}
        avatarUrl={profile.avatar_url}
        mainClassName="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-4 pb-24 md:pb-6"
      >
          <div className="space-y-4">

            {/* ── トップバー ── */}
            <div className="flex items-center justify-between">
              <BackLink
                href="/teams"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dce3ea] bg-white transition-colors hover:bg-[#f2f7fa]"
                aria-label="戻る"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </BackLink>
              <span className="text-sm text-[#475569]">グループ</span>
              <AdminActionButtons team={team} />
            </div>

            {/* ── 決済設定バナー ── */}
            {(team.has_session_fee || team.has_annual_fee || team.has_monthly_fee || team.has_point_card) &&
              !team.stripe_onboarding_completed && process.env.STRIPE_SECRET_KEY && (
              <StripeSetupBanner
                teamId={id}
                hasStripeAccount={!!team.stripe_account_id}
                onboardingCompleted={team.stripe_onboarding_completed ?? false}
              />
            )}

            {/* ── グループ名 + 説明 ── */}
            <div>
              <h1 className="text-xl font-bold text-[#1a2332]">{team.name}</h1>
              {team.description && (
                <div className="mt-2">
                  <TeamDescription text={team.description} />
                </div>
              )}
            </div>

            {/* ── メンバープレビュー + 招待 ── */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-[9px] rounded-full bg-[#f2f7fa] py-[6px] pl-[7px] pr-[15px]">
                <div className="flex -space-x-[6px]">
                  {previewMembers.map((m: Record<string, unknown>, i: number) => {
                    const swimmer = m.swimmer as Record<string, unknown> | null
                    const avatarUrl = swimmer?.avatar_url as string | null
                    const name = (swimmer?.name as string) || ""
                    return (
                      <div
                        key={m.id as string}
                        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#f2f7fa] bg-[#005F8C]/10 text-[11px] font-semibold text-[#005F8C]"
                        style={{ zIndex: 3 - i }}
                      >
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                        ) : (
                          name[0] || "?"
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="text-sm font-semibold text-[#1a2332]">{members.length}人のメンバー</span>
              </div>
              <InviteButton inviteCode={team.invite_code} />
            </div>

            {/* ── アクションボタン + ウィザード ── */}
            <AdminTeamActions
              teamId={id}
              joinRequests={joinRequests}
              feeStats={feeStats}
            />

            {/* ── 主催者 ── */}
            {adminMembers.length > 0 && (
              <div className="rounded-[14px] border border-[#dce3ea] bg-white px-4 py-3">
                <p className="mb-2 text-sm font-semibold text-[#475569]">主催者</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    {adminMembers.slice(0, 3).map((m: Record<string, unknown>, i: number) => {
                      const swimmer = m.swimmer as Record<string, unknown> | null
                      const avatarUrl = swimmer?.avatar_url as string | null
                      const name = (swimmer?.name as string) || ""
                      return (
                        <div
                          key={m.id as string}
                          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]"
                          style={{ zIndex: 3 - i }}
                        >
                          {avatarUrl ? (
                            <Image src={avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
                          ) : (
                            name[0] || "?"
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-sm font-semibold text-[#1a2332]">
                    {((adminMembers[0] as Record<string, unknown>).swimmer as Record<string, unknown> | null)?.name as string || ""}
                    {adminMembers.length > 1 && (
                      <span className="font-normal text-[#475569]"> 他{adminMembers.length - 1}人</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* ── セッション一覧（今後/過去切り替え）── */}
            <AdminSessionList sessions={adminSessionItems} />

          </div>
      </AppShell>
    )
  }

  // ─── メンバービュー ────────────────────────────────────────────────
  const [teamResult, sessionsResult, memberPreviewResult] = await Promise.all([
    getTeam(id),
    getTeamSessions(id),
    // メンバープレビュー用（管理者権限不要な軽量クエリ）
    adminClient
      .from("team_members")
      .select("id, swimmer:profiles(id, name, avatar_url)")
      .eq("team_id", id)
      .eq("status", "active")
      .order("joined_at", { ascending: true })
      .limit(50),
  ])

  if (teamResult.error || !teamResult.data) notFound()

  const team = teamResult.data
  const allMembers = memberPreviewResult.data || []
  // 中止済みセッションも表示対象に含める。除外すると一覧から突然消えて
  // 「なぜ消えたか」が分からなくなるため、MemberSessionList側の「中止」バッジで
  // 明示的に状態を伝える(除外していた場合はここに絞り込みを戻す)
  const allSessions = ((sessionsResult.data || []) as Record<string, unknown>[])
    .sort(
      (a, b) =>
        new Date(a.scheduled_at as string).getTime() -
        new Date(b.scheduled_at as string).getTime()
    )
  // 自分の参加済みセッション ID を取得
  let registeredSessionIds = new Set<string>()
  if (allSessions.length > 0) {
    const sessionIds = allSessions.map((s) => s.id as string)
    const { data: regs } = await supabase
      .from("session_registrations")
      .select("session_id")
      .eq("swimmer_id", user.id)
      .in("session_id", sessionIds)
      .is("cancelled_at", null)
    registeredSessionIds = new Set((regs || []).map((r) => r.session_id))
  }

  // MemberSessionList に渡すデータ
  const sessionItems = allSessions.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    scheduled_at: s.scheduled_at as string,
    location: s.location as string | null,
    type: s.type as string,
    session_status: s.session_status as string,
    member_price: (s.member_price as number) || 0,
    registration_deadline: (s.registration_deadline as string | null),
    is_registered: registeredSessionIds.has(s.id as string),
  }))

  return (
    <AppShell
      userName={profile.name}
      avatarUrl={profile.avatar_url}
      mainClassName="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-4 pb-24 md:pb-6"
    >
      <div className="space-y-4">

          {/* ── トップバー ── */}
          <div className="flex items-center justify-between">
            <BackLink
              href="/teams"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dce3ea] bg-white transition-colors hover:bg-[#f2f7fa]"
              aria-label="戻る"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </BackLink>
            <span className="text-sm text-[#475569]">グループ</span>
            <div className="flex items-center gap-2">
              {(team.contact_email || team.contact_phone) && (
                <ContactInfoButton
                  teamId={team.id}
                  contactEmail={(team.contact_email as string | null) ?? null}
                  contactPhone={(team.contact_phone as string | null) ?? null}
                  isLoggedIn={true}
                />
              )}
            </div>
          </div>

          {/* ── グループ名 + 説明 ── */}
          <div>
            <h1 className="text-xl font-bold text-[#1a2332]">{team.name}</h1>
            {team.description && (
              <div className="mt-2">
                <TeamDescription text={team.description} />
              </div>
            )}
          </div>

          {/* ── メンバープレビュー（タップでメンバー一覧） ── */}
          <MemberPreviewBar members={(allMembers || []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            swimmer: Array.isArray(m.swimmer) ? (m.swimmer[0] as { id: string; name: string; avatar_url: string | null } | undefined) ?? null : m.swimmer as { id: string; name: string; avatar_url: string | null } | null,
          }))} />

          {/* ── セッション一覧（今後/過去切り替え） ── */}
          <MemberSessionList teamId={id} sessions={sessionItems} />

      </div>
    </AppShell>
  )
}
