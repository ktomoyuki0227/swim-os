export const dynamic = "force-dynamic"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getPublicSessions } from "@/actions/sessions"
import { Card, CardContent } from "@/components/ui/card"
import { SessionTypeSelect } from "../session-type-select"
import { SubpageSearchForm } from "../subpage-search-form"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

interface SessionsPageProps {
  searchParams: Promise<{ q?: string; sessionType?: string }>
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const params = await searchParams
  const q = params.q || ""
  const sessionType = params.sessionType || "all"

  const { data: sessions } = await getPublicSessions({
    q: q || undefined,
    from: new Date().toISOString(),
    type: sessionType !== "all" ? sessionType : undefined,
  })

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
        preserveParams={sessionType !== "all" ? { sessionType } : undefined}
      />

      {/* 種別フィルター（プルダウン） */}
      <SessionTypeSelect currentValue={sessionType} currentQ={q} />

      {/* 結果 */}
      {!sessions || sessions.length === 0 ? (
        <Card className="rounded-[14px] border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#1a2332]">セッションが見つかりません</p>
            <p className="mt-1 text-sm text-[#5c6a7a]">条件を変更して再検索してみてください</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[#5c6a7a]">{sessions.length}件のセッション</p>
          {sessions.map((session: Record<string, unknown>) => {
            const team = session.team as Record<string, unknown> | null
            const teamId = team?.id as string | undefined
            const href = teamId ? `/teams/${teamId}/sessions/${session.id as string}` : "#"

            return (
              <Link key={session.id as string} href={href}>
                <Card className="border-[#dce3ea] py-0 transition-all hover:border-[#005F8C]">
                  <CardContent className="flex items-center gap-4 px-4 py-3">
                    {/* 日付ブロック */}
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-[14px] bg-[#005F8C]/10 py-2">
                      <span className="text-xs font-medium text-[#005F8C]">
                        {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { month: "short" })}
                      </span>
                      <span className="text-xl font-bold leading-tight text-[#005F8C]">
                        {new Date(session.scheduled_at as string).getDate()}
                      </span>
                      <span className="text-xs text-[#005F8C]">
                        {new Date(session.scheduled_at as string).toLocaleDateString("ja-JP", { weekday: "short" })}
                      </span>
                    </div>

                    {/* 内容 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium text-[#1a2332]">{session.title as string}</p>
                        <span className="rounded-full bg-[#edf0f4] px-2 py-0.5 text-xs text-[#5c6a7a]">
                          {SESSION_TYPE_LABELS[session.type as string] || (session.type as string)}
                        </span>
                      </div>
                      <p className="text-xs text-[#5c6a7a]">
                        {new Date(session.scheduled_at as string).toLocaleTimeString("ja-JP", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {session.location ? ` · ${session.location as string}` : ""}
                      </p>
                      {team && (
                        <p className="text-xs text-[#8d99a8]">{team.name as string}</p>
                      )}
                      <p className="mt-0.5 text-sm font-semibold text-[#005F8C]">
                        ¥{((session.guest_price as number) || 0).toLocaleString()}
                        <span className="text-xs font-normal text-[#8d99a8]">（ゲスト）</span>
                      </p>
                    </div>

                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="2" className="shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
