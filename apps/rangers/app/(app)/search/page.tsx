import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getPublicSessions } from "@/actions/sessions"
import { getPublicTeams } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchBar } from "./search-bar"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

interface SearchPageProps {
  searchParams: Promise<{ tab?: string; q?: string; location?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const tab = params.tab === "teams" ? "teams" : "sessions"
  // q を優先、旧来の location パラメータにも対応
  const q = params.q || params.location || ""

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // タブ切り替えリンク（現在の q を引き継ぐ）
  const makeTabHref = (t: string) => {
    const p = new URLSearchParams({ tab: t })
    if (q) p.set("q", q)
    return `/search?${p.toString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[#1a2332]">探す</h1>
        <p className="mt-1 text-sm text-[#5c6a7a]">グループやセッションを見つけましょう</p>
      </div>

      {/* タブ（セグメントタブ） */}
      <div className="flex gap-[2px] rounded-[14px] bg-[#f2f7fa] p-1">
        {[
          { key: "sessions", label: "セッション" },
          { key: "teams", label: "グループ" },
        ].map((t) => (
          <Link
            key={t.key}
            href={makeTabHref(t.key)}
            className={`flex min-h-[36px] flex-1 items-center justify-center rounded-[10px] px-[14px] py-2 text-sm transition-colors
              ${tab === t.key ? "bg-white font-semibold text-[#1a2332] shadow-sm" : "font-normal text-[#5c6a7a] hover:text-[#1a2332]"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 検索バー */}
      <SearchBar defaultValue={q} tab={tab} />

      {/* 結果 */}
      {tab === "sessions" ? (
        <SessionResults q={q} />
      ) : (
        <TeamResults q={q} userId={user?.id} />
      )}
    </div>
  )
}

async function SessionResults({ q }: { q: string }) {
  const { data: sessions } = await getPublicSessions({
    q: q || undefined,
    from: new Date().toISOString(),
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
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[#1a2332]">{session.title as string}</p>
                  <Badge className="bg-[#edf0f4] text-[#5c6a7a] border-transparent text-xs">
                    {SESSION_TYPE_LABELS[session.type as string] || session.type as string}
                  </Badge>
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

async function TeamResults({ q, userId }: { q: string; userId?: string }) {
  const { data: teams } = await getPublicTeams({ q: q || undefined, excludeUserId: userId })

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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#005F8C]/10 text-base font-bold text-[#005F8C]">
                {team.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.avatar_url as string} alt={team.name as string} className="h-full w-full object-cover" />
                ) : (
                  (team.name as string)?.[0] || "T"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#1a2332]">{team.name as string}</p>
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
