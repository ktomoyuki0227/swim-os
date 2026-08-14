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

interface AdminSessionItem {
  id: string
  title: string
  scheduled_at: string
  location: string | null
  type: string
  session_status: string
  /** 現金払いでまだ受領済みになっていない参加登録の件数（過去タブでのみ意味を持つ） */
  pendingCashCount: number
}

interface AdminSessionListProps {
  sessions: AdminSessionItem[]
}

/**
 * チーム詳細ページ（管理者ビュー）のセッション一覧。member-session-list.tsx と同じ
 * 「今後／過去」切り替えパターンを管理者向けに適用したもの。従来は開催日を過ぎた
 * セッションが一覧から恒久的に消えてしまい、翌日以降に現金集金の処理をしようにも
 * 辿り着けない導線だったため、過去タブを追加した（フィードバック対応）。
 * 過去タブでは現金未回収の参加登録が残っているセッションに「未回収」バッジを出し、
 * 処理し忘れが一目でわかるようにする。
 */
export function AdminSessionList({ sessions }: AdminSessionListProps) {
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

  const upcoming = sessions
    .filter((s) => new Date(s.scheduled_at) > now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const past = sessions
    .filter((s) => new Date(s.scheduled_at) <= now)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  const displayed = (filter === "upcoming" ? upcoming : past).slice(0, 10)
  const pendingCashTotal = past.reduce((sum, s) => sum + s.pendingCashCount, 0)

  return (
    <div>
      {/* 見出し + フィルタードロップダウン */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[18px] font-semibold leading-[1.4] text-[#1a2332]">セッション</h2>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 rounded-full border border-[#dce3ea] bg-white px-3 py-1.5 text-sm font-medium text-[#1a2332] transition-colors hover:border-[#005F8C]"
            style={{ minHeight: 36 }}
          >
            {filter === "upcoming" ? "今後" : "過去"}
            {/* 現在の表示に関わらず「過去に未回収の現金精算が残っている」ことを示す通知。
                今後タブを見ている間に見落とさないよう、フィルター文言とは切り離して常に出す */}
            {pendingCashTotal > 0 && (
              <span
                className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0392b] px-1 text-[10px] font-bold text-white"
                title={`過去のセッションに現金未回収が${pendingCashTotal}件あります`}
              >
                {pendingCashTotal}
              </span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-[200] mt-1 w-36 overflow-hidden rounded-[10px] border border-[#dce3ea] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
              <button
                type="button"
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
                type="button"
                onClick={() => { setFilter("past"); setDropdownOpen(false) }}
                className={`flex w-full items-center justify-between px-4 text-sm transition-colors hover:bg-[#f2f7fa] ${filter === "past" ? "font-semibold text-[#005F8C]" : "text-[#1a2332]"}`}
                style={{ minHeight: 44 }}
              >
                過去
                <span className="flex items-center gap-1.5">
                  {pendingCashTotal > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0392b] px-1 text-[10px] font-bold text-white">
                      {pendingCashTotal}
                    </span>
                  )}
                  {filter === "past" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 0件 */}
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
            {filter === "upcoming" ? "予定されているセッションはありません" : "過去のセッションはありません"}
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            {filter === "upcoming" ? "セッションを作成して、メンバーに共有しましょう" : "開催済みのセッションがここに表示されます"}
          </p>
        </div>
      )}

      {/* 一覧 */}
      {displayed.length > 0 && (
        <div className="flex flex-col gap-3">
          {displayed.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium text-[#1a2332]">{session.title}</p>
                      <Badge className="shrink-0 bg-[#edf0f4] text-[#475569] border-transparent text-[10px]">
                        {SESSION_TYPE_LABELS[session.type] || session.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#475569]">
                      {new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Tokyo",
                      })}
                      {session.location ? ` · ${session.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge
                      className={
                        session.session_status === "confirmed"
                          ? "border-transparent bg-[#eaf7f0] text-[#0f8a4f]"
                          : session.session_status === "closed"
                          ? "border-transparent bg-[#fdf6e3] text-[#b8860b]"
                          : session.session_status === "cancelled"
                          ? "border-transparent bg-[#fdecea] text-[#c0392b]"
                          : "border-transparent bg-[#e8f2f8] text-[#005F8C]"
                      }
                    >
                      {session.session_status === "confirmed"
                        ? "確定"
                        : session.session_status === "closed"
                        ? "受付終了・判断待ち"
                        : session.session_status === "cancelled"
                        ? "中止"
                        : "受付中"}
                    </Badge>
                    {filter === "past" && session.pendingCashCount > 0 && (
                      <Badge className="border-transparent bg-[#fdecea] text-[#c0392b] text-[10px]">
                        現金未回収 {session.pendingCashCount}件
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
