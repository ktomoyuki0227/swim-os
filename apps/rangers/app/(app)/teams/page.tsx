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
    const dest = team.my_role === "admin"
      ? `/instructor/teams/${team.id as string}`
      : `/teams/${team.id as string}`
    redirect(dest)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a2332]">チーム</h1>
        <Link
          href="/teams/new"
          className="rounded-full bg-[#005F8C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
        >
          チームを作る
        </Link>
      </div>

      {!teams || teams.length === 0 ? (
        <div className="space-y-4">
          <Card className="border-[#dce3ea]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#005F8C]/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="font-medium text-[#1a2332]">まだチームに参加していません</p>
              <p className="mt-1 text-sm text-[#5c6a7a]">招待リンクからチームに参加するか、チームを作成してください</p>
              <Link
                href="/teams/new"
                className="mt-4 rounded-full bg-[#005F8C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
              >
                チームを作る
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
                href={isAdmin ? `/instructor/teams/${team.id}` : `/teams/${team.id}`}
              >
                <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#005F8C]/10 text-lg font-bold text-[#005F8C]">
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
                          <Badge className="bg-[#e8f2f8] text-[#005F8C] border-transparent text-[10px] px-1.5">
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
