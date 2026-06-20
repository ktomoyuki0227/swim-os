"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SessionCalendar } from "@/components/session-calendar"
import type { CalendarSession } from "@/components/session-calendar"

type Tab = "all" | "registered" | "past"

export interface ScheduleSessionItem {
  id: string
  title: string
  scheduled_at: string
  location: string | null
  type: string
  team_name: string
  team_id: string
  team_color: string
  is_registered: boolean
}

export interface TeamFilterOption {
  id: string
  name: string
  color: string
}

interface Props {
  sessions: ScheduleSessionItem[]
  teams: TeamFilterOption[]
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

export function ScheduleSection({ sessions, teams }: Props) {
  const [tab, setTab] = useState<Tab>("all")
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    () => new Set(teams.map((t) => t.id))
  )

  const now = new Date()

  const tabFiltered = sessions.filter((s) => {
    const dt = new Date(s.scheduled_at)
    if (tab === "all") return dt > now
    if (tab === "registered") return dt > now && s.is_registered
    if (tab === "past") return dt <= now && s.is_registered
    return true
  })

  const filtered = tabFiltered.filter((s) => selectedTeamIds.has(s.team_id))

  function toggleTeam(teamId: string) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }

  const sorted = [...filtered].sort((a, b) => {
    if (tab === "past") {
      return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    }
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  })

  const calendarSessions: CalendarSession[] = filtered.map((s) => ({
    id: s.id,
    title: s.title,
    scheduled_at: s.scheduled_at,
    team_name: s.team_name,
    session_type: s.type,
    href: `/teams/${s.team_id}/sessions/${s.id}`,
    color: s.team_color,
  }))

  const tabDefs: { key: Tab; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "registered", label: "参加予定" },
    { key: "past", label: "過去" },
  ]

  const emptyMessage =
    tab === "registered" ? "参加予定のセッションはありません" :
    tab === "past" ? "過去の参加セッションはありません" :
    "セッションはありません"

  return (
    <section className="min-w-0 max-w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1a2332]">スケジュール</h2>
      </div>

      {/* タブバー */}
      <div className="mb-3 flex gap-1 rounded-xl bg-[#f2f7fa] p-1">
        {tabDefs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors
              ${tab === t.key ? "bg-white text-[#1a2332] shadow-sm" : "text-[#5c6a7a] hover:text-[#1a2332]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* グループフィルターチップ — 2グループ以上のとき表示 */}
      {teams.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {teams.map((team) => {
            const checked = selectedTeamIds.has(team.id)
            return (
              <button
                key={team.id}
                onClick={() => toggleTeam(team.id)}
                className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={
                  checked
                    ? { border: `1px solid ${team.color}`, backgroundColor: team.color, color: "#fff" }
                    : { border: `1px solid ${team.color}50`, backgroundColor: `${team.color}08`, color: team.color }
                }
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="1" width="8" height="8" rx="1.5" strokeWidth="1.5" />
                  {checked && <polyline points="2,5.5 4,7.5 8,3" strokeWidth="2" />}
                </svg>
                {team.name}
              </button>
            )
          })}
        </div>
      )}

      {/* カレンダー */}
      <SessionCalendar sessions={calendarSessions} />

      {/* セッションリスト */}
      <div className="mt-4">
        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#5c6a7a]">{emptyMessage}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.slice(0, 10).map((session) => (
              <Link
                key={session.id}
                href={`/teams/${session.team_id}/sessions/${session.id}`}
                className="block"
              >
                <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                  <CardContent className="flex items-center gap-4 p-4">
                    {/* 日付 */}
                    <div
                      className="flex w-14 shrink-0 flex-col items-center rounded-xl py-2"
                      style={{ backgroundColor: `${session.team_color}18` }}
                    >
                      <span className="text-[10px] font-medium" style={{ color: session.team_color }}>
                        {new Date(session.scheduled_at).toLocaleDateString("ja-JP", { month: "short" })}
                      </span>
                      <span className="text-xl font-bold leading-tight" style={{ color: session.team_color }}>
                        {new Date(session.scheduled_at).getDate()}
                      </span>
                      <span className="text-[10px]" style={{ color: session.team_color }}>
                        {new Date(session.scheduled_at).toLocaleDateString("ja-JP", { weekday: "short" })}
                      </span>
                    </div>
                    {/* 情報 */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#1a2332]">{session.title}</p>
                      <p className="truncate text-xs text-[#5c6a7a]">
                        {new Date(session.scheduled_at).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {session.location ? ` · ${session.location}` : ""}
                      </p>
                      <p className="truncate text-xs text-[#8d99a8]">{session.team_name}</p>
                    </div>
                    {/* バッジ */}
                    {tab !== "past" && (
                      session.is_registered ? (
                        <Badge className="shrink-0 bg-[#eaf7f0] text-[#0f8a4f] border-transparent text-xs">
                          参加予定
                        </Badge>
                      ) : (
                        <Badge className="shrink-0 bg-[#e8f2f8] text-[#005F8C] border-transparent text-xs">
                          受付中
                        </Badge>
                      )
                    )}
                    {tab === "past" && (
                      <Badge className="shrink-0 bg-[#edf0f4] text-[#5c6a7a] border-transparent text-xs">
                        {SESSION_TYPE_LABELS[session.type] || session.type}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
