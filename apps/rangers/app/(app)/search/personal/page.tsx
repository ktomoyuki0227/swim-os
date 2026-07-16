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
        <div className="rounded-[14px] border border-[#dce3ea] bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(123,94,167,0.08)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <p className="text-base font-semibold text-[#1a2332]">コーチが見つかりません</p>
          <p className="mt-1 text-sm text-[#5c6a7a]">条件を変更して再検索してみてください</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[#5c6a7a]">{coaches.length}人のコーチ</p>

          {coaches.map((coach: Record<string, unknown>) => (
            <Link key={coach.id as string} href={`/teams/${coach.id}`}>
              <div className="flex items-center gap-4 rounded-[14px] border border-[#dce3ea] bg-white px-4 py-4 transition-all hover:border-[#7B5EA7]">
                {/* アバター（円形・大きめ） */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#7B5EA7]/10">
                  {coach.avatar_url ? (
                    <Image
                      src={coach.avatar_url as string}
                      alt={coach.name as string}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#7B5EA7]">
                      {(coach.name as string)?.[0] || "C"}
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1a2332]">{coach.name as string}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#f0ebf8", color: "#7B5EA7" }}>
                      パーソナル
                    </span>
                  </div>
                  {(coach.description as string | null) && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-[#5c6a7a]">
                      {coach.description as string}
                    </p>
                  )}
                </div>

                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="2" className="shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
