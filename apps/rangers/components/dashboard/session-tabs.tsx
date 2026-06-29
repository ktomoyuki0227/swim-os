"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type TabType = "registered" | "all" | "past"

export interface SessionItem {
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

interface Props {
  registeredUpcoming: SessionItem[]
  allUpcoming: SessionItem[]
  pastSessions: SessionItem[]
}

export function SessionTabs({ registeredUpcoming, allUpcoming, pastSessions }: Props) {
  const [tab, setTab] = useState<TabType>("registered")

  const sessions =
    tab === "registered" ? registeredUpcoming :
    tab === "all" ? allUpcoming :
    pastSessions

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "registered", label: "参加予定", count: registeredUpcoming.length },
    { key: "all", label: "すべて", count: allUpcoming.length },
    { key: "past", label: "過去", count: pastSessions.length },
  ]

  const emptyMessage =
    tab === "registered" ? "参加予定のセッションはありません" :
    tab === "all" ? "セッションはありません" :
    "過去のセッションはありません"

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-[#1a2332]">セッション</h2>

      {/* タブバー */}
      <div className="mb-4 flex gap-1 rounded-xl bg-[#f2f7fa] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors
              ${tab === t.key ? "bg-white text-[#1a2332] shadow-sm" : "text-[#5c6a7a] hover:text-[#1a2332]"}`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold
                  ${tab === t.key ? "bg-[#005F8C]/10 text-[#005F8C]" : "bg-[#dce3ea] text-[#5c6a7a]"}`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* セッションリスト */}
      {sessions.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-[#5c6a7a]">{emptyMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.slice(0, 10).map((session) => (
            <Link key={session.id} href={`/teams/${session.team_id}/sessions/${session.id}`}>
              <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                <CardContent className="flex items-center gap-4 p-4">
                  {/* 日付ブロック */}
                  <div
                    className="flex w-14 shrink-0 flex-col items-center rounded-xl py-2"
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

                  {/* セッション情報 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#1a2332]">{session.title}</p>
                    <p className="text-xs text-[#5c6a7a]">
                      {new Date(session.scheduled_at).toLocaleTimeString("ja-JP", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {session.location ? ` · ${session.location}` : ""}
                    </p>
                    <p className="text-xs text-[#8d99a8]">{session.team_name}</p>
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
