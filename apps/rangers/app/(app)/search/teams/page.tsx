export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPublicTeams } from "@/actions/teams"
import { SubpageSearchForm } from "../subpage-search-form"

interface TeamsPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams
  const q = params.q || ""

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: teams } = await getPublicTeams({
    q: q || undefined,
    excludeUserId: user?.id,
    teamType: "team",
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
        <h1 className="text-lg font-semibold text-[#1a2332]">チーム</h1>
      </div>

      {/* 検索バー */}
      <SubpageSearchForm
        defaultValue={q}
        placeholder="チーム名で検索..."
        actionPath="/search/teams"
      />

      {/* 結果 */}
      {!teams || teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#dce3ea] bg-white px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(15,138,79,0.08)]">
            <Users className="h-6 w-6 text-[#8d99a8]" />
          </div>
          <p className="font-semibold text-[#1a2332]">チームが見つかりません</p>
          <p className="mt-1 text-sm text-[#5c6a7a]">条件を変更して再検索してみてください</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#8d99a8]">{teams.length}件のチーム</p>
          {teams.map((team: Record<string, unknown>) => (
            <Link key={team.id as string} href={`/teams/${team.id}`} className="block">
              <div className="overflow-hidden rounded-2xl border border-[#dce3ea] bg-white shadow-sm transition-all hover:border-[#a8d5be] hover:shadow-md">
                <div className="flex items-center gap-4 p-4">
                  {/* アバター（大型・グラデーション背景） */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[16px]">
                    {(team.avatar_url as string | null) ? (
                      <Image
                        src={team.avatar_url as string}
                        alt={team.name as string}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #0f8a4f 0%, #076938 100%)" }}
                      >
                        {(team.name as string)?.[0] || "T"}
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1a2332]">{team.name as string}</p>
                    </div>
                    {(team.description as string | null) ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5c6a7a]">
                        {team.description as string}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-[#c8d8e8]">説明はありません</p>
                    )}
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: "rgba(15,138,79,0.1)", color: "#0f8a4f" }}
                      >
                        チーム
                      </span>
                      <span className="text-xs text-[#0f8a4f]">→ 詳細を見る</span>
                    </div>
                  </div>

                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="2.5" className="shrink-0">
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
