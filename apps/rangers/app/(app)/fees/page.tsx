export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTeam, getTeamMembers } from "@/actions/teams"
import { BackLink } from "@/components/back-link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FeesManager } from "./fees-manager"
import type { TeamMemberWithProfile } from "@/types/database"

interface FeesPageProps {
  searchParams: Promise<{ team?: string }>
}

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  // このページはチーム詳細ページの「メンバー/会費」から遷移してくる前提のため、
  // team は必須。直打ちで欠けている場合はグループ一覧へ戻す
  const teamId = params.team
  if (!teamId) redirect("/teams")

  // 管理者権限チェック（team_members は RLS バイパスが必要）
  const admin = createAdminClient()
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (membership?.role !== "admin") notFound()

  const teamResult = await getTeam(teamId)
  if (teamResult.error || !teamResult.data) notFound()
  const team = teamResult.data

  const hasAnyFeeType = !!(team.has_annual_fee || team.has_monthly_fee || team.has_point_card)

  const membersResult = await getTeamMembers(teamId)
  const members = (membersResult.data || []) as unknown as TeamMemberWithProfile[]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BackLink
          href={`/teams/${teamId}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dce3ea] bg-white transition-colors hover:bg-[#f2f7fa]"
          aria-label="戻る"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </BackLink>
        <div>
          <h1 className="text-lg font-semibold text-[#1a2332]">メンバー / 会費</h1>
          <p className="text-xs text-[#64748b]">{team.name}</p>
        </div>
      </div>

      {!hasAnyFeeType ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <p className="text-sm font-medium text-[#1a2332]">料金体系が設定されていません</p>
            <p className="mt-1 text-xs text-[#64748b]">
              年会費・月謝・回数券のいずれかを有効にするとここで管理できます
            </p>
            <Link href={`/teams/${teamId}/edit`} className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-[#dce3ea] text-[#005F8C]"
                style={{ minHeight: "44px" }}
              >
                グループを編集
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <FeesManager
          teamId={teamId}
          currentUserId={user.id}
          members={members}
          hasAnnualFee={team.has_annual_fee ?? false}
          hasMonthlyFee={team.has_monthly_fee ?? false}
          hasPointCard={team.has_point_card ?? false}
          pointCardCount={team.point_card_count ?? 10}
        />
      )}
    </div>
  )
}
