export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { getPublicSessions } from "@/actions/sessions"
import { SessionTypeSelect } from "../session-type-select"
import { SessionSortSelect } from "../session-sort-select"
import { SubpageSearchForm } from "../subpage-search-form"

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

interface SessionsPageProps {
  searchParams: Promise<{ q?: string; sessionType?: string; sort?: string }>
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const params = await searchParams
  const q = params.q || ""
  const sessionType = params.sessionType || "all"
  const sort = params.sort || "date_asc"

  const { data: rawSessions } = await getPublicSessions({
    q: q || undefined,
    from: new Date().toISOString(),
    type: sessionType !== "all" ? sessionType : undefined,
  })

  // クライアント側でのソート（日時順はサーバー側ですでに ascending）
  const sessions = (() => {
    const list = rawSessions ?? []
    if (sort === "price_asc") {
      return [...list].sort((a, b) => ((a.guest_price as number) || 0) - ((b.guest_price as number) || 0))
    }
    if (sort === "price_desc") {
      return [...list].sort((a, b) => ((b.guest_price as number) || 0) - ((a.guest_price as number) || 0))
    }
    return list
  })()

  return (
    <div className="space-y-3">
      {/* 戻る + タイトル */}
      <div className="flex items-center gap-3">
        <Link
          href="/search"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f7fa] text-[#5c6a7a] hover:bg-[#e0edf5]"
          aria-label="探すに戻る"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-[#1a2332]">セッション</h1>
      </div>

      {/* 検索バー */}
      <SubpageSearchForm
        defaultValue={q}
        placeholder="場所やキーワードで検索..."
        actionPath="/search/sessions"
        preserveParams={{
          ...(sessionType !== "all" ? { sessionType } : {}),
          ...(sort !== "date_asc" ? { sort } : {}),
        }}
      />

      {/* フィルター行（sticky） */}
      <div className="sticky top-16 z-10 -mx-4 border-b border-[#f0f4f8] bg-white/95 px-4 py-2 backdrop-blur">
        <div className="flex gap-2">
          <div className="flex-1">
            <SessionTypeSelect currentValue={sessionType} currentQ={q} />
          </div>
          <SessionSortSelect
            currentValue={sort}
            currentQ={q}
            currentSessionType={sessionType}
          />
        </div>
      </div>

      {/* 結果 */}
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

            return (
              <Link key={session.id as string} href={href} className="block">
                <div className="overflow-hidden rounded-2xl border border-[#dce3ea] bg-white shadow-sm transition-all hover:border-[#c8d8e8] hover:shadow-md">
                  <div className="flex items-stretch">
                    {/* 種別カラーバー */}
                    <div className="w-1 shrink-0" style={{ backgroundColor: style.bar }} />

                    <div className="flex flex-1 items-start gap-3 px-3.5 py-3.5">
                      {/* 日付ブロック（種別カラー） */}
                      <div
                        className="flex w-12 shrink-0 flex-col items-center rounded-[12px] py-2"
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

                      {/* メイン情報 */}
                      <div className="min-w-0 flex-1">
                        {/* タイトル + 種別バッジ */}
                        <div className="flex flex-wrap items-start gap-1.5">
                          <p className="font-semibold leading-snug text-[#1a2332]">
                            {session.title as string}
                          </p>
                          {SESSION_TYPE_LABELS[type] && (
                            <span
                              className="mt-px shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: style.bg, color: style.text }}
                            >
                              {SESSION_TYPE_LABELS[type]}
                            </span>
                          )}
                        </div>

                        {/* 時刻 + 場所 */}
                        <div className="mt-1 flex items-center gap-1 text-xs text-[#5c6a7a]">
                          {/* 時計アイコン */}
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>
                            {scheduledAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {(session.location as string | null) && (
                            <>
                              <span className="text-[#c8d8e8]">·</span>
                              {/* 場所アイコン */}
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span className="truncate">{session.location as string}</span>
                            </>
                          )}
                        </div>

                        {/* チームアバター + チーム名 */}
                        {team && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full bg-[#005F8C]/15">
                              {(team.avatar_url as string | null) ? (
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
                              )}
                            </div>
                            <span className="truncate text-xs text-[#8d99a8]">{team.name as string}</span>
                          </div>
                        )}
                      </div>

                      {/* 価格 + 矢印 */}
                      <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <div className="text-right">
                          <p className="text-base font-bold text-[#005F8C]">
                            ¥{guestPrice.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-[#8d99a8]">ゲスト料金</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
