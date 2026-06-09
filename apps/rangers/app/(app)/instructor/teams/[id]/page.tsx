export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { getTeam, getTeamMembers } from "@/actions/teams"
import { getTeamSessions } from "@/actions/sessions"
import { getTeamAnnouncements } from "@/actions/announcements"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InviteSection } from "./invite-section"
import { MemberList } from "./member-list"
import { AnnouncementsSection } from "./announcements-section"

interface TeamDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function TeamDetailPage({ params, searchParams }: TeamDetailPageProps) {
  const { id } = await params
  const { tab = "members" } = await searchParams

  const [teamResult, membersResult, sessionsResult, announcementsResult] = await Promise.all([
    getTeam(id),
    getTeamMembers(id),
    getTeamSessions(id),
    getTeamAnnouncements(id),
  ])

  if (teamResult.error || !teamResult.data) {
    notFound()
  }

  const team = teamResult.data
  const members = membersResult.data || []
  const sessions = (sessionsResult.data || []).filter(
    (s: Record<string, unknown>) => s.session_status === "open" || s.session_status === "confirmed"
  ).slice(0, 5)
  const announcements = (announcementsResult.data || []) as Array<{
    id: string
    title: string
    body: string | null
    created_at: string
  }>

  const tabs = [
    { id: "members", label: `メンバー (${members.length})` },
    { id: "sessions", label: "セッション" },
    { id: "announcements", label: `お知らせ (${announcements.length})` },
    { id: "invite", label: "招待" },
    { id: "settings", label: "設定" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2332]">{team.name}</h1>
          {team.description && (
            <p className="mt-1 text-sm text-[#5c6a7a]">{team.description}</p>
          )}
        </div>
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-[#dce3ea]">
          <CardContent className="px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-[#005F8C]">{members.length}</p>
            <p className="text-xs text-[#5c6a7a]">メンバー</p>
          </CardContent>
        </Card>
        <Card className="border-[#dce3ea]">
          <CardContent className="px-3 py-2.5 text-center">
            <p className="text-xl font-bold text-[#005F8C]">{sessions.length}</p>
            <p className="text-xs text-[#5c6a7a]">予定セッション</p>
          </CardContent>
        </Card>
        <Card className="border-[#dce3ea]">
          <CardContent className="px-3 py-2.5 text-center">
            <p className="truncate text-xl font-bold text-[#005F8C]">
              {team.annual_fee_amount ? `¥${team.annual_fee_amount.toLocaleString()}` : "-"}
            </p>
            <p className="text-xs text-[#5c6a7a]">年会費</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#dce3ea]">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/instructor/teams/${id}?tab=${t.id}`}
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
        <MemberList teamId={id} members={members} />
      )}

      {tab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1a2332]">セッション</h2>
            <Link href={`/instructor/sessions/new?team=${id}`}>
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
                <Link href={`/instructor/sessions/new?team=${id}`} className="mt-3">
                  <Button variant="outline" size="sm" className="rounded-full border-[#005F8C] text-[#005F8C]">
                    セッションを作成する
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((session: Record<string, unknown>) => (
                <Link key={session.id as string} href={`/instructor/sessions/${session.id}`}>
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
              <Link href={`/instructor/sessions?team=${id}`} className="block text-center text-sm text-[#005F8C] hover:underline">
                すべて表示 →
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === "announcements" && (
        <AnnouncementsSection teamId={id} announcements={announcements} />
      )}

      {tab === "invite" && (
        <InviteSection team={team} />
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardHeader>
              <CardTitle className="text-base text-[#1a2332]">チーム設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6a7a]">デフォルト参加費（メンバー）</span>
                <span className="font-medium text-[#1a2332]">
                  ¥{(team.default_member_price || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6a7a]">デフォルト参加費（ゲスト）</span>
                <span className="font-medium text-[#1a2332]">
                  ¥{(team.default_guest_price || 0).toLocaleString()}
                </span>
              </div>
              {team.monthly_fee_amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#5c6a7a]">月謝</span>
                  <span className="font-medium text-[#1a2332]">
                    ¥{team.monthly_fee_amount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6a7a]">キャンセル期限</span>
                <span className="font-medium text-[#1a2332]">
                  {team.cancellation_days}日前まで
                </span>
              </div>
            </CardContent>
          </Card>
          <Link href={`/instructor/teams/${id}/edit`}>
            <Button
              variant="outline"
              className="w-full rounded-full border-[#005F8C] text-[#005F8C]"
              style={{ minHeight: "48px" }}
            >
              チーム情報を編集
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
