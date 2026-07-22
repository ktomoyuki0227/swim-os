export const dynamic = "force-dynamic"

import Link from "next/link"
import { getMyTeams } from "@/actions/teams"
import { Card, CardContent } from "@/components/ui/card"
import { TeamsClient } from "./teams-client"

export default async function TeamsPage() {
  const { data: teams } = await getMyTeams()

  if (!teams || teams.length === 0) {
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
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(0,95,140,0.08)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#1a2332]">まだグループに参加していません</p>
            <p className="mt-1 text-sm text-[#475569]">招待リンクからグループに参加するか、グループを作成してください</p>
            <Link
              href="/teams/new"
              className="mt-4 inline-flex items-center rounded-full bg-[#005F8C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
              style={{ minHeight: 44 }}
            >
              グループを作る
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <TeamsClient teams={teams as Record<string, unknown>[]} />
}
