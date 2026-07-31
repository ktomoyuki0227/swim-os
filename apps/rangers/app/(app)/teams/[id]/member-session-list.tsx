"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Filter = "upcoming" | "past"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  meeting: "ミーティング",
  event: "イベント",
}

interface SessionItem {
  id: string
  title: string
  scheduled_at: string
  location: string | null
  type: string
  session_status: string
  member_price: number
  registration_deadline: string | null
  is_registered: boolean
}

interface MemberSessionListProps {
  teamId: string
  sessions: SessionItem[]
}

export function MemberSessionList({ teamId, sessions }: MemberSessionListProps) {
  const [filter, setFilter] = useState<Filter>("upcoming")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const now = new Date()

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

  const upcoming = sessions.filter((s) => new Date(s.scheduled_at) > now)
  const past = sessions.filter((s) => new Date(s.scheduled_at) <= now).reverse()

  const displayed = filter === "upcoming" ? upcoming : past
  const nextSession = filter === "upcoming" ? upcoming[0] || null : null
  const restSessions = filter === "upcoming" ? upcoming.slice(1) : past

  return (
    <div className="space-y-4">
      {/* セッション見出し + フィルタードロップダウン */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold leading-[1.4] text-[#1a2332]">セッション</h2>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 rounded-full border border-[#dce3ea] bg-white px-3 py-1.5 text-sm font-medium text-[#1a2332] transition-colors hover:border-[#005F8C]"
            style={{ minHeight: 36 }}
          >
            {filter === "upcoming" ? "今後" : "過去"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-[200] mt-1 w-28 overflow-hidden rounded-[10px] border border-[#dce3ea] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
              <button
                onClick={() => { setFilter("upcoming"); setDropdownOpen(false) }}
                className={`flex w-full items-center justify-between px-4 text-sm transition-colors hover:bg-[#f2f7fa] ${filter === "upcoming" ? "font-semibold text-[#005F8C]" : "text-[#1a2332]"}`}
                style={{ minHeight: 44 }}
              >
                今後
                {filter === "upcoming" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <div className="mx-3 h-px bg-[#e8edf2]" />
              <button
                onClick={() => { setFilter("past"); setDropdownOpen(false) }}
                className={`flex w-full items-center justify-between px-4 text-sm transition-colors hover:bg-[#f2f7fa] ${filter === "past" ? "font-semibold text-[#005F8C]" : "text-[#1a2332]"}`}
                style={{ minHeight: 44 }}
              >
                過去
                {filter === "past" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* セッション0件 */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center py-12 px-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-base font-semibold text-[#1a2332]">
            {filter === "upcoming" ? "今後のセッションはありません" : "過去のセッションはありません"}
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            {filter === "upcoming" ? "セッションが作成されると、ここに表示されます" : "参加したセッションの履歴が表示されます"}
          </p>
        </div>
      )}

      {/* 次のセッション（ハイライト・今後タブのみ） */}
      {nextSession && (() => {
        // session_statusのclosed遷移は締切通過を検知するバッチ(1日1回)頼みのため、
        // バッチが未実行の間はisDeadlinePassedを併用して表示上の受付終了を即時反映する
        const isDeadlinePassed = nextSession.registration_deadline &&
          new Date(nextSession.registration_deadline) < now
        const isClosed = nextSession.session_status === "closed" || isDeadlinePassed
        const isConfirmed = nextSession.session_status === "confirmed"
        const isCancelled = nextSession.session_status === "cancelled"
        const canRegister = !nextSession.is_registered && !isClosed && !isConfirmed && !isCancelled

        return (
          <div>
            <Link href={`/teams/${teamId}/sessions/${nextSession.id}`}>
              <Card className="border-[#005F8C]/30 bg-[#f2f7fa] transition-all hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <CardContent className="px-3 py-0">
                  <div className="flex items-center gap-3">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-[8px] bg-[#005F8C] py-2">
                      <span className="text-[10px] font-medium text-white/80">
                        {new Date(nextSession.scheduled_at).toLocaleDateString("ja-JP", { month: "short", timeZone: "Asia/Tokyo" })}
                      </span>
                      <span className="text-xl font-bold leading-tight text-white">
                        {parseInt(new Date(nextSession.scheduled_at).toLocaleDateString("ja-JP", { day: "numeric", timeZone: "Asia/Tokyo" }))}
                      </span>
                      <span className="text-[10px] font-medium text-white/80">
                        {new Date(nextSession.scheduled_at).toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-[#1a2332]">{nextSession.title}</p>
                        <Badge className="shrink-0 bg-[#edf0f4] text-[#475569] border-transparent text-[10px]">
                          {SESSION_TYPE_LABELS[nextSession.type] || nextSession.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#475569]">
                        {new Date(nextSession.scheduled_at).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Tokyo",
                        })}
                        {nextSession.location ? ` · ${nextSession.location}` : ""}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#005F8C]">
                          ¥{(nextSession.member_price || 0).toLocaleString()}
                        </span>
                        {nextSession.is_registered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf7f0] px-2.5 py-0.5 text-xs font-semibold text-[#0f8a4f]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            参加予定
                          </span>
                        ) : canRegister ? (
                          <span className="inline-flex items-center rounded-full bg-[#005F8C] px-3 py-0.5 text-xs font-semibold text-white">
                            参加する →
                          </span>
                        ) : (
                          <Badge className={`text-xs ${
                            isConfirmed
                              ? "bg-[#eaf7f0] text-[#0f8a4f] border-transparent"
                              : isCancelled
                              ? "bg-[#fdecea] text-[#c0392b] border-transparent"
                              : "bg-[#fdf6e3] text-[#b8860b] border-transparent"
                          }`}>
                            {isConfirmed ? "開催確定" : isCancelled ? "中止" : "締切済"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )
      })()}

      {/* 残りのセッション */}
      {restSessions.length > 0 && (
        <div>
          <div className="flex flex-col gap-1.5">
            {restSessions.map((session) => (
              <Link key={session.id} href={`/teams/${teamId}/sessions/${session.id}`}>
                <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                  <CardContent className="flex items-center gap-3 px-3 py-0">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-[6px] bg-[#005F8C]/10 py-1.5">
                      <span className="text-[10px] font-medium text-[#005F8C]">
                        {new Date(session.scheduled_at).toLocaleDateString("ja-JP", { month: "short", timeZone: "Asia/Tokyo" })}
                      </span>
                      <span className="text-lg font-bold leading-tight text-[#005F8C]">
                        {parseInt(new Date(session.scheduled_at).toLocaleDateString("ja-JP", { day: "numeric", timeZone: "Asia/Tokyo" }))}
                      </span>
                      <span className="text-[10px] text-[#005F8C]">
                        {new Date(session.scheduled_at).toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium text-[#1a2332]">{session.title}</p>
                        <Badge className="shrink-0 bg-[#edf0f4] text-[#475569] border-transparent text-[10px]">
                          {SESSION_TYPE_LABELS[session.type] || session.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#475569]">
                        {new Date(session.scheduled_at).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Tokyo",
                        })}
                        {session.location ? ` · ${session.location}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#005F8C]">
                        ¥{(session.member_price || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {(() => {
                        if (filter === "past") {
                          if (session.session_status === "cancelled") {
                            return <Badge className="bg-[#fdecea] text-[#c0392b] border-transparent text-xs">中止</Badge>
                          }
                          return session.is_registered ? (
                            <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-xs">参加済</Badge>
                          ) : null
                        }
                        const isDeadlinePassed = session.registration_deadline &&
                          new Date(session.registration_deadline) < now
                        if (session.session_status === "cancelled") {
                          return <Badge className="bg-[#fdecea] text-[#c0392b] border-transparent text-xs">中止</Badge>
                        }
                        if (session.session_status === "confirmed") {
                          return <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-xs">開催確定</Badge>
                        }
                        if (session.session_status === "closed" || isDeadlinePassed) {
                          return <Badge className="bg-[#fdf6e3] text-[#b8860b] border-transparent text-xs">締切済</Badge>
                        }
                        return <Badge className="bg-[#e8f2f8] text-[#005F8C] border-transparent text-xs">受付中</Badge>
                      })()}
                      {filter === "upcoming" && session.is_registered && (
                        <Badge className="bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-xs">参加予定</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
