"use client"

import { useState } from "react"
import Link from "next/link"

export interface CalendarSession {
  id: string
  title: string
  scheduled_at: string
  team_name?: string
  session_type?: string
  href: string
  color?: string
}

interface Props {
  sessions: CalendarSession[]
}

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"]

function toDateKey(date: Date) {
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" })
}

function generateDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7 // 月曜始まり
  const days: (number | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= lastDate; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export function SessionCalendar({ sessions }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedKey, setSelectedKey] = useState<string | null>(toDateKey(today))

  const days = generateDays(year, month)
  const todayKey = toDateKey(today)

  const sessionMap: Record<string, CalendarSession[]> = {}
  for (const s of sessions) {
    const key = toDateKey(new Date(s.scheduled_at))
    if (!sessionMap[key]) sessionMap[key] = []
    sessionMap[key].push(s)
  }

  const selectedSessions = selectedKey ? (sessionMap[selectedKey] || []) : []

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="w-full rounded-xl border border-[#dce3ea] bg-white overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#dce3ea]">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f2f7fa] text-[#5c6a7a] transition-colors"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-[#1a2332]">
          {year}年 {month + 1}月
        </p>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f2f7fa] text-[#5c6a7a] transition-colors"
        >
          ›
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-[#dce3ea]">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-1.5 text-center text-xs font-medium ${
              i === 5 ? "text-[#005F8C]" : i === 6 ? "text-[#c0392b]" : "text-[#8d99a8]"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid w-full grid-cols-7 divide-x divide-y divide-[#f2f7fa]">
        {days.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} className="aspect-square overflow-hidden bg-[#f2f7fa]" />
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const daySessions = sessionMap[key] || []
          const isToday = key === todayKey
          const isSelected = key === selectedKey
          const weekday = i % 7

          return (
            <button
              key={key}
              onClick={() => setSelectedKey(key === selectedKey ? null : key)}
              className={`relative flex min-w-0 flex-col items-center overflow-hidden p-0.5 transition-colors
                ${isSelected ? "bg-[#005F8C]" : isToday ? "bg-[#e8f2f8]" : "bg-white hover:bg-[#f2f7fa]"}
              `}
              style={{ aspectRatio: "1" }}
            >
              {/* 日付 */}
              <span
                className={`mt-0.5 text-xs font-medium leading-none
                  ${isSelected ? "text-white" : isToday ? "font-bold text-[#005F8C]" : weekday === 5 ? "text-[#005F8C]" : weekday === 6 ? "text-[#c0392b]" : "text-[#1a2332]"}
                `}
              >
                {day}
              </span>

              {/* 予定テキストピル */}
              {daySessions.length > 0 && (
                <div className="mt-0.5 w-full space-y-[1px] overflow-hidden">
                  {daySessions.slice(0, 2).map((s) => (
                    <div
                      key={s.id}
                      className="w-full truncate rounded-[2px] px-[2px] text-left"
                      style={{
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.22)"
                          : `${s.color || "#005F8C"}22`,
                        color: isSelected
                          ? "rgba(255,255,255,0.9)"
                          : (s.color || "#005F8C"),
                        fontSize: "8px",
                        lineHeight: "11px",
                      }}
                    >
                      {s.title}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <p
                      className={`text-center leading-none ${isSelected ? "text-white/50" : "text-[#8d99a8]"}`}
                      style={{ fontSize: "7px" }}
                    >
                      +{daySessions.length - 2}
                    </p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 選択日のセッション */}
      {selectedKey && (
        <div className="border-t border-[#dce3ea] min-h-[52px]">
          <div className="p-3 space-y-1">
            {selectedSessions.length === 0 ? (
              <p className="text-xs text-center text-[#8d99a8] py-1">セッションなし</p>
            ) : (
              selectedSessions.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f2f7fa] transition-colors"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: s.color || (s.session_type === "competition" ? "#c0392b" : "#005F8C"),
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[#1a2332]">{s.title}</p>
                    <p className="truncate text-xs text-[#8d99a8]">
                      {new Date(s.scheduled_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}
                      {s.team_name ? ` · ${s.team_name}` : ""}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
