export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyTeams } from "@/actions/teams"
import { getTeamSessions } from "@/actions/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionCalendar } from "@/components/session-calendar"
import type { CalendarSession } from "@/components/session-calendar"

export default async function InstructorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  const { data: teams } = await getMyTeams()
  const adminTeams = ((teams || []) as Record<string, unknown>[]).filter((t) => t.my_role === "admin")

  // 全セッション取得（カレンダー用）
  const allSessions: (Record<string, unknown> & { team_name: string })[] = []
  for (const team of adminTeams) {
    const { data: sessions } = await getTeamSessions(team.id as string)
    if (sessions) {
      allSessions.push(
        ...sessions
          .filter((s: Record<string, unknown>) => s.session_status !== "cancelled")
          .map((s: Record<string, unknown>) => ({ ...s, team_name: team.name as string }))
      )
    }
  }

  const upcomingSessions = allSessions
    .filter((s) => new Date(s.scheduled_at as string) > new Date())
    .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime())

  // 参加者数
  const registrationCounts: Record<string, number> = {}
  for (const session of upcomingSessions.slice(0, 10)) {
    const { count } = await supabase
      .from("session_registrations")
      .select("id", { count: "exact" })
      .eq("session_id", session.id as string)
      .is("cancelled_at", null)
    registrationCounts[session.id as string] = count || 0
  }

  // 締め切り間近（3日以内）
  const soon = new Date()
  soon.setDate(soon.getDate() + 3)
  const deadlineSoon = upcomingSessions.filter(
    (s) =>
      s.registration_deadline &&
      new Date(s.registration_deadline as string) < soon &&
      new Date(s.registration_deadline as string) > new Date()
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは"

  const calendarSessions: CalendarSession[] = allSessions.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    scheduled_at: s.scheduled_at as string,
    team_name: s.team_name,
    session_type: s.type as string | undefined,
    href: `/instructor/sessions/${s.id}`,
  }))

  return (
    <div className="space-y-6">
      {/* Greeting — full width */}
      <div className="rounded-2xl bg-gradient-to-r from-[#005F8C] to-[#004E73] px-5 py-5 text-white">
        <p className="text-sm text-white/70">{greeting}</p>
        <h1 className="mt-0.5 text-2xl font-bold">
          {profile?.name || ""}さん
        </h1>
        <p className="mt-1 text-sm text-white/80">
          管理チーム {adminTeams.length}チーム · 今後のセッション {upcomingSessions.length}件
        </p>
      </div>

      {/* 締切アラート */}
      {deadlineSoon.length > 0 && (
        <div className="rounded-xl border border-[#fdecea] bg-[#fdecea] p-4">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-sm font-medium text-[#c0392b]">締め切り間近のセッションがあります</p>
          </div>
          {deadlineSoon.map((s) => (
            <Link key={s.id as string} href={`/instructor/sessions/${s.id}`} className="mt-2 block text-xs text-[#5c6a7a] hover:text-[#005F8C]">
              · {s.title as string} — {new Date(s.registration_deadline as string).toLocaleDateString("ja-JP")}締切
            </Link>
          ))}
        </div>
      )}

      {/* 2カラム */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
        {/* 左：カレンダー */}
        <div>
          <div className="mb-3 flex min-h-[44px] items-center">
            <h2 className="text-base font-semibold text-[#1a2332]">スケジュール</h2>
          </div>
          <SessionCalendar sessions={calendarSessions} />
        </div>

        {/* 右：セッションリスト + チーム */}
        <div className="space-y-6">
          {/* セッション一覧 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1a2332]">今後のセッション</h2>
              <Link href="/instructor/sessions/new">
                <Button size="sm" className="rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: "44px" }}>
                  + 作成
                </Button>
              </Link>
            </div>

            {adminTeams.length === 0 ? (
              <Card className="border-[#dce3ea]">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-sm text-[#5c6a7a]">まずチームを作成しましょう</p>
                  <Link href="/instructor/teams/new" className="mt-3">
                    <Button variant="outline" size="sm" className="rounded-full border-[#005F8C] text-[#005F8C]">
                      チームを作成する
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : upcomingSessions.length === 0 ? (
              <Card className="border-[#dce3ea]">
                <CardContent className="py-8 text-center text-sm text-[#5c6a7a]">
                  予定されているセッションはありません
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((session) => {
                  const count = registrationCounts[session.id as string] || 0
                  return (
                    <Link key={session.id as string} href={`/instructor/sessions/${session.id}`}>
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
                            <p className="truncate font-medium text-[#1a2332]">{session.title as string}</p>
                            <p className="text-xs text-[#5c6a7a]">
                              {new Date(session.scheduled_at as string).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {session.location ? ` · ${session.location as string}` : ""}
                            </p>
                            <p className="text-xs text-[#8d99a8]">{session.team_name}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-bold text-[#005F8C]">{count}</p>
                            <p className="text-[10px] text-[#5c6a7a]">名</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
                {upcomingSessions.length > 5 && (
                  <Link href="/instructor/sessions" className="block text-center text-sm text-[#005F8C] hover:underline">
                    すべて表示 ({upcomingSessions.length}件) →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 管理チーム */}
          {adminTeams.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1a2332]">管理チーム</h2>
                <Link href="/instructor/teams" className="text-sm text-[#005F8C] hover:underline">
                  すべて表示 →
                </Link>
              </div>
              <div className="space-y-2">
                {adminTeams.slice(0, 3).map((team: Record<string, unknown>) => (
                  <Link key={team.id as string} href={`/instructor/teams/${team.id}`}>
                    <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#005F8C]/10 text-sm font-bold text-[#005F8C]">
                          {(team.name as string)?.[0] || "T"}
                        </div>
                        <p className="font-medium text-[#1a2332]">{team.name as string}</p>
                        <Badge
                          className={
                            team.status === "active"
                              ? "ml-auto bg-[#eaf7f0] text-[#0f8a4f] border-transparent"
                              : "ml-auto bg-[#edf0f4] text-[#5c6a7a] border-transparent"
                          }
                        >
                          {team.status === "active" ? "アクティブ" : "非アクティブ"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
