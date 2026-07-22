export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPublicTeams } from "@/actions/teams"
import { PersonalSearchInput } from "./personal-search-input"

interface PersonalPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function PersonalPage({ searchParams }: PersonalPageProps) {
  const params = await searchParams
  const q = params.q || ""

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: coaches } = await getPublicTeams({
    q: q || undefined,
    excludeUserId: user?.id,
    teamType: "personal",
  })

  return (
    <div className="space-y-0">
      {/* 検索行（sticky） */}
      <div className="sticky top-0 z-10 -mx-4 overflow-hidden rounded-b-2xl bg-white/95 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          <Link
            href="/search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2f7fa] text-[#475569] hover:bg-[#e0edf5]"
            aria-label="探すに戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <PersonalSearchInput defaultValue={q} />
        </div>
      </div>

      {/* 結果 */}
      <div className="mt-3">
        {!coaches || coaches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#dce3ea] bg-white px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(123,94,167,0.08)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="font-semibold text-[#1a2332]">コーチが見つかりません</p>
            <p className="mt-1 text-sm text-[#475569]">条件を変更して再検索してみてください</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[#64748b]">{coaches.length}人のコーチ</p>
            {coaches.map((coach: Record<string, unknown>) => {
              const coachProfile = coach.coach as { name: string; avatar_url: string | null } | null
              const area = coach.activity_area as string | null
              const guestPrice = coach.default_guest_price as number | null
              const frequency = coach.practice_frequency as string | null
              const practiceDays = (coach.practice_days as string[] | null) ?? []
              const description = coach.description as string | null

              return (
                <Link key={coach.id as string} href={`/teams/${coach.id}`} className="block">
                  <div className="overflow-hidden rounded-2xl border border-[#dce3ea] bg-white shadow-sm transition-all hover:border-[#c8d8e8] hover:shadow-md">
                    <div className="flex items-stretch">
                      {/* パープルカラーバー */}
                      <div className="w-1 shrink-0" style={{ backgroundColor: "#7B5EA7" }} />

                      {/* カードコンテンツ */}
                      <div className="flex-1 grid grid-cols-[48px_1fr_14px] items-start gap-x-3 px-3.5 py-3">
                        {/* アバター（col 1）- 円形 */}
                        <div className="relative mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-full">
                          {(coach.avatar_url as string | null) ? (
                            <Image
                              src={coach.avatar_url as string}
                              alt={coach.name as string}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
                              style={{ background: "linear-gradient(135deg, #7B5EA7 0%, #5438A0 100%)" }}
                            >
                              {(coach.name as string)?.[0] || "C"}
                            </div>
                          )}
                        </div>

                        {/* コーチ情報（col 2 = 1fr） */}
                        <div className="min-w-0 overflow-hidden space-y-1">
                          {/* 行1: グループ名 + エリアバッジ */}
                          <div className="flex items-center gap-1.5">
                            <p className="min-w-0 truncate text-sm font-semibold text-[#1a2332]">
                              {coach.name as string}
                            </p>
                            {area && (
                              <span
                                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ backgroundColor: "rgba(123,94,167,0.09)", color: "#7B5EA7" }}
                              >
                                {area}
                              </span>
                            )}
                          </div>

                          {/* 行2: コーチ氏名 */}
                          {coachProfile && (
                            <div className="flex items-center gap-1.5">
                              <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full">
                                {coachProfile.avatar_url ? (
                                  <Image
                                    src={coachProfile.avatar_url}
                                    alt={coachProfile.name}
                                    fill
                                    className="object-cover"
                                    sizes="16px"
                                  />
                                ) : (
                                  <div
                                    className="flex h-full w-full items-center justify-center text-[7px] font-bold text-white"
                                    style={{ background: "linear-gradient(135deg, #7B5EA7 0%, #5438A0 100%)" }}
                                  >
                                    {coachProfile.name?.[0] || "?"}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-[#64748b]">{coachProfile.name}</span>
                            </div>
                          )}

                          {/* 行3: 頻度 + 曜日 */}
                          {(frequency || practiceDays.length > 0) && (
                            <div className="flex items-center gap-1.5 overflow-hidden text-sm text-[#475569]">
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
                                      style={{ backgroundColor: "rgba(123,94,167,0.1)", color: "#7B5EA7" }}
                                    >
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 行4: 料金 */}
                          {guestPrice != null && (
                            <div className="flex items-center gap-1 text-sm text-[#475569]">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                              <span>¥{guestPrice.toLocaleString()}〜 / セッション</span>
                            </div>
                          )}

                          {/* 行5: 説明文 */}
                          <p className={`line-clamp-2 text-sm ${description ? "text-[#475569]" : "text-[#c8d8e8]"}`}>
                            {description ?? "説明はありません"}
                          </p>
                        </div>

                        {/* 逆くの字（col 3 = 14px） */}
                        <div className="flex self-stretch items-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="2.5">
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
