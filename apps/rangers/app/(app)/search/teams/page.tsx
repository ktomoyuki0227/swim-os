export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPublicTeams } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
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
        placeholder="グループ名で検索..."
        actionPath="/search/teams"
      />

      {/* 結果 */}
      {!teams || teams.length === 0 ? (
        <Card className="rounded-[14px] border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(15,138,79,0.08)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#1a2332]">チームが見つかりません</p>
            <p className="mt-1 text-sm text-[#5c6a7a]">条件を変更して再検索してみてください</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#5c6a7a]">{teams.length}件のチーム</p>
          {teams.map((team: Record<string, unknown>) => (
            <Link key={team.id as string} href={`/teams/${team.id}`}>
              <Card className="border-[#dce3ea] py-0 transition-all hover:border-[#0f8a4f]">
                <CardContent className="flex items-center gap-4 px-4 py-3">
                  {/* アバター */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[14px] bg-[#0f8a4f]/10">
                    {team.avatar_url ? (
                      <Image
                        src={team.avatar_url as string}
                        alt={team.name as string}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#0f8a4f]">
                        {(team.name as string)?.[0] || "T"}
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
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
      )}
    </div>
  )
}
