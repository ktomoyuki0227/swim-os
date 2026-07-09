export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTeam, getTeamMembers, getTeamFeeStats, getPublicTeam } from "@/actions/teams"
import { getTeamSessions } from "@/actions/sessions"
import { getTeamAnnouncements } from "@/actions/announcements"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { ToastProvider } from "@/components/toast"
import { PublicHeader } from "@/components/layout/public-header"
import { PublicFooter } from "@/components/layout/public-footer"
import { PublicTeamView } from "@/components/teams/public-team-view"
import { AdminActionButtons } from "@/app/(app)/teams/[id]/admin-action-buttons"
import { MemberList } from "@/app/(app)/teams/[id]/member-list"
import { AnnouncementsSection } from "@/app/(app)/teams/[id]/announcements-section"
import { JoinRequestsTab } from "@/app/(app)/teams/[id]/join-requests-tab"
import { getTeamJoinRequests, getMyJoinRequest } from "@/actions/join-requests"
import { ContactInfoButton } from "@/components/teams/contact-info-button"
import { AdminTeamActions } from "@/app/(app)/teams/[id]/admin-team-actions"
import { TeamDescription } from "@/app/(app)/teams/[id]/team-description"
import { MemberAnnouncementsSheet } from "@/app/(app)/teams/[id]/member-announcements-sheet"
import { MemberSessionList } from "@/app/(app)/teams/[id]/member-session-list"
import { MemberPreviewBar } from "@/app/(app)/teams/[id]/member-preview-bar"
import { StripeSetupBanner } from "@/app/(app)/teams/[id]/stripe-setup-banner"
import { BackLink } from "@/components/back-link"
import Image from "next/image"

interface TeamPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
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
    .single()

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
      <ToastProvider>
        <Navigation userName={profile.name} avatarUrl={profile.avatar_url} inactiveRoutes={["/teams"]} />
        <main className="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-6 pb-24 md:pb-6">
          {/* -mx-4 -mt-6 は layout の padding を打ち消して PublicTeamView をフルブリードにする */}
          <div className="-mx-4 -mt-6">
            <PublicTeamView data={publicResult.data} hasBottomNav={true} joinRequestStatus={joinRequestStatus} isLoggedIn={true} />
          </div>
        </main>
      </ToastProvider>
    )
  }

  const defaultTab = isAdmin ? "members" : "sessions"
  const { tab = defaultTab } = await searchParams

  // ─── 管理者ビュー ─────────────────────────────────────────────────
  if (isAdmin) {
    const [teamResult, membersResult, sessionsResult, announcementsResult, feeStatsResult, joinRequestsResult] = await Promise.all([
      getTeam(id),
      getTeamMembers(id),
      getTeamSessions(id),
      getTeamAnnouncements(id),
      getTeamFeeStats(id),
      getTeamJoinRequests(id),
    ])

    if (teamResult.error || !teamResult.data) notFound()

    const team = teamResult.data
    const members = membersResult.data || []
    const sessions = (sessionsResult.data || [])
      .filter(
        (s: Record<string, unknown>) =>
          s.session_status === "open" || s.session_status === "confirmed"
      )
      .slice(0, 10)
    const announcements = (announcementsResult.data || []) as Array<{
      id: string
      title: string
      body: string | null
      created_at: string
    }>

    const joinRequests = joinRequestsResult.data || []

    const adminMembers = members.filter((m: Record<string, unknown>) => m.role === "admin")
    const previewMembers = members.slice(0, 3)

    return (
      <ToastProvider>
        <Navigation userName={profile.name} avatarUrl={profile.avatar_url} />
        <main className="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-4 pb-24 md:pb-6">
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
              <span className="text-sm text-[#5c6a7a]">グループ</span>
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

            {/* ── メンバープレビュー（1つの角丸バー） ── */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-[#f2f7fa] py-1.5 pl-2 pr-4">
              <div className="flex -space-x-1.5">
                {previewMembers.map((m: Record<string, unknown>, i: number) => {
                  const swimmer = m.swimmer as Record<string, unknown> | null
                  const avatarUrl = swimmer?.avatar_url as string | null
                  const name = (swimmer?.name as string) || ""
                  return (
                    <div
                      key={m.id as string}
                      className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#f2f7fa] bg-[#005F8C]/10 text-[10px] font-semibold text-[#005F8C]"
                      style={{ zIndex: 3 - i }}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        name[0] || "?"
                      )}
                    </div>
                  )
                })}
              </div>
              <span className="text-sm font-medium text-[#1a2332]">{members.length}人のメンバー</span>
            </div>

            {/* ── アクションボタン + ウィザード ── */}
            <AdminTeamActions
              teamId={id}
              members={members}
              currentUserId={user.id}
              announcements={announcements}
              joinRequests={joinRequests}
              hasAnnualFee={team.has_annual_fee ?? false}
              hasMonthlyFee={team.has_monthly_fee ?? false}
              hasPointCard={team.has_point_card ?? false}
              pointCardCount={team.point_card_count ?? 0}
            />

            {/* ── 主催者 ── */}
            {adminMembers.length > 0 && (
              <div className="rounded-[14px] border border-[#dce3ea] bg-white px-4 py-3">
                <p className="mb-2 text-xs font-semibold text-[#5c6a7a]">主催者</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    {adminMembers.slice(0, 3).map((m: Record<string, unknown>, i: number) => {
                      const swimmer = m.swimmer as Record<string, unknown> | null
                      const avatarUrl = swimmer?.avatar_url as string | null
                      const name = (swimmer?.name as string) || ""
                      return (
                        <div
                          key={m.id as string}
                          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#005F8C]/10 text-xs font-semibold text-[#005F8C]"
                          style={{ zIndex: 3 - i }}
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
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
                      <span className="font-normal text-[#5c6a7a]"> 他{adminMembers.length - 1}人</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* ── デフォルト: セッション一覧 ── */}
            <div>
              <h2 className="mb-3 text-[18px] font-semibold leading-[1.4] text-[#1a2332]">セッション</h2>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center py-12 px-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-[#1a2332]">予定されているセッションはありません</p>
                  <p className="mt-1 text-sm text-[#5c6a7a]">セッションを作成して、メンバーに共有しましょう</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sessions.map((session: Record<string, unknown>) => (
                    <Link key={session.id as string} href={`/sessions/${session.id}`}>
                      <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-medium text-[#1a2332]">{session.title as string}</p>
                            <p className="text-sm text-[#5c6a7a]">
                              {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", {
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {session.location ? ` · ${session.location as string}` : ""}
                            </p>
                          </div>
                          <Badge
                            className={
                              session.session_status === "confirmed"
                                ? "border-transparent bg-[#eaf7f0] text-[#0f8a4f]"
                                : "border-transparent bg-[#e8f2f8] text-[#005F8C]"
                            }
                          >
                            {session.session_status === "confirmed" ? "確定" : "受付中"}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </ToastProvider>
    )
  }

  // ─── メンバービュー ────────────────────────────────────────────────
  const [teamResult, sessionsResult, announcementsResult, memberPreviewResult] = await Promise.all([
    getTeam(id),
    getTeamSessions(id),
    getTeamAnnouncements(id),
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
  const allSessions = ((sessionsResult.data || []) as Record<string, unknown>[])
    .filter((s) => s.session_status !== "cancelled")
    .sort(
      (a, b) =>
        new Date(a.scheduled_at as string).getTime() -
        new Date(b.scheduled_at as string).getTime()
    )
  const announcements = (announcementsResult.data || []) as Array<{
    id: string
    title: string
    body: string | null
    created_at: string
    is_read: boolean
  }>
  const unreadCount = announcements.filter((a) => !a.is_read).length

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

  const previewMembers = allMembers.slice(0, 3)

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
    <ToastProvider>
      <Navigation userName={profile.name} avatarUrl={profile.avatar_url} />
      <main className="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-4 pb-24 md:pb-6">
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
            <span className="text-sm text-[#5c6a7a]">グループ</span>
            <div className="flex items-center gap-2">
              <MemberAnnouncementsSheet announcements={announcements} unreadCount={unreadCount} />
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
      </main>
    </ToastProvider>
  )
}
