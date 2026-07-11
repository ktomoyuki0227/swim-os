import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getPublicSessions } from "@/actions/sessions"
import { getPublicTeams } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "./search-bar"
import { SearchFiltersBar } from "./search-filters-bar"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

interface SearchPageProps {
  searchParams: Promise<{
    tab?: string
    q?: string
    location?: string
    teamType?: string
    sessionType?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const tab = params.tab === "teams" ? "teams" : "sessions"
  const q = params.q || params.location || ""
  const teamType = params.teamType || "all"
  const sessionType = params.sessionType || "all"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const makeTabHref = (t: string) => {
    const p = new URLSearchParams({ tab: t })
    if (q) p.set("q", q)
    return `/search?${p.toString()}`
  }

  // フィルターバーに渡す現在のパラメータ文字列（クライアント側でのURL更新に使用）
  const currentParams = (() => {
    const p = new URLSearchParams()
    if (params.tab) p.set("tab", params.tab)
    if (params.q) p.set("q", params.q)
    if (params.teamType) p.set("teamType", params.teamType)
    if (params.sessionType) p.set("sessionType", params.sessionType)
    return p.toString()
  })()

  return (
    <div className="space-y-3">
      {/* ページタイトル */}
      <h1 className="text-lg font-semibold text-[#1a2332]">探す</h1>

      {/* 検索バー */}
      <SearchBar defaultValue={q} tab={tab} />

      {/* タブ + フィルター（同一行） */}
      <div className="flex items-center justify-between gap-3">
        {/* タブ切り替え */}
        <div className="flex flex-1 gap-[2px] rounded-[14px] bg-[#f2f7fa] p-1">
          {[
            { key: "sessions", label: "セッション" },
            { key: "teams", label: "グループ" },
          ].map((t) => (
            <Link
              key={t.key}
              href={makeTabHref(t.key)}
              className={`flex flex-1 min-h-[36px] items-center justify-center whitespace-nowrap rounded-[10px] px-[14px] py-2 text-sm transition-colors
                ${tab === t.key
                  ? "bg-white font-semibold text-[#1a2332] shadow-sm"
                  : "font-normal text-[#5c6a7a] hover:text-[#1a2332]"
                }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* フィルターボタン */}
        <SearchFiltersBar
          tab={tab}
          sessionType={sessionType}
          teamType={teamType}
          currentParams={currentParams}
        />
      </div>

      {/* 結果 */}
      {tab === "sessions" ? (
        <SessionResults q={q} sessionType={sessionType} />
      ) : (
        <TeamResults q={q} userId={user?.id} teamType={teamType} />
      )}
    </div>
  )
}

async function SessionResults({ q, sessionType }: { q: string; sessionType: string }) {
  const { data: sessions } = await getPublicSessions({
    q: q || undefined,
    from: new Date().toISOString(),
    type: sessionType !== "all" ? sessionType : undefined,
  })

  if (!sessions || sessions.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#5c6a7a]">{sessions.length}件のセッション</p>
      {sessions.map((session: Record<string, unknown>) => {
        const team = session.team as Record<string, unknown> | null
        return (
          <Card key={session.id as string} className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
            <CardContent className="flex items-center gap-4 p-4">
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
                    {SESSION_TYPE_LABELS[session.type as string] || session.type as string}
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
                  ¥{(session.guest_price as number || 0).toLocaleString()}
                  <span className="text-xs font-normal text-[#8d99a8]">（ゲスト）</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

async function TeamResults({ q, userId, teamType }: { q: string; userId?: string; teamType: string }) {
  const { data: teams } = await getPublicTeams({
    q: q || undefined,
    excludeUserId: userId,
    teamType: teamType !== "all" ? (teamType as "team" | "personal") : undefined,
  })

  if (!teams || teams.length === 0) {
    return (
      <Card className="rounded-[14px] border-[#dce3ea]">
        <CardContent className="flex flex-col items-center justify-center px-6 py-12">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-base font-semibold text-[#1a2332]">グループが見つかりません</p>
          <p className="mt-1 text-sm text-[#5c6a7a]">条件を変更して再検索してみてください</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#5c6a7a]">{teams.length}件のグループ</p>
      {teams.map((team: Record<string, unknown>) => (
        <Link key={team.id as string} href={`/teams/${team.id}`}>
          <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
            <CardContent className="flex items-center gap-4 p-4">
              {/* アバター */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-[#005F8C]/10">
                {team.avatar_url ? (
                  <Image
                    src={team.avatar_url as string}
                    alt={team.name as string}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#005F8C]">
                    {(team.name as string)?.[0] || "T"}
                  </div>
                )}
              </div>
              {/* 内容 */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-medium text-[#1a2332]">{team.name as string}</p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={
                      team.team_type === "personal"
                        ? { backgroundColor: "#eaf7f0", color: "#0f8a4f" }
                        : { backgroundColor: "#e8f2f8", color: "#005F8C" }
                    }
                  >
                    {team.team_type === "personal" ? "パーソナル" : "チーム"}
                  </span>
                </div>
                {(team.description as string | null) && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-[#5c6a7a]">
                    {team.description as string}
                  </p>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="2" className="shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
