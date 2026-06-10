export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyTeams } from "@/actions/teams"
import { getTeamSessions, getPublicSessions } from "@/actions/sessions"
import { ScheduleSection } from "@/components/dashboard/schedule-section"
import type { ScheduleSessionItem, TeamFilterOption } from "@/components/dashboard/schedule-section"
import { InviteCodeInput } from "@/components/dashboard/invite-code-input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const TEAM_COLORS = [
  "#005F8C",
  "#0f8a4f",
  "#E8614D",
  "#7c4dff",
  "#f57c00",
  "#00838f",
  "#5d4037",
  "#37474f",
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
  const hour = now.getHours()
  const greeting = hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは"
  const userName = profile?.name || ""

  // ── チームなし: オンボーディング画面 ────────────────────────
  if (allTeams.length === 0) {
    const { data: publicSessions } = await getPublicSessions({ from: now.toISOString() })

    return (
      <div className="space-y-6">
        {/* ウェルカムヘッダー */}
        <div className="rounded-2xl bg-[#f2f7fa] px-5 py-6">
          <p className="text-sm text-[#5c6a7a]">{greeting}</p>
          <h1 className="mt-0.5 text-2xl font-bold text-[#1a2332]">
            ようこそ、{userName}さん！
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5c6a7a]">
            Rangers では水泳チームの練習・大会・会費を<br className="hidden sm:inline" />
            まとめて管理できます。まずチームに参加しましょう。
          </p>
        </div>

        {/* はじめる */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-[#1a2332]">はじめる</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* チームを探す */}
            <Link href="/search?tab=teams">
              <div className="flex h-full flex-col gap-3 rounded-xl border border-[#dce3ea] bg-white p-4 transition-all hover:border-[#005F8C] hover:shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#005F8C]/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2332]">チームを探す</p>
                  <p className="mt-0.5 text-xs text-[#8d99a8]">公開チームに参加</p>
                </div>
              </div>
            </Link>

            {/* チームを作る */}
            <Link href="/teams/new">
              <div className="flex h-full flex-col gap-3 rounded-xl border border-[#dce3ea] bg-white p-4 transition-all hover:border-[#0f8a4f] hover:shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f8a4f]/10">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2332]">チームを作る</p>
                  <p className="mt-0.5 text-xs text-[#8d99a8]">コーチ・管理者として</p>
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
              <h2 className="text-base font-semibold text-[#1a2332]">公開中のセッション</h2>
              <Link href="/search" className="text-sm text-[#005F8C] hover:underline">
                すべて見る →
              </Link>
            </div>
            <div className="space-y-3">
              {publicSessions.slice(0, 5).map((session: Record<string, unknown>) => {
                const team = session.team as Record<string, unknown> | null
                return (
                  <Card key={session.id as string} className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
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
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-[#1a2332]">{session.title as string}</p>
                          <Badge className="shrink-0 bg-[#edf0f4] text-[#5c6a7a] border-transparent text-[10px]">
                            {SESSION_TYPE_LABELS[session.type as string] || session.type as string}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#5c6a7a]">
                          {new Date(session.scheduled_at as string).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {session.location ? ` · ${session.location as string}` : ""}
                        </p>
                        {team && (
                          <p className="text-xs text-[#8d99a8]">{team.name as string}</p>
                        )}
                        <p className="mt-0.5 text-sm font-semibold text-[#005F8C]">
                          ¥{(session.guest_price as number || 0).toLocaleString()}
                          <span className="text-xs font-normal text-[#8d99a8]">（ゲスト）</span>
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

  // ── チームあり: 通常ダッシュボード ──────────────────────────
  const teamColors: Record<string, string> = {}
  allTeams.forEach((team, idx) => {
    teamColors[team.id as string] = TEAM_COLORS[idx % TEAM_COLORS.length]
  })

  type SessionRaw = Record<string, unknown> & { team_name: string; team_color: string }
  const allSessions: SessionRaw[] = []

  for (const team of allTeams.slice(0, 5)) {
    const { data: sessions } = await getTeamSessions(team.id as string)
    if (sessions) {
      allSessions.push(
        ...sessions
          .filter((s: Record<string, unknown>) => s.session_status !== "cancelled")
          .map((s: Record<string, unknown>) => ({
            ...s,
            team_name: team.name as string,
            team_color: teamColors[team.id as string],
          }))
      )
    }
  }

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

  const teamFilterOptions: TeamFilterOption[] = allTeams.slice(0, 5).map((team) => ({
    id: team.id as string,
    name: team.name as string,
    color: teamColors[team.id as string],
  }))

  return (
    <div className="space-y-6">
      {/* あなたのチーム */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1a2332]">あなたのチーム</h2>
          {allTeams.length > 4 && (
            <Link href="/teams" className="text-sm text-[#005F8C] hover:underline">
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
              <Link key={team.id as string} href={href} className="block shrink-0 w-40">
                <div
                  className="flex h-[72px] overflow-hidden rounded-xl border bg-white transition-all hover:shadow-sm"
                  style={{ borderColor: `${color}40` }}
                >
                  {/* 左: チーム画像 */}
                  <div
                    className="flex w-2/5 shrink-0 items-center justify-center text-lg font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={team.name as string} className="h-full w-full object-cover" />
                    ) : (
                      (team.name as string)?.[0] || "T"
                    )}
                  </div>
                  {/* 右: チーム名 + バッジ */}
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-2.5">
                    <p className="line-clamp-2 text-xs font-semibold leading-tight text-[#1a2332]">
                      {team.name as string}
                    </p>
                    <span
                      className="inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={
                        isAdmin
                          ? { backgroundColor: `${color}18`, color }
                          : { backgroundColor: "#f2f7fa", color: "#5c6a7a" }
                      }
                    >
                      {isAdmin ? "管理者" : "メンバー"}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* 1チームのみのとき: 「チームを探す」プレースホルダー */}
          {allTeams.length === 1 && (
            <Link href="/search?tab=teams" className="block shrink-0 w-40">
              <div className="flex h-[72px] items-center justify-center rounded-xl border border-dashed border-[#dce3ea] bg-[#f7fafc] transition-colors hover:bg-[#eef3f7]">
                <div className="flex flex-col items-center gap-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <p className="text-[11px] text-[#5c6a7a]">チームを探す</p>
                </div>
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
