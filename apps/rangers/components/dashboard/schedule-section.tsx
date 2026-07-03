"use client"

import { useState, useCallback, useEffect } from "react"
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

const TAB_LABELS: Record<Tab, string> = {
  all: "すべて",
  registered: "参加予定",
  past: "過去",
}

type SheetType = "tab" | "team" | null

export function ScheduleSection({ sessions, teams }: Props) {
  const [tab, setTab] = useState<Tab>("all")
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    () => new Set(teams.map((t) => t.id))
  )
  const [openSheet, setOpenSheet] = useState<SheetType>(null)

  const now = new Date()

  const tabFiltered = sessions.filter((s) => {
    const dt = new Date(s.scheduled_at)
    if (tab === "all") return dt > now
    if (tab === "registered") return dt > now && s.is_registered
    if (tab === "past") return dt <= now && s.is_registered
    return true
  })

  const filtered = tabFiltered.filter((s) => selectedTeamIds.has(s.team_id))

  const toggleTeam = useCallback((teamId: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }, [])

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

  const emptyMessage =
    tab === "registered" ? "参加予定のセッションはありません" :
    tab === "past" ? "過去の参加セッションはありません" :
    "セッションはありません"

  // ESCキーでシート閉じる + 背景スクロールロック
  useEffect(() => {
    if (!openSheet) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSheet(null)
    }
    document.addEventListener("keydown", handleEsc)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [openSheet])

  const isDefaultFilter = tab === "all" && selectedTeamIds.size === teams.length

  const resetFilters = useCallback(() => {
    setTab("all")
    setSelectedTeamIds(new Set(teams.map((t) => t.id)))
  }, [teams])

  // フィルターボタンのラベル
  const teamFilterLabel =
    selectedTeamIds.size === teams.length
      ? "全グループ"
      : selectedTeamIds.size === 0
        ? "未選択"
        : `${selectedTeamIds.size}グループ`

  return (
    <section className="min-w-0 max-w-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold leading-[1.4] text-[#1a2332]">スケジュール</h2>
      </div>

      {/* フィルターバー（1行） */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setOpenSheet(openSheet === "tab" ? null : "tab")}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#005F8C] ${
            tab !== "all"
              ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
              : "border-[#dce3ea] bg-white text-[#1a2332]"
          }`}
          style={{ minHeight: 36 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {TAB_LABELS[tab]}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {teams.length > 1 && (
          <button
            onClick={() => setOpenSheet(openSheet === "team" ? null : "team")}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#005F8C] ${
              selectedTeamIds.size !== teams.length
                ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
                : "border-[#dce3ea] bg-white text-[#1a2332]"
            }`}
            style={{ minHeight: 36 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {teamFilterLabel}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* リセットボタン — フィルター変更時のみ表示 */}
        {!isDefaultFilter && (
          <button
            onClick={resetFilters}
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#005F8C] transition-colors hover:bg-[#e8f2f8]"
            aria-label="フィルターをリセット"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}
      </div>

      {/* カレンダー */}
      <SessionCalendar sessions={calendarSessions} />

      {/* セッションリスト */}
      <div className="mt-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-12 px-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#1a2332]">{emptyMessage}</p>
            <p className="mt-1 text-sm text-[#5c6a7a]">
              {tab === "registered" ? "セッションに参加登録すると、ここに表示されます" :
               tab === "past" ? "参加したセッションの履歴が表示されます" :
               "グループのセッションが作成されると表示されます"}
            </p>
          </div>
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
                      className="flex w-14 shrink-0 flex-col items-center rounded-[6px] py-2"
                      style={{ backgroundColor: `${session.team_color}18` }}
                    >
                      <span className="text-xs font-medium" style={{ color: session.team_color }}>
                        {new Date(session.scheduled_at).toLocaleDateString("ja-JP", { month: "short" })}
                      </span>
                      <span className="text-xl font-bold leading-tight" style={{ color: session.team_color }}>
                        {new Date(session.scheduled_at).getDate()}
                      </span>
                      <span className="text-xs" style={{ color: session.team_color }}>
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

      {/* ボトムシート: 表示内容 */}
      {openSheet === "tab" && (
        <div
          className="fixed inset-0 z-[300] flex items-end sm:items-center sm:justify-center"
          style={{ minHeight: "100dvh" }}
          onClick={() => setOpenSheet(null)}
          role="dialog"
          aria-modal="true"
          aria-label="表示内容を選択"
        >
          <div className="absolute inset-0 bg-black/45" />
          <div
            className="relative z-[400] w-full max-w-sm rounded-t-[14px] bg-white px-5 pt-4 shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:rounded-[14px]"
            style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ドラッグハンドル */}
            <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-[#dce3ea] sm:hidden" />
            <h3 className="mb-4 text-[18px] font-semibold text-[#1a2332]">表示内容</h3>
            <div className="flex flex-col gap-1">
              {(["all", "registered", "past"] as Tab[]).map((key) => {
                const isActive = tab === key
                return (
                  <button
                    key={key}
                    onClick={() => { setTab(key); setOpenSheet(null) }}
                    className={`flex items-center justify-between rounded-[10px] px-4 py-3 text-left text-base transition-colors ${
                      isActive
                        ? "bg-[#e8f2f8] font-semibold text-[#005F8C]"
                        : "text-[#1a2332] hover:bg-[#f2f7fa]"
                    }`}
                    style={{ minHeight: 48 }}
                  >
                    {TAB_LABELS[key]}
                    {isActive && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ボトムシート: グループ */}
      {openSheet === "team" && (
        <div
          className="fixed inset-0 z-[300] flex items-end sm:items-center sm:justify-center"
          style={{ minHeight: "100dvh" }}
          onClick={() => setOpenSheet(null)}
          role="dialog"
          aria-modal="true"
          aria-label="グループを選択"
        >
          <div className="absolute inset-0 bg-black/45" />
          <div
            className="relative z-[400] w-full max-w-sm rounded-t-[14px] bg-white px-5 pt-4 shadow-[0_8px_32px_rgba(0,0,0,0.14)] sm:rounded-[14px]"
            style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-[#dce3ea] sm:hidden" />
            <h3 className="mb-4 text-[18px] font-semibold text-[#1a2332]">グループ</h3>
            <div className="flex flex-col gap-1">
              {teams.map((team) => {
                const checked = selectedTeamIds.has(team.id)
                return (
                  <button
                    key={team.id}
                    onClick={() => toggleTeam(team.id)}
                    className={`flex items-center gap-3 rounded-[10px] px-4 py-3 text-left text-base transition-colors ${
                      checked ? "bg-[#f2f7fa]" : "hover:bg-[#f2f7fa]"
                    }`}
                    style={{ minHeight: 48 }}
                  >
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className={`flex-1 ${checked ? "font-semibold text-[#1a2332]" : "text-[#5c6a7a]"}`}>
                      {team.name}
                    </span>
                    {checked && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
