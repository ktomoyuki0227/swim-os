export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getPublicSessions } from "@/actions/sessions"
import { getPublicTeams } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { SearchBar } from "./search-bar"
import { FilterChips } from "./filter-chips"

const SESSION_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  camp: "合宿",
  competition: "大会",
  event: "イベント",
  meeting: "ミーティング",
}

const SESSION_TYPE_OPTIONS = [
  { key: "all", label: "すべて" },
  { key: "practice", label: "練習" },
  { key: "camp", label: "合宿" },
  { key: "competition", label: "大会" },
  { key: "event", label: "イベント" },
  { key: "meeting", label: "ミーティング" },
]

const TEAM_TYPE_OPTIONS = [
  { key: "all", label: "すべて" },
  { key: "team", label: "チーム" },
  { key: "personal", label: "パーソナル" },
]

interface SearchPageProps {
  searchParams: Promise<{
    tab?: string
    q?: string
    teamType?: string
    sessionType?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  // タブ未選択 = カテゴリ選択画面
  if (!params.tab) {
    return <CategorySelectView />
  }

  const tab = params.tab === "teams" ? "teams" : "sessions"
  const q = params.q || ""
  const teamType = params.teamType || "all"
  const sessionType = params.sessionType || "all"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentParams = (() => {
    const p = new URLSearchParams()
    p.set("tab", tab)
    if (q) p.set("q", q)
    if (params.teamType) p.set("teamType", params.teamType)
    if (params.sessionType) p.set("sessionType", params.sessionType)
    return p.toString()
  })()

  return (
    <div className="space-y-3">
      {/* ページタイトル */}
      <h1 className="text-lg font-semibold text-[#1a2332]">
        {tab === "sessions" ? "セッション" : "グループ"}を探す
      </h1>

      {/* 検索バー */}
      <SearchBar defaultValue={q} tab={tab} />

      {/* フィルターチップ（横スクロール） */}
      {tab === "sessions" ? (
        <FilterChips
          options={SESSION_TYPE_OPTIONS}
          paramKey="sessionType"
          currentValue={sessionType}
          currentParams={currentParams}
        />
      ) : (
        <FilterChips
          options={TEAM_TYPE_OPTIONS}
          paramKey="teamType"
          currentValue={teamType}
          currentParams={currentParams}
        />
      )}

      {/* 結果 */}
      {tab === "sessions" ? (
        <SessionResults q={q} sessionType={sessionType} />
      ) : (
        <TeamResults q={q} userId={user?.id} teamType={teamType} />
      )}
    </div>
  )
}

// ─── カテゴリ選択画面 ─────────────────────────────────────────────────────────

function CategorySelectView() {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold text-[#1a2332]">探す</h1>

      {/* セッション - 全幅 */}
      <Link href="/search?tab=sessions" className="block">
        <div
          className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
          style={{ background: "linear-gradient(135deg, #005F8C 0%, #003F62 100%)" }}
        >
          {/* SVG イラスト: 泳ぐ人 + 波 */}
          <svg
            className="absolute right-0 top-0 h-full w-auto"
            viewBox="0 0 200 144"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* 背景円 */}
            <circle cx="130" cy="72" r="80" fill="rgba(255,255,255,0.05)" />
            {/* 頭 */}
            <circle cx="148" cy="42" r="13" fill="rgba(255,255,255,0.22)" />
            {/* 体 */}
            <ellipse
              cx="118"
              cy="65"
              rx="30"
              ry="10"
              fill="rgba(255,255,255,0.18)"
              transform="rotate(-12 118 65)"
            />
            {/* 前腕 */}
            <path
              d="M82 62 Q106 50 130 58"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* 後腕 */}
            <path
              d="M130 58 Q154 62 168 50"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* 脚 */}
            <path
              d="M100 72 Q120 82 140 76 Q155 72 165 80"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* 波 1 */}
            <path
              d="M20 100 Q50 90 80 100 Q110 110 140 100 Q165 92 190 100"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* 波 2 */}
            <path
              d="M0 114 Q35 105 65 114 Q95 123 125 114 Q155 105 185 114"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* 波 3 */}
            <path
              d="M10 127 Q45 120 75 127 Q105 134 135 127 Q160 120 190 127"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* テキスト */}
          <div className="absolute bottom-0 left-0 p-5">
            <p className="text-xl font-bold tracking-tight text-white">セッション</p>
            <p className="mt-0.5 text-sm text-white/70">スイミングセッションを探す</p>
          </div>

          {/* 右矢印 */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>

      {/* チーム + パーソナル - 同じ行・同じ高さ */}
      <div className="flex gap-3">
        {/* チーム */}
        <Link href="/search?tab=teams&teamType=team" className="flex-1">
          <div
            className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
            style={{ background: "linear-gradient(135deg, #0f8a4f 0%, #076938 100%)" }}
          >
            {/* SVG イラスト: 3人のグループ */}
            <svg
              className="absolute right-0 top-0 h-full w-auto"
              viewBox="0 0 130 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="80" cy="80" r="70" fill="rgba(255,255,255,0.05)" />
              {/* 人1 (左) */}
              <circle cx="35" cy="52" r="11" fill="rgba(255,255,255,0.2)" />
              <rect x="25" y="67" width="20" height="30" rx="6" fill="rgba(255,255,255,0.15)" />
              <line x1="25" y1="78" x2="12" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
              <line x1="45" y1="78" x2="56" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
              {/* 人2 (中央・大) */}
              <circle cx="68" cy="44" r="13" fill="rgba(255,255,255,0.26)" />
              <rect x="56" y="61" width="24" height="34" rx="7" fill="rgba(255,255,255,0.2)" />
              <line x1="56" y1="74" x2="42" y2="66" stroke="rgba(255,255,255,0.22)" strokeWidth="5" strokeLinecap="round" />
              <line x1="80" y1="74" x2="94" y2="66" stroke="rgba(255,255,255,0.22)" strokeWidth="5" strokeLinecap="round" />
              {/* 人3 (右) */}
              <circle cx="102" cy="52" r="11" fill="rgba(255,255,255,0.2)" />
              <rect x="92" y="67" width="20" height="30" rx="6" fill="rgba(255,255,255,0.15)" />
              <line x1="92" y1="78" x2="80" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
              <line x1="112" y1="78" x2="124" y2="70" stroke="rgba(255,255,255,0.18)" strokeWidth="5" strokeLinecap="round" />
            </svg>

            {/* テキスト */}
            <div className="absolute bottom-0 left-0 p-4">
              <p className="text-base font-bold text-white">チーム</p>
              <p className="mt-0.5 text-xs text-white/70">仲間と一緒に泳ぐ</p>
            </div>
          </div>
        </Link>

        {/* パーソナル */}
        <Link href="/search?tab=teams&teamType=personal" className="flex-1">
          <div
            className="relative h-36 overflow-hidden rounded-2xl transition-opacity active:opacity-90"
            style={{ background: "linear-gradient(135deg, #7B5EA7 0%, #5438A0 100%)" }}
          >
            {/* SVG イラスト: コーチ + ストップウォッチ */}
            <svg
              className="absolute right-0 top-0 h-full w-auto"
              viewBox="0 0 130 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="80" cy="80" r="70" fill="rgba(255,255,255,0.05)" />
              {/* ストップウォッチ */}
              <circle cx="80" cy="42" r="24" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="rgba(255,255,255,0.07)" />
              <line x1="80" y1="18" x2="80" y2="13" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
              <line x1="74" y1="11" x2="86" y2="11" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" />
              {/* 針 */}
              <line x1="80" y1="42" x2="80" y2="27" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="80" y1="42" x2="92" y2="36" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
              {/* 人 */}
              <circle cx="60" cy="82" r="12" fill="rgba(255,255,255,0.22)" />
              <rect x="49" y="97" width="22" height="32" rx="7" fill="rgba(255,255,255,0.17)" />
              <line x1="49" y1="109" x2="36" y2="101" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
              <line x1="71" y1="109" x2="84" y2="101" stroke="rgba(255,255,255,0.2)" strokeWidth="5" strokeLinecap="round" />
            </svg>

            {/* テキスト */}
            <div className="absolute bottom-0 left-0 p-4">
              <p className="text-base font-bold text-white">パーソナル</p>
              <p className="mt-0.5 text-xs text-white/70">個別指導を受ける</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

// ─── 検索結果コンポーネント ────────────────────────────────────────────────────

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
    <div className="flex flex-col gap-2">
      <p className="text-sm text-[#5c6a7a]">{teams.length}件のグループ</p>
      {teams.map((team: Record<string, unknown>) => (
        <Link key={team.id as string} href={`/teams/${team.id}`}>
          <Card className="border-[#dce3ea] py-0 transition-all hover:border-[#005F8C]">
            <CardContent className="flex items-center gap-4 px-4 py-3">
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
