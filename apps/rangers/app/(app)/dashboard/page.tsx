export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyTeams } from "@/actions/teams"
import { getTeamSessions } from "@/actions/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SessionCalendar } from "@/components/session-calendar"
import type { CalendarSession } from "@/components/session-calendar"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  const { data: teams } = await getMyTeams()
  const myTeams = ((teams || []) as Record<string, unknown>[]).filter((t) => t.my_role !== "admin")

  // 全セッションを取得（カレンダー用に広めに）
  const allSessions: (Record<string, unknown> & { team_name: string })[] = []
  for (const team of myTeams.slice(0, 3)) {
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

  const { data: myRegistrations } = await supabase
    .from("session_registrations")
    .select("session_id")
    .eq("swimmer_id", user.id)
    .is("cancelled_at", null)
    .limit(20)

  const registeredSessionIds = new Set(myRegistrations?.map((r) => r.session_id) || [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは"

  const calendarSessions: CalendarSession[] = allSessions.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    scheduled_at: s.scheduled_at as string,
    team_name: s.team_name,
    session_type: s.type as string | undefined,
    href: `/teams/${s.team_id}/sessions/${s.id}`,
  }))

  return (
    <div className="space-y-6">
      {/* Greeting — full width */}
      <div className="rounded-2xl bg-[#f2f7fa] px-5 py-5">
        <p className="text-sm text-[#5c6a7a]">{greeting}</p>
        <h1 className="mt-0.5 text-2xl font-bold text-[#1a2332]">
          {profile?.name || ""}さん
        </h1>
        <p className="mt-1 text-sm text-[#5c6a7a]">
          チーム {myTeams.length}チーム · 参加予定{" "}
          {upcomingSessions.filter((s) => registeredSessionIds.has(s.id as string)).length}件
        </p>
      </div>

      {/* 2カラム */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
        {/* 左：カレンダー */}
        <div>
          <h2 className="mb-3 text-base font-semibold text-[#1a2332]">スケジュール</h2>
          <SessionCalendar sessions={calendarSessions} />
        </div>

        {/* 右：セッションリスト + チーム */}
        <div className="space-y-6">
          {/* Upcoming sessions */}
          <div>
            <div className="mb-3 flex items-center justify-between leading-none">
              <h2 className="text-base font-semibold text-[#1a2332]">直近のセッション</h2>
              <Link href="/teams" className="text-sm text-[#005F8C] hover:underline">
                チーム一覧 →
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <Card className="border-[#dce3ea]">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-sm text-[#5c6a7a]">予定されているセッションはありません</p>
                  {myTeams.length === 0 && (
                    <p className="mt-2 text-xs text-[#8d99a8]">チームに参加すると練習が表示されます</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 5).map((session) => {
                  const isRegistered = registeredSessionIds.has(session.id as string)
                  return (
                    <Link
                      key={session.id as string}
                      href={`/teams/${session.team_id}/sessions/${session.id}`}
                    >
                      <Card className={`border-[#dce3ea] transition-all ${isRegistered ? "hover:border-[#0f8a4f]" : "hover:border-[#005F8C]"}`}>
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className={`flex w-14 shrink-0 flex-col items-center rounded-xl py-2 ${isRegistered ? "bg-[#0f8a4f]/10" : "bg-[#005F8C]/10"}`}>
                            <span className={`text-[10px] font-medium ${isRegistered ? "text-[#0f8a4f]" : "text-[#005F8C]"}`}>
                              {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { month: "short" })}
                            </span>
                            <span className={`text-xl font-bold leading-tight ${isRegistered ? "text-[#0f8a4f]" : "text-[#005F8C]"}`}>
                              {new Date(session.scheduled_at as string).getDate()}
                            </span>
                            <span className={`text-[10px] ${isRegistered ? "text-[#0f8a4f]" : "text-[#005F8C]"}`}>
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
                          {isRegistered ? (
                            <Badge className="shrink-0 bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-xs">
                              参加予定
                            </Badge>
                          ) : (
                            <Badge className="shrink-0 bg-[#e8f2f8] text-[#005F8C] border-transparent text-xs">
                              受付中
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* 近日の大会 */}
          {upcomingSessions.filter((s) => s.type === "competition").length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-semibold text-[#1a2332]">近日の大会情報</h2>
              <div className="space-y-2">
                {upcomingSessions
                  .filter((s) => s.type === "competition")
                  .map((session) => {
                    const isRegistered = registeredSessionIds.has(session.id as string)
                    return (
                      <Link
                        key={session.id as string}
                        href={`/teams/${session.team_id}/sessions/${session.id}`}
                      >
                        <Card className="border-[#dce3ea] transition-all hover:border-[#E8614D]">
                          <CardContent className="flex items-center gap-3 p-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8614D]/10 text-xs font-bold text-[#E8614D]">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="6" />
                                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#1a2332]">
                                {session.title as string}
                              </p>
                              <p className="text-xs text-[#5c6a7a]">
                                {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", {
                                  month: "long",
                                  day: "numeric",
                                  weekday: "short",
                                })}
                                {session.location ? ` · ${session.location as string}` : ""}
                              </p>
                            </div>
                            {isRegistered ? (
                              <Badge className="shrink-0 bg-[#fdecea] text-[#c0392b] border-transparent text-xs">
                                エントリー済
                              </Badge>
                            ) : (
                              <Badge className="shrink-0 bg-[#edf0f4] text-[#5c6a7a] border-transparent text-xs">
                                受付中
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}

          {/* 所属チーム */}
          {myTeams.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-semibold text-[#1a2332]">所属チーム</h2>
              <div className="space-y-2">
                {myTeams.map((team: Record<string, unknown>) => (
                  <Link key={team.id as string} href={`/teams/${team.id}`}>
                    <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                      <CardContent className="flex items-center gap-3 p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#005F8C]/10 text-sm font-bold text-[#005F8C]">
                          {(team.name as string)?.[0] || "T"}
                        </div>
                        <p className="font-medium text-[#1a2332]">{team.name as string}</p>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="2" className="ml-auto">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
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
