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
import { MarkReadButton } from "@/app/(app)/teams/[id]/mark-read-button"
import { JoinRequestsTab } from "@/app/(app)/teams/[id]/join-requests-tab"
import { getTeamJoinRequests, getMyJoinRequest } from "@/actions/join-requests"
import { ContactInfoButton } from "@/components/teams/contact-info-button"

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
      .slice(0, 5)
    const announcements = (announcementsResult.data || []) as Array<{
      id: string
      title: string
      body: string | null
      created_at: string
    }>

    const joinRequests = joinRequestsResult.data || []
    const feeStats = feeStatsResult.data ?? { paid: 0, subscriptionUnpaid: 0, stampUnpaid: 0, total: 0 }
    const hasFeeStats = feeStats.total > 0
    const paidPct = hasFeeStats ? (feeStats.paid / feeStats.total) * 100 : 0
    const subUnpaidPct = hasFeeStats ? (feeStats.subscriptionUnpaid / feeStats.total) * 100 : 0
    const stampUnpaidPct = hasFeeStats ? (feeStats.stampUnpaid / feeStats.total) * 100 : 0

    const tabs = [
      { id: "members", label: `メンバー (${members.length})` },
      { id: "sessions", label: "セッション" },
      { id: "announcements", label: `お知らせ (${announcements.length})` },
      { id: "requests", label: joinRequests.length > 0 ? `申請 (${joinRequests.length})` : "申請" },
    ]

    return (
      <ToastProvider>
        <Navigation userName={profile.name} avatarUrl={profile.avatar_url} />
        <main className="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-6 pb-24 md:pb-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              {/* アクションバー */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <Link href="/teams" className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
                  ← グループ一覧
                </Link>
                <AdminActionButtons team={team} />
              </div>
              {/* グループ名 + バッジ（インライン） */}
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[#1a2332]">{team.name}</h1>
                <Badge
                  className={
                    team.status === "active"
                      ? "border-transparent bg-[#eaf7f0] text-[#0f8a4f]"
                      : "border-transparent bg-[#edf0f4] text-[#5c6a7a]"
                  }
                >
                  {team.status === "active" ? "アクティブ" : "非アクティブ"}
                </Badge>
              </div>
              {team.description && (
                <p className="mt-1 text-sm text-[#5c6a7a]">{team.description}</p>
              )}
            </div>

            {/* Stats inline bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[#dce3ea] bg-white px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-1.5">
                <span>👥</span>
                <span className="font-semibold text-[#1a2332]">{members.length}</span>
                <span className="text-[#5c6a7a]">人</span>
              </div>
              <div className="h-4 w-px bg-[#dce3ea]" />
              <div className="flex items-center gap-1.5">
                <span>📅</span>
                <span className="font-semibold text-[#1a2332]">{sessions.length}</span>
                <span className="text-[#5c6a7a]">件</span>
              </div>
              {hasFeeStats && (
                <>
                  <div className="h-4 w-px bg-[#dce3ea]" />
                  <div className="flex flex-1 items-center gap-2">
                    <span className="shrink-0 text-[#5c6a7a]">支払い</span>
                    <span className="shrink-0 font-semibold text-[#1a2332]">
                      {feeStats.paid}/{feeStats.total}
                    </span>
                    <div className="relative flex h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-full bg-[#edf0f4]">
                      <div className="absolute left-0 h-full rounded-full bg-[#0f8a4f]" style={{ width: `${paidPct}%` }} />
                      <div className="absolute h-full rounded-full bg-[#dc2626]" style={{ left: `${paidPct}%`, width: `${subUnpaidPct}%` }} />
                      <div className="absolute h-full rounded-full bg-[#d97706]" style={{ left: `${paidPct + subUnpaidPct}%`, width: `${stampUnpaidPct}%` }} />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-[#dce3ea]">
              <div className="flex gap-0 overflow-x-auto">
                {tabs.map((t) => (
                  <Link
                    key={t.id}
                    href={`/teams/${id}?tab=${t.id}`}
                    className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      tab === t.id
                        ? "border-[#005F8C] text-[#005F8C]"
                        : "border-transparent text-[#5c6a7a] hover:text-[#1a2332]"
                    }`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {tab === "members" && (
              <MemberList
                teamId={id}
                members={members}
                currentUserId={user.id}
                hasAnnualFee={team.has_annual_fee ?? false}
                hasMonthlyFee={team.has_monthly_fee ?? false}
                hasPointCard={team.has_point_card ?? false}
                pointCardCount={team.point_card_count ?? 0}
              />
            )}

            {tab === "sessions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#1a2332]">セッション</h2>
                  <Link href={`/sessions/new?team=${id}`}>
                    <Button
                      size="sm"
                      className="rounded-full bg-[#005F8C] hover:bg-[#004E73]"
                      style={{ minHeight: "44px" }}
                    >
                      + 作成
                    </Button>
                  </Link>
                </div>
                {sessions.length === 0 ? (
                  <Card className="border-[#dce3ea]">
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <p className="text-sm text-[#5c6a7a]">予定されているセッションはありません</p>
                      <Link href={`/sessions/new?team=${id}`} className="mt-3">
                        <Button variant="outline" size="sm" className="rounded-full border-[#005F8C] text-[#005F8C]">
                          セッションを作成する
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
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
            )}

            {tab === "announcements" && (
              <AnnouncementsSection teamId={id} announcements={announcements} />
            )}

            {tab === "requests" && (
              <JoinRequestsTab teamId={id} initialRequests={joinRequests} />
            )}

          </div>
        </main>
      </ToastProvider>
    )
  }

  // ─── メンバービュー ────────────────────────────────────────────────
  const [teamResult, sessionsResult, announcementsResult] = await Promise.all([
    getTeam(id),
    getTeamSessions(id),
    getTeamAnnouncements(id),
  ])

  if (teamResult.error || !teamResult.data) notFound()

  const team = teamResult.data
  const sessions = ((sessionsResult.data || []) as Record<string, unknown>[])
    .filter(
      (s) =>
        s.session_status !== "cancelled" &&
        new Date(s.scheduled_at as string) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_at as string).getTime() -
        new Date(b.scheduled_at as string).getTime()
    )
  const announcements = (announcementsResult.data || []) as Record<string, unknown>[]
  const unreadCount = announcements.filter((a) => !a.is_read).length

  // 自分の参加済みセッション ID を取得
  let registeredSessionIds = new Set<string>()
  if (sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id as string)
    const { data: regs } = await supabase
      .from("session_registrations")
      .select("session_id")
      .eq("swimmer_id", user.id)
      .in("session_id", sessionIds)
      .is("cancelled_at", null)
    registeredSessionIds = new Set((regs || []).map((r) => r.session_id))
  }

  const memberTabs = [
    { id: "sessions", label: `セッション (${sessions.length})` },
    { id: "announcements", label: `お知らせ${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
  ]

  return (
    <ToastProvider>
      <Navigation userName={profile.name} avatarUrl={profile.avatar_url} />
      <main className="mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-4 py-6 pb-24 md:pb-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <Link href="/teams" className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
                ← グループ
              </Link>
              {(team.contact_email || team.contact_phone) && (
                <ContactInfoButton
                  teamId={team.id}
                  contactEmail={(team.contact_email as string | null) ?? null}
                  contactPhone={(team.contact_phone as string | null) ?? null}
                  isLoggedIn={true}
                />
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold text-[#1a2332]">{team.name}</h1>
            {team.description && (
              <p className="mt-1 text-sm text-[#5c6a7a]">{team.description}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-[#dce3ea]">
            <div className="flex gap-0">
              {memberTabs.map((t) => (
                <Link
                  key={t.id}
                  href={`/teams/${id}?tab=${t.id}`}
                  className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "border-[#005F8C] text-[#005F8C]"
                      : "border-transparent text-[#5c6a7a] hover:text-[#1a2332]"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>

          {tab === "sessions" && (
            <div className="flex flex-col gap-3">
              {sessions.length === 0 ? (
                <Card className="border-[#dce3ea]">
                  <CardContent className="py-10 text-center text-sm text-[#5c6a7a]">
                    今後のセッションはありません
                  </CardContent>
                </Card>
              ) : (
                sessions.map((session) => (
                  <Link key={session.id as string} href={`/teams/${id}/sessions/${session.id}`}>
                    <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[#005F8C]/10 py-2">
                          <span className="text-[10px] font-medium text-[#005F8C]">
                            {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { month: "short" })}
                          </span>
                          <span className="text-xl font-bold leading-tight text-[#005F8C]">
                            {new Date(session.scheduled_at as string).getDate()}
                          </span>
                          <span className="text-[10px] text-[#005F8C]">
                            {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { weekday: "short" })}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#1a2332]">{session.title as string}</p>
                          <p className="text-xs text-[#5c6a7a]">
                            {new Date(session.scheduled_at as string).toLocaleTimeString("ja-JP", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {session.location ? ` · ${session.location as string}` : ""}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-[#005F8C]">
                            ¥{((session.member_price as number) || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {(() => {
                            const isDeadlinePassed =
                              session.registration_deadline &&
                              new Date(session.registration_deadline as string) < new Date()
                            if (session.session_status === "confirmed") {
                              return <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-[10px]">開催確定</Badge>
                            }
                            if (isDeadlinePassed) {
                              return <Badge className="bg-[#edf0f4] text-[#5c6a7a] border-transparent text-[10px]">締切済</Badge>
                            }
                            return <Badge className="bg-[#e8f2f8] text-[#005F8C] border-transparent text-[10px]">受付中</Badge>
                          })()}
                          {registeredSessionIds.has(session.id as string) && (
                            <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-[10px]">参加予定</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "announcements" && (
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <Card className="border-[#dce3ea]">
                  <CardContent className="py-10 text-center text-sm text-[#5c6a7a]">
                    お知らせはありません
                  </CardContent>
                </Card>
              ) : (
                announcements.map((announcement) => (
                  <Card
                    key={announcement.id as string}
                    className={`border-[#dce3ea] ${!announcement.is_read ? "border-l-4 border-l-[#005F8C]" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-[#1a2332]">{announcement.title as string}</p>
                          {announcement.body ? (
                            <p className="mt-1 text-sm text-[#5c6a7a]">{announcement.body as string}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-[#8d99a8]">
                            {new Date(announcement.created_at as string).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                        {!announcement.is_read && (
                          <MarkReadButton announcementId={announcement.id as string} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </ToastProvider>
  )
}
