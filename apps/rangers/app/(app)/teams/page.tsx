export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { getMyTeams } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function TeamsPage() {
  const { data: teams } = await getMyTeams()

  if (teams && teams.length === 1) {
    const team = teams[0] as Record<string, unknown>
    redirect(`/teams/${team.id as string}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between min-h-[32px] mb-3">
        <h1 className="text-lg font-semibold text-[#1a2332]">グループ</h1>
        <Link
          href="/teams/new"
          className="inline-flex items-center rounded-full bg-[#005F8C] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#004E73] min-h-[48px]"
        >
          グループを作る
        </Link>
      </div>

      {!teams || teams.length === 0 ? (
        <div className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="flex flex-col items-center justify-center px-6 py-12">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#005F8C]/[0.08]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="font-semibold text-[#1a2332]">まだグループに参加していません</p>
              <p className="mt-1 text-sm text-[#5c6a7a]">招待リンクからグループに参加するか、グループを作成してください</p>
              <Link
                href="/teams/new"
                className="mt-4 inline-flex items-center rounded-full bg-[#005F8C] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#004E73] min-h-[48px]"
              >
                グループを作る
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map((team: Record<string, unknown>) => {
            const isAdmin = team.my_role === "admin"
            return (
              <Link
                key={team.id as string}
                href={`/teams/${team.id}`}
              >
                <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#005F8C]/10 text-lg font-bold text-[#005F8C]">
                      {(team.avatar_url as string | null) ? (
                        <img src={team.avatar_url as string} alt={team.name as string} className="h-full w-full object-cover" />
                      ) : (
                        (team.name as string)?.[0] || "T"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#1a2332]">{team.name as string}</p>
                        {isAdmin && (
                          <Badge className="bg-[#e8f2f8] text-[#005F8C] border-transparent text-xs font-semibold px-3 py-1 rounded-full">
                            管理者
                          </Badge>
                        )}
                      </div>
                      {team.description ? (
                        <p className="truncate text-sm text-[#5c6a7a]">{team.description as string}</p>
                      ) : null}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d99a8" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
