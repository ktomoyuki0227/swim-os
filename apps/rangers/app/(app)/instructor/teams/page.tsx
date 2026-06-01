export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { getMyTeams } from "@/actions/teams"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function TeamsPage() {
  const { data: teams } = await getMyTeams()
  const adminTeams = teams.filter((t: Record<string, unknown>) => t.my_role === "admin")

  if (adminTeams.length === 1) {
    redirect(`/instructor/teams/${adminTeams[0].id as string}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a2332]">チーム管理</h1>
        <Link href="/instructor/teams/new">
          <Button className="rounded-full bg-[#005F8C] hover:bg-[#004E73]" style={{ minHeight: "48px" }}>
            チームを作成
          </Button>
        </Link>
      </div>

      {adminTeams.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-[#5c6a7a]">まだチームがありません</p>
            <Link href="/instructor/teams/new" className="mt-4">
              <Button variant="outline" className="rounded-full border-[#005F8C] text-[#005F8C]">
                最初のチームを作成する
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {adminTeams.map((team: Record<string, unknown>) => (
            <Link key={team.id as string} href={`/instructor/teams/${team.id}`}>
              <Card className="border-[#dce3ea] transition-all hover:border-[#005F8C]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-[#1a2332]">
                      {team.name as string}
                    </CardTitle>
                    <Badge
                      className={
                        team.status === "active"
                          ? "bg-[#eaf7f0] text-[#0f8a4f] border-transparent"
                          : "bg-[#edf0f4] text-[#5c6a7a] border-transparent"
                      }
                    >
                      {team.status === "active" ? "アクティブ" : "非アクティブ"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {team.description ? (
                    <p className="text-sm text-[#5c6a7a] line-clamp-2">
                      {team.description as string}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
