export const dynamic = "force-dynamic"

import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { getMyTeams } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"

export default async function TeamsPage() {
  const { data: teams } = await getMyTeams()

  if (teams && teams.length === 1) {
    const team = teams[0] as Record<string, unknown>
    redirect(`/teams/${team.id as string}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold leading-[1.4] text-[#1a2332]">グループ</h1>
        <Link
          href="/teams/new"
          className="inline-flex items-center rounded-full bg-[#005F8C] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
          style={{ minHeight: 40 }}
        >
          ＋ 新規作成
        </Link>
      </div>

      {!teams || teams.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#1a2332]">まだグループに参加していません</p>
            <p className="mt-1 text-sm text-[#5c6a7a]">招待リンクからグループに参加するか、グループを作成してください</p>
            <Link
              href="/teams/new"
              className="mt-4 inline-flex items-center rounded-full bg-[#005F8C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
              style={{ minHeight: 44 }}
            >
              グループを作る
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {teams.map((team: Record<string, unknown>) => {
            const isAdmin = team.my_role === "admin"
            const avatarUrl = team.avatar_url as string | null
            const teamName = team.name as string
            return (
              <Link
                key={team.id as string}
                href={`/teams/${team.id}`}
                className="block"
              >
                <div className="overflow-hidden rounded-[14px] border border-[#dce3ea] bg-white transition-all hover:border-[#005F8C] hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  {/* 画像 + ロールバッジ */}
                  <div className="relative aspect-square w-full overflow-hidden bg-[#005F8C]">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={teamName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 300px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                        {teamName?.[0] || "T"}
                      </div>
                    )}
                    <span
                      className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
                      style={{ backgroundColor: "rgba(255,255,255,0.85)", color: isAdmin ? "#005F8C" : "#5c6a7a" }}
                    >
                      {isAdmin ? "管理者" : "メンバー"}
                    </span>
                  </div>
                  {/* テキスト */}
                  <div className="px-3 py-2.5">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#1a2332]">
                      {teamName}
                    </p>
                    {team.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-[#5c6a7a]">
                        {team.description as string}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
