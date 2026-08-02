export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyTeams } from "@/actions/teams"
import { getTeamSessionsForTeams, getPublicSessions } from "@/actions/sessions"
import { ScheduleSection } from "@/components/dashboard/schedule-section"
import type { ScheduleSessionItem, TeamFilterOption } from "@/components/dashboard/schedule-section"
import { InviteCodeInput } from "@/components/dashboard/invite-code-input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// DESIGN.md: accent(#E8614D)はLPの主要CTA専用でアプリ内画面では使用禁止。
// 複数チームを色分けするための専用パレットはDESIGN.mdに定義がないため、
// 既存の承認済みトークンのみで構成する(未定義色を新規に増やさない)。
const TEAM_COLORS = [
  "#005F8C", // primary
  "#0f8a4f", // status-success
  "#b8860b", // status-warning
  "#d97706", // status-update
  "#475569", // body-muted / status-neutral
  "#004E73", // primary-hover
  "#64748b", // ink-muted
]

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  const { data: teamsData } = await getMyTeams()
  const allTeams = (teamsData || []) as Record<string, unknown>[]

  const now = new Date()
  const jstHour = (now.getUTCHours() + 9) % 24
  const greeting = jstHour < 12 ? "おはようございます" : jstHour < 18 ? "こんにちは" : "こんばんは"
  const userName = profile?.name || ""

  // ── グループなし: オンボーディング画面 ────────────────────────
  if (allTeams.length === 0) {
    const { data: publicSessions } = await getPublicSessions({ from: now.toISOString() })

    return (
      <div className="space-y-6">
        {/* ウェルカムヘッダー */}
        <div className="rounded-[14px] bg-[#f2f7fa] px-5 py-6">
          <p className="text-sm leading-[1.5] text-[#475569]">{greeting}</p>
          <h1 className="mt-1 text-[22px] font-semibold leading-[1.4] tracking-[-0.2px] text-[#1a2332]">
            ようこそ、{userName}さん！
          </h1>
          <p className="mt-2 text-sm leading-[1.5] text-[#475569]">
            Rangers では水泳グループの練習・大会・会費を<br className="hidden sm:inline" />
            まとめて管理できます。まずグループに参加しましょう。
          </p>
        </div>

        {/* はじめる */}
        <section>
          <h2 className="mb-3 text-lg font-semibold leading-[1.4] text-[#1a2332]">はじめる</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* グループを探す */}
            <Link href="/search?tab=teams">
              <div className="flex h-full flex-col gap-3 rounded-[14px] border border-[#dce3ea] bg-white p-4 transition-all hover:border-[#005F8C] hover:shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#005F8C]/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2332]">グループを探す</p>
                  <p className="mt-0.5 text-xs text-[#475569]">公開グループに参加</p>
                </div>
              </div>
            </Link>

            {/* グループを作る */}
            <Link href="/teams/new">
              <div className="flex h-full flex-col gap-3 rounded-[14px] border border-[#dce3ea] bg-white p-4 transition-all hover:border-[#0f8a4f] hover:shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#0f8a4f]/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2332]">グループを作る</p>
                  <p className="mt-0.5 text-xs text-[#475569]">コーチ・管理者として</p>
                </div>
              </div>
            </Link>
          </div>

          {/* 招待コードで参加 — 全幅 */}
          <div className="mt-3">
            <InviteCodeInput />
          </div>
        </section>

        {/* 公開中のセッション */}
        {publicSessions && publicSessions.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold leading-[1.4] text-[#1a2332]">公開中のセッション</h2>
              <Link href="/search" className="inline-flex min-h-[44px] items-center text-sm text-[#005F8C] hover:underline">
                すべて見る →
              </Link>
            </div>
            <div className="space-y-3">
              {publicSessions.slice(0, 5).map((session: Record<string, unknown>) => {
                const team = session.team as Record<string, unknown> | null
                return (
                  <Card key={session.id as string} className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex w-14 shrink-0 flex-col items-center rounded-[6px] bg-[#005F8C]/10 py-2">
                        <span className="text-xs font-medium text-[#005F8C]">
                          {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { month: "short", timeZone: "Asia/Tokyo" })}
                        </span>
                        <span className="text-xl font-bold leading-tight text-[#005F8C]">
                          {parseInt(new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { day: "numeric", timeZone: "Asia/Tokyo" }))}
                        </span>
                        <span className="text-xs text-[#005F8C]">
                          {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-[#1a2332]">{session.title as string}</p>
                          <Badge className="shrink-0 bg-[#edf0f4] text-[#475569] border-transparent text-xs">
                            {SESSION_TYPE_LABELS[session.type as string] || session.type as string}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#475569]">
                          {new Date(session.scheduled_at as string).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Tokyo",
                          })}
                          {session.location ? ` · ${session.location as string}` : ""}
                        </p>
                        {team && (
                          <p className="text-xs text-[#475569]">{team.name as string}</p>
                        )}
                        <p className="mt-0.5 text-sm font-semibold text-[#005F8C]">
                          ¥{(session.guest_price as number || 0).toLocaleString()}
                          <span className="text-xs font-normal text-[#475569]">（ゲスト）</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </div>
    )
  }

  // ── グループあり: 通常ダッシュボード ──────────────────────────
  const teamColors: Record<string, string> = {}
  allTeams.forEach((team, idx) => {
    teamColors[team.id as string] = TEAM_COLORS[idx % TEAM_COLORS.length]
  })

  type SessionRaw = Record<string, unknown> & { team_name: string; team_color: string }

  const featuredTeams = allTeams.slice(0, 8)
  const { data: sessionsByTeam } = await getTeamSessionsForTeams(
    featuredTeams.map((team) => team.id as string)
  )

  const allSessions: SessionRaw[] = featuredTeams.flatMap((team) => {
    const sessions = sessionsByTeam[team.id as string]
    if (!sessions) return []
    return sessions
      .filter((s: Record<string, unknown>) => s.session_status !== "cancelled")
      .map((s: Record<string, unknown>) => ({
        ...s,
        team_name: team.name as string,
        team_color: teamColors[team.id as string],
      }))
  })

  const { data: myRegistrations } = await supabase
    .from("session_registrations")
    .select("session_id")
    .eq("swimmer_id", user.id)
    .is("cancelled_at", null)
    .limit(50)

  const registeredIds = new Set(myRegistrations?.map((r) => r.session_id) || [])

  const scheduleSessions: ScheduleSessionItem[] = allSessions.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    scheduled_at: s.scheduled_at as string,
    location: s.location as string | null,
    type: s.type as string,
    team_name: s.team_name,
    team_id: s.team_id as string,
    team_color: s.team_color,
    is_registered: registeredIds.has(s.id as string),
  }))

  const teamFilterOptions: TeamFilterOption[] = allTeams.slice(0, 8).map((team) => ({
    id: team.id as string,
    name: team.name as string,
    color: teamColors[team.id as string],
  }))

  return (
    <div className="space-y-4">
      {/* あなたのグループ */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold leading-[1.4] text-[#1a2332]">あなたのグループ</h2>
          {allTeams.length > 8 && (
            <Link href="/teams" className="inline-flex min-h-[44px] items-center text-sm text-[#005F8C] hover:underline">
              すべて見る →
            </Link>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {allTeams.slice(0, 8).map((team) => {
            const isAdmin = team.my_role === "admin"
            const color = teamColors[team.id as string]
            const href = `/teams/${team.id}`
            const avatarUrl = team.avatar_url as string | null

            return (
              <Link key={team.id as string} href={href} className="block shrink-0 w-[136px]">
                <div className="overflow-hidden rounded-[14px] border border-[#dce3ea] bg-white transition-all hover:border-[#005F8C] hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  {/* 上: グループ画像 + ロールバッジ */}
                  <div
                    className="relative h-[56px] w-full overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={team.name as string}
                        fill
                        className="object-cover"
                        sizes="136px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                        {(team.name as string)?.[0] || "T"}
                      </div>
                    )}
                    <span
                      className="absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
                      style={
                        isAdmin
                          ? { backgroundColor: "rgba(255,255,255,0.85)", color }
                          : { backgroundColor: "rgba(255,255,255,0.85)", color: "#475569" }
                      }
                    >
                      {isAdmin ? "管理者" : "メンバー"}
                    </span>
                  </div>
                  {/* 下: グループ名 */}
                  <div className="px-2.5 py-2">
                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#1a2332]">
                      {team.name as string}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* 1グループのみのとき: 「グループを探す」プレースホルダー */}
          {allTeams.length === 1 && (
            <Link href="/search?tab=teams" className="block shrink-0 w-[136px]">
              <div className="flex h-[100px] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#dce3ea] bg-[#f2f7fa] transition-colors hover:bg-[#edf0f4]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#475569]">グループを探す</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* スケジュール + セッション（統合） */}
      <ScheduleSection sessions={scheduleSessions} teams={teamFilterOptions} />
    </div>
  )
}
