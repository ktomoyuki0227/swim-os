export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTeam } from "@/actions/teams"
import { getTeamSessions } from "@/actions/sessions"
import { getTeamAnnouncements } from "@/actions/announcements"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarkReadButton } from "./mark-read-button"

interface TeamPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function TeamPage({ params, searchParams }: TeamPageProps) {
  const { id } = await params
  const { tab = "sessions" } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [teamResult, sessionsResult, announcementsResult] = await Promise.all([
    getTeam(id),
    getTeamSessions(id),
    getTeamAnnouncements(id),
  ])

  if (teamResult.error || !teamResult.data) {
    notFound()
  }

  const team = teamResult.data
  const sessions = ((sessionsResult.data || []) as Record<string, unknown>[])
    .filter((s) => s.session_status !== "cancelled" && new Date(s.scheduled_at as string) > new Date())
    .sort((a, b) => new Date(a.scheduled_at as string).getTime() - new Date(b.scheduled_at as string).getTime())
  const announcements = (announcementsResult.data || []) as Record<string, unknown>[]
  const unreadCount = announcements.filter((a) => !a.is_read).length

  // 自分の参加済みセッションIDを取得
  let registeredSessionIds = new Set<string>()
  if (user && sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id as string)
    const { data: regs } = await supabase
      .from("session_registrations")
      .select("session_id")
      .eq("swimmer_id", user.id)
      .in("session_id", sessionIds)
      .is("cancelled_at", null)
    registeredSessionIds = new Set((regs || []).map((r) => r.session_id))
  }

  const tabs = [
    { id: "sessions", label: `セッション (${sessions.length})` },
    { id: "announcements", label: `お知らせ${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/teams" className="text-sm text-[#5c6a7a] hover:text-[#1a2332]">
          ← チーム
        </Link>
        <h1 className="mt-2 text-xl font-bold text-[#1a2332]">{team.name}</h1>
        {team.description && (
          <p className="mt-1 text-sm text-[#5c6a7a]">{team.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#dce3ea]">
        <div className="flex gap-0">
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
                        ¥{(session.member_price as number || 0).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        registeredSessionIds.has(session.id as string)
                          ? "bg-[#eaf7f0] text-[#0f8a4f] border-transparent"
                          : session.session_status === "confirmed"
                          ? "bg-[#eaf7f0] text-[#0f8a4f] border-transparent"
                          : "bg-[#e8f2f8] text-[#005F8C] border-transparent"
                      }
                    >
                      {registeredSessionIds.has(session.id as string)
                        ? "参加予定"
                        : session.session_status === "confirmed"
                        ? "確定"
                        : "受付中"}
                    </Badge>
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
  )
}
