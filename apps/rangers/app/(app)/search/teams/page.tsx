export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPublicTeams } from "@/actions/teams"
import { TeamSearchInput } from "./team-search-input"
import { TeamFiltersBar } from "./team-filters-bar"

interface TeamsPageProps {
  searchParams: Promise<{
    q?: string
    sort?: string
    recruiting?: string
    days?: string
    prefecture?: string
  }>
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams
  const q = params.q || ""
  const sort = (params.sort === "name" ? "name" : "newest") as "newest" | "name"
  const recruitingOnly = params.recruiting !== "0"
  const days = params.days ? params.days.split(",").filter(Boolean) : []
  const prefectures = params.prefecture ? params.prefecture.split(",").filter(Boolean) : []

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: teams } = await getPublicTeams({
    q: q || undefined,
    excludeUserId: user?.id,
    teamType: "team",
    sort,
    recruitingOnly,
    days: days.length > 0 ? days : undefined,
    prefectures: prefectures.length > 0 ? prefectures : undefined,
  })

  return (
    <div className="space-y-0">
      {/* 検索行 + フィルター行（sticky） */}
      <div className="sticky top-0 z-10 -mx-4 overflow-hidden rounded-b-2xl bg-white/95 shadow-sm backdrop-blur">
        {/* 戻るボタン + 検索インプット */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Link
            href="/search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f7fa] text-[#475569] hover:bg-[rgba(0,95,140,0.08)]"
            aria-label="探すに戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <TeamSearchInput
            defaultValue={q}
            sort={sort}
            recruitingOnly={recruitingOnly}
            days={days}
            prefectures={prefectures}
          />
        </div>
        {/* フィルター行 */}
        <TeamFiltersBar sort={sort} recruitingOnly={recruitingOnly} days={days} prefectures={prefectures} q={q} />
      </div>

      {/* 結果 */}
      <div className="mt-3">
        {!teams || teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#dce3ea] bg-white px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(15,138,79,0.08)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="font-semibold text-[#1a2332]">チームが見つかりません</p>
            <p className="mt-1 text-sm text-[#475569]">条件を変更して再検索してみてください</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[#64748b]">{teams.length}件のチーム</p>
            {teams.map((team: Record<string, unknown>) => {
              const area = team.activity_area as string | null
              const pool = team.main_pool as string | null
              const frequency = team.practice_frequency as string | null
              const practiceDays = (team.practice_days as string[] | null) ?? []
              const description = team.description as string | null
              const coach = team.coach as { name: string; avatar_url: string | null } | null

              return (
                <Link key={team.id as string} href={`/teams/${team.id}`} className="block">
                  <div className="overflow-hidden rounded-2xl border border-[#dce3ea] bg-white shadow-sm transition-all hover:border-[#005F8C] hover:shadow-md">
                    <div className="flex items-stretch">
                      {/* グリーンカラーバー */}
                      <div className="w-1 shrink-0" style={{ backgroundColor: "#0f8a4f" }} />

                      {/* カードコンテンツ */}
                      <div className="flex-1 grid grid-cols-[48px_1fr_14px] items-start gap-x-3 px-3.5 py-3">
                        {/* アバター（col 1） */}
                        <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-full">
                          {(team.avatar_url as string | null) ? (
                            <Image
                              src={team.avatar_url as string}
                              alt={team.name as string}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
                              style={{ background: "linear-gradient(135deg, #0f8a4f 0%, #076938 100%)" }}
                            >
                              {(team.name as string)?.[0] || "T"}
                            </div>
                          )}
                        </div>

                        {/* チーム情報（col 2 = 1fr） */}
                        <div className="min-w-0 overflow-hidden space-y-1">
                          {/* 行1: チーム名 + エリアバッジ */}
                          <div className="flex items-center gap-1.5">
                            <p className="min-w-0 truncate text-sm font-semibold text-[#1a2332]">
                              {team.name as string}
                            </p>
                            {area && (
                              <span
                                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ backgroundColor: "rgba(15,138,79,0.09)", color: "#0f8a4f" }}
                              >
                                {area}
                              </span>
                            )}
                          </div>

                          {/* 行2: 管理者 */}
                          {coach && (
                            <div className="flex items-center gap-1.5">
                              <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
                                {coach.avatar_url ? (
                                  <Image
                                    src={coach.avatar_url}
                                    alt={coach.name}
                                    fill
                                    className="object-cover"
                                    sizes="16px"
                                  />
                                ) : (
                                  <div
                                    className="flex h-full w-full items-center justify-center text-[7px] font-bold text-white"
                                    style={{ background: "linear-gradient(135deg, #0f8a4f 0%, #076938 100%)" }}
                                  >
                                    {coach.name?.[0] || "?"}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-[#64748b]">{coach.name}</span>
                            </div>
                          )}

                          {/* 行3: 頻度 + 曜日 */}
                          {(frequency || practiceDays.length > 0) && (
                            <div className="flex items-center gap-1.5 overflow-hidden text-xs text-[#475569]">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {frequency && (
                                <span className="shrink-0 truncate">{frequency}</span>
                              )}
                              {practiceDays.length > 0 && (
                                <div className="flex shrink-0 gap-0.5">
                                  {practiceDays.map((d) => (
                                    <span
                                      key={d}
                                      className="flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold"
                                      style={{ backgroundColor: "rgba(15,138,79,0.1)", color: "#0f8a4f" }}
                                    >
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 行4: メインプール */}
                          {pool && (
                            <div className="flex items-center gap-1 overflow-hidden text-xs text-[#475569]">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span className="truncate">{pool}</span>
                            </div>
                          )}

                          {/* 行5: 説明文 */}
                          <p className={`line-clamp-2 text-xs ${description ? "text-[#475569]" : "text-[#64748b]"}`}>
                            {description ?? "説明はありません"}
                          </p>
                        </div>

                        {/* 逆くの字（col 3 = 14px） */}
                        <div className="flex self-stretch items-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
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
    </div>
  )
}
