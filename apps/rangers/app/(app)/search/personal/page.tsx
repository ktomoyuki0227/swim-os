export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPublicTeams } from "@/actions/teams"
import { SubpageSearchForm } from "../subpage-search-form"

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
        <h1 className="text-lg font-semibold text-[#1a2332]">パーソナル</h1>
      </div>

      {/* 検索バー */}
      <SubpageSearchForm
        defaultValue={q}
        placeholder="コーチ名で検索..."
        actionPath="/search/personal"
      />

      {/* 結果 */}
      {!coaches || coaches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#dce3ea] bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(123,94,167,0.08)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="font-semibold text-[#1a2332]">コーチが見つかりません</p>
          <p className="mt-1 text-sm text-[#5c6a7a]">条件を変更して再検索してみてください</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#8d99a8]">{coaches.length}人のコーチ</p>

          {coaches.map((coach: Record<string, unknown>) => (
            <Link key={coach.id as string} href={`/teams/${coach.id}`} className="block">
              <div className="overflow-hidden rounded-2xl border border-[#dce3ea] bg-white shadow-sm transition-all hover:border-[#c5b3e0] hover:shadow-md">
                <div className="flex items-start gap-4 p-4">
                  {/* 円形アバター（大型・グラデーション背景） */}
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full">
                    {(coach.avatar_url as string | null) ? (
                      <Image
                        src={coach.avatar_url as string}
                        alt={coach.name as string}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #7B5EA7 0%, #5438A0 100%)" }}
                      >
                        {(coach.name as string)?.[0] || "C"}
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#1a2332]">{coach.name as string}</p>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: "rgba(123,94,167,0.1)", color: "#7B5EA7" }}
                      >
                        パーソナル
                      </span>
                    </div>

                    {(coach.description as string | null) ? (
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#5c6a7a]">
                        {coach.description as string}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-[#c8d8e8]">プロフィールは未設定です</p>
                    )}

                    <div className="mt-3 flex items-center gap-1">
                      <span className="text-xs font-semibold text-[#7B5EA7]">プロフィールを見る</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7B5EA7" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="2.5" className="mt-1 shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
