export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { getPublicSessions } from "@/actions/sessions"
import { SessionSearchInput } from "../session-search-input"
import { SessionFiltersBar } from "../session-filters-bar"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

// 種別ごとのカラー設定
const SESSION_TYPE_STYLES: Record<string, { bar: string; bg: string; text: string }> = {
  practice:    { bar: "#005F8C", bg: "rgba(0,95,140,0.09)",    text: "#005F8C" },
  camp:        { bar: "#D35400", bg: "rgba(211,84,0,0.09)",    text: "#D35400" },
  competition: { bar: "#C0392B", bg: "rgba(192,57,43,0.09)",   text: "#C0392B" },
  event:       { bar: "#0f8a4f", bg: "rgba(15,138,79,0.09)",   text: "#0f8a4f" },
  meeting:     { bar: "#7B5EA7", bg: "rgba(123,94,167,0.09)",  text: "#7B5EA7" },
}
const DEFAULT_STYLE = { bar: "#8d99a8", bg: "rgba(141,153,168,0.09)", text: "#5c6a7a" }

import { MAX_PRICE, DEFAULT_MAX_PRICE } from "../session-price-config"

interface SessionsPageProps {
  searchParams: Promise<{ q?: string; sessionType?: string; sort?: string; dateRange?: string; minPrice?: string; maxPrice?: string }>
}

function computeDateFilter(dateRange: string): { from: string; to?: string } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (dateRange === "today") {
    const tomorrow = new Date(todayStart)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return { from: todayStart.toISOString(), to: tomorrow.toISOString() }
  }
  if (dateRange === "this_week") {
    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return { from: todayStart.toISOString(), to: weekEnd.toISOString() }
  }
  if (dateRange === "this_month") {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { from: todayStart.toISOString(), to: monthEnd.toISOString() }
  }
  return { from: now.toISOString() }
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const params = await searchParams
  const q = params.q || ""
  const sessionType = params.sessionType || "all"
  const sort = params.sort || "date_asc"
  const dateRange = params.dateRange || "all"
  const minPrice = params.minPrice ? Number(params.minPrice) : 0
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : DEFAULT_MAX_PRICE

  const { from, to } = computeDateFilter(dateRange)
  const { data: rawSessions } = await getPublicSessions({
    q: q || undefined,
    from,
    to,
    type: sessionType !== "all" ? sessionType : undefined,
  })

  // クライアント側でのフィルタ + ソート
  const sessions = (() => {
    let list = rawSessions ?? []

    // 料金範囲フィルタ（URLに明示的なパラムがある場合のみ適用）
    if (params.minPrice || params.maxPrice) {
      list = list.filter((s) => {
        const p = (s.guest_price as number) || 0
        return p >= minPrice && p <= maxPrice
      })
    }

    // ソート
    if (sort === "price_asc") {
      return [...list].sort((a, b) => ((a.guest_price as number) || 0) - ((b.guest_price as number) || 0))
    }
    if (sort === "price_desc") {
      return [...list].sort((a, b) => ((b.guest_price as number) || 0) - ((a.guest_price as number) || 0))
    }
    return list
  })()

  return (
    <div className="space-y-0">
      {/* 検索行 + フィルター行（sticky） */}
      <div className="sticky top-0 z-10 -mx-4 overflow-hidden rounded-b-2xl bg-white/95 shadow-sm backdrop-blur">
        {/* 戻るボタン + 検索インプット */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Link
            href="/search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f7fa] text-[#5c6a7a] hover:bg-[#e0edf5]"
            aria-label="探すに戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <SessionSearchInput
            defaultValue={q}
            sessionType={sessionType}
            sort={sort}
            dateRange={dateRange}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />
        </div>
        {/* フィルター行 */}
        <SessionFiltersBar sessionType={sessionType} sort={sort} dateRange={dateRange} minPrice={minPrice} maxPrice={maxPrice} q={q} />
      </div>

      {/* 結果 */}
      <div className="mt-3">
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#dce3ea] bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="font-semibold text-[#1a2332]">セッションが見つかりません</p>
          <p className="mt-1 text-sm text-[#5c6a7a]">条件を変更して再検索してみてください</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#8d99a8]">{sessions.length}件のセッション</p>
          {sessions.map((session: Record<string, unknown>) => {
            const team = session.team as Record<string, unknown> | null
            const teamId = team?.id as string | undefined
            const href = teamId ? `/teams/${teamId}/sessions/${session.id as string}` : "#"
            const type = session.type as string
            const style = SESSION_TYPE_STYLES[type] ?? DEFAULT_STYLE
            const scheduledAt = new Date(session.scheduled_at as string)
            const guestPrice = (session.guest_price as number) || 0

            const location = session.location as string | null
            const dateStr = `${scheduledAt.getMonth() + 1}/${scheduledAt.getDate()}(${scheduledAt.toLocaleDateString("ja-JP", { weekday: "short" })}) ${scheduledAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`

            return (
              <Link key={session.id as string} href={href} className="block">
                <div className="overflow-hidden rounded-2xl border border-[#dce3ea] bg-white shadow-sm transition-all hover:border-[#c8d8e8] hover:shadow-md">
                  <div className="flex items-stretch">
                    {/* 種別カラーバー */}
                    <div className="w-1 shrink-0" style={{ backgroundColor: style.bar }} />

                    {/* カードコンテンツ（グリッドで列幅を明示的に確保） */}
                    <div className="flex-1 grid grid-cols-[44px_1fr_auto_14px] items-center gap-x-3 px-3.5 py-3">
                      {/* 日付ブロック（col 1） */}
                      <div
                        className="flex flex-col items-center rounded-xl py-2"
                        style={{ backgroundColor: style.bg }}
                      >
                        <span className="text-[10px] font-semibold leading-none" style={{ color: style.text }}>
                          {scheduledAt.toLocaleDateString("ja-JP", { month: "short" })}
                        </span>
                        <span className="mt-0.5 text-[22px] font-bold leading-none" style={{ color: style.text }}>
                          {scheduledAt.getDate()}
                        </span>
                        <span className="mt-0.5 text-[10px] leading-none" style={{ color: style.text }}>
                          {scheduledAt.toLocaleDateString("ja-JP", { weekday: "short" })}
                        </span>
                      </div>

                      {/* メイン情報（col 2 = 1fr、超過分はhiddenで封じる） */}
                      <div className="min-w-0 overflow-hidden space-y-1">
                        {/* 行1: タイトル + 種別バッジ */}
                        <div className="flex items-center gap-1.5">
                          <p className="min-w-0 truncate text-sm font-semibold text-[#1a2332]">
                            {session.title as string}
                          </p>
                          {SESSION_TYPE_LABELS[type] && (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: style.bg, color: style.text }}
                            >
                              {SESSION_TYPE_LABELS[type]}
                            </span>
                          )}
                        </div>

                        {/* 行2: 日時 */}
                        <div className="flex items-center gap-1 overflow-hidden text-xs text-[#5c6a7a]">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="truncate">{dateStr}</span>
                        </div>

                        {/* 行3: 場所 */}
                        <div className="flex items-center gap-1 overflow-hidden text-xs text-[#5c6a7a]">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span className={`truncate ${location ? "" : "text-[#c8d8e8]"}`}>
                            {location ?? "-"}
                          </span>
                        </div>

                        {/* 行4: チーム */}
                        <div className="flex items-center gap-1 overflow-hidden text-xs">
                          <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-[#e8eff4]">
                            {team ? (
                              (team.avatar_url as string | null) ? (
                                <Image
                                  src={team.avatar_url as string}
                                  alt={team.name as string}
                                  fill
                                  className="object-cover"
                                  sizes="16px"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[7px] font-bold text-[#005F8C]">
                                  {(team.name as string)?.[0]}
                                </span>
                              )
                            ) : (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute inset-0 m-auto">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                            )}
                          </div>
                          <span className={`truncate ${team ? "text-[#8d99a8]" : "text-[#c8d8e8]"}`}>
                            {team ? (team.name as string) : "-"}
                          </span>
                        </div>
                      </div>

                      {/* ゲスト料金（col 3 = auto、常に確保） */}
                      <div className="text-right">
                        <p className={`text-sm font-bold ${guestPrice > 0 ? "text-[#005F8C]" : "text-[#8d99a8]"}`}>
                          {guestPrice > 0 ? `¥${guestPrice.toLocaleString()}` : "無料"}
                        </p>
                        <p className="text-[10px] text-[#8d99a8]">ゲスト料金</p>
                      </div>

                      {/* 逆くの字（col 4 = 14px） */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
