export const dynamic = "force-dynamic"

import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getMyTeams } from "@/actions/teams"
import { getTeamSessions } from "@/actions/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: teams } = await getMyTeams()
  const adminTeams = ((teams || []) as Record<string, unknown>[]).filter((t) => t.my_role === "admin")

  // すべての管理チームのセッションを取得
  const allSessions: Record<string, unknown>[] = []
  for (const team of adminTeams) {
    const { data } = await getTeamSessions(team.id as string)
    if (data) {
      allSessions.push(
        ...data.map((s: Record<string, unknown>) => ({ ...s, team_name: team.name }))
      )
    }
  }

  // 日時でソート（新しいものが先）
  allSessions.sort((a, b) =>
    new Date(b.scheduled_at as string).getTime() - new Date(a.scheduled_at as string).getTime()
  )

  const upcoming = allSessions.filter(
    (s) => new Date(s.scheduled_at as string) > new Date() && s.session_status !== "cancelled"
  )
  const past = allSessions.filter(
    (s) => new Date(s.scheduled_at as string) <= new Date() || s.session_status === "cancelled"
  )

  const sessionStatusLabel: Record<string, { label: string; className: string }> = {
    open: { label: "受付中", className: "bg-[#e8f2f8] text-[#005F8C] border-transparent" },
    confirmed: { label: "開催確定", className: "bg-[#eaf7f0] text-[#0f8a4f] border-transparent" },
    cancelled: { label: "中止", className: "bg-[#fdecea] text-[#c0392b] border-transparent" },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a2332]">セッション管理</h1>
        <Link href="/sessions/new">
          <Button className="rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: "44px" }}>
            + セッション作成
          </Button>
        </Link>
      </div>

      {adminTeams.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-[#5c6a7a]">まずチームを作成してください</p>
            <Link href="/teams/new" className="mt-4">
              <Button variant="outline" className="rounded-full border-[#005F8C] text-[#005F8C]">
                チームを作成する
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 今後のセッション */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-[#1a2332]">
              今後のセッション ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <Card className="border-[#dce3ea]">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-[#5c6a7a]">予定されているセッションはありません</p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((session) => {
                  const status = sessionStatusLabel[session.session_status as string] ?? sessionStatusLabel.open
                  return (
                    <Link key={session.id as string} href={`/sessions/${session.id}`}>
                      <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                        <CardContent className="flex items-center gap-4 p-4">
                          {/* Date box */}
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

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-[#1a2332]">{session.title as string}</p>
                            <p className="text-xs text-[#5c6a7a]">
                              {new Date(session.scheduled_at as string).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {session.location ? ` · ${session.location as string}` : ""}
                            </p>
                            <p className="text-xs text-[#8d99a8]">{session.team_name as string}</p>
                          </div>

                          {/* Status */}
                          <Badge className={status.className}>
                            {status.label}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* 過去のセッション */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-semibold text-[#5c6a7a]">
                過去のセッション ({past.length})
              </h2>
              <div className="space-y-2">
                {past.slice(0, 10).map((session) => {
                  const status = sessionStatusLabel[session.session_status as string] ?? sessionStatusLabel.open
                  return (
                    <Card key={session.id as string} className="border-[#dce3ea] opacity-70 transition-all hover:opacity-100">
                      <CardContent className="flex items-center justify-between p-3">
                        <Link href={`/sessions/${session.id}`} className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#1a2332]">{session.title as string}</p>
                          <p className="text-xs text-[#5c6a7a]">
                            {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP")}
                            {" · "}
                            {session.team_name as string}
                          </p>
                        </Link>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <Badge className={`text-xs ${status.className}`}>
                            {status.label}
                          </Badge>
                          <Link
                            href={`/sessions/new?copy=${session.id as string}&team=${session.team_id as string}`}
                            className="rounded-lg border border-[#dce3ea] px-2 py-1 text-xs text-[#5c6a7a] hover:border-[#005F8C] hover:text-[#005F8C]"
                            title="このセッションをコピーして新規作成"
                          >
                            コピー
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
