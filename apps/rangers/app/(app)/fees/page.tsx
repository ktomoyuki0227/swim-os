export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getTeam, getTeamMembers, getTeamFeeStats } from "@/actions/teams"
import { getTeamFees } from "@/actions/fees"
import { getStampMembers } from "@/actions/stamps"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackLink } from "@/components/back-link"
import { FeeActions } from "./fee-actions"
import { FeeFilters } from "./fee-filters"
import { FeeList } from "./fee-list"
import { MemberList } from "@/app/(app)/teams/[id]/member-list"
import { MonthlyFeeMatrix } from "./monthly-matrix"
import { StampSection } from "./stamp-section"
import { SubscriptionSection } from "./subscription-section"
import type { SubscriptionStatus, TeamMemberWithProfile } from "@/types/database"

interface FeesPageProps {
  searchParams: Promise<{ team?: string; type?: string; period?: string }>
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

  const selectedType = (params.type as "annual" | "monthly" | "stamp_card") || "annual"
  const now = new Date()
  const defaultPeriod =
    selectedType === "annual"
      ? now.getFullYear().toString()
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const selectedPeriod = params.period || defaultPeriod

  const teamFeeFlags = {
    has_annual_fee: team.has_annual_fee ?? false,
    has_monthly_fee: team.has_monthly_fee ?? false,
    has_point_card: team.has_point_card ?? false,
  }
  const hasAnyFeeType =
    teamFeeFlags.has_annual_fee || teamFeeFlags.has_monthly_fee || teamFeeFlags.has_point_card

  // URL直打ちで無効なタブが指定された場合、有効な最初のタブにリダイレクト
  if (hasAnyFeeType) {
    const isCurrentTypeEnabled =
      (selectedType === "annual" && teamFeeFlags.has_annual_fee) ||
      (selectedType === "monthly" && teamFeeFlags.has_monthly_fee) ||
      (selectedType === "stamp_card" && teamFeeFlags.has_point_card)

    if (!isCurrentTypeEnabled) {
      const firstValidType = teamFeeFlags.has_annual_fee
        ? "annual"
        : teamFeeFlags.has_monthly_fee
        ? "monthly"
        : "stamp_card"
      const period =
        firstValidType === "annual"
          ? now.getFullYear().toString()
          : firstValidType === "monthly"
          ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
          : ""
      const periodParam = period ? `&period=${period}` : ""
      redirect(`/fees?team=${teamId}&type=${firstValidType}${periodParam}`)
    }
  }

  // 会員一覧（全メンバー・詳細/編集/削除）: 会費種別タブに関わらず常に表示
  const [membersResult, feeStatsResult] = await Promise.all([
    getTeamMembers(teamId),
    getTeamFeeStats(teamId),
  ])
  const members = membersResult.data || []
  const feeStats = feeStatsResult.data ?? null

  const memberListSection = (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-[#1a2332]">会員一覧</h2>
      <MemberList
        teamId={teamId}
        members={members as unknown as TeamMemberWithProfile[]}
        currentUserId={user.id}
        hasAnnualFee={teamFeeFlags.has_annual_fee}
        hasMonthlyFee={teamFeeFlags.has_monthly_fee}
        hasPointCard={teamFeeFlags.has_point_card}
        pointCardCount={team.point_card_count ?? 0}
        unpaidSwimmerIds={feeStats?.unpaidSwimmerIds ?? []}
      />
    </div>
  )

  const header = (
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
        <h1 className="text-lg font-semibold text-[#1a2332]">会費管理</h1>
        <p className="text-xs text-[#64748b]">{team.name}</p>
      </div>
    </div>
  )

  // 回数券タブ
  if (selectedType === "stamp_card") {
    const { data: stampMembers } = await getStampMembers(teamId)

    return (
      <div className="space-y-6">
        {header}
        {memberListSection}

        <Card className="border-[#dce3ea]">
          <FeeFilters
            selectedTeamId={teamId}
            selectedType={selectedType}
            selectedPeriod={selectedPeriod}
            teamFeeFlags={teamFeeFlags}
          />
        </Card>

        {!teamFeeFlags.has_point_card ? (
          <NoFeeTypeMessage teamId={teamId} />
        ) : (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-[#1a2332]">
              回数券会員 ({(stampMembers || []).length}名)
            </h2>
            <StampSection
              teamId={teamId}
              pointCardCount={team.point_card_count ?? 10}
              members={stampMembers || []}
            />
          </div>
        )}
      </div>
    )
  }

  // 月謝タブ: Stripe Subscription 管理用のメンバー一覧を取得
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY
  type MonthlyMember = {
    swimmer_id: string
    stripe_subscription_id: string | null
    subscription_status: SubscriptionStatus | null
    swimmer: { name: string | null } | null
  }
  let monthlyMembers: MonthlyMember[] = []
  if (selectedType === "monthly" && teamFeeFlags.has_monthly_fee && stripeEnabled) {
    const { data: subscriptionMembers } = await admin
      .from("team_members")
      .select("swimmer_id, stripe_subscription_id, subscription_status, swimmer:profiles(name)")
      .eq("team_id", teamId)
      .eq("status", "active")
      .eq("membership_type", "monthly")
    // Supabase joins return the related row as an array; normalize to single object
    monthlyMembers = (subscriptionMembers || []).map((m) => ({
      swimmer_id: m.swimmer_id,
      stripe_subscription_id: m.stripe_subscription_id ?? null,
      subscription_status: (m.subscription_status ?? null) as SubscriptionStatus | null,
      swimmer: Array.isArray(m.swimmer) ? (m.swimmer[0] ?? null) : (m.swimmer ?? null),
    }))
  }

  // 年会費・月謝タブ
  let fees: Record<string, unknown>[] = []
  if (hasAnyFeeType) {
    const result = await getTeamFees(teamId, selectedType, selectedPeriod)
    fees = (result.data || []) as Record<string, unknown>[]
  }

  const paidCount = fees.filter((f) => f.status === "paid").length
  const unpaidCount = fees.filter((f) => f.status === "unpaid").length
  const totalAmount = fees
    .filter((f) => f.status !== "no_record")
    .reduce((sum, f) => sum + (f.amount as number || 0), 0)
  const paidAmount = fees
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + (f.amount as number || 0), 0)

  return (
    <div className="space-y-6">
      {header}
      {memberListSection}

      <Card className="border-[#dce3ea]">
        <FeeFilters
          selectedTeamId={teamId}
          selectedType={selectedType}
          selectedPeriod={selectedPeriod}
          teamFeeFlags={teamFeeFlags}
        />
      </Card>

      {!hasAnyFeeType ? (
        <NoFeeTypeMessage teamId={teamId} />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-[#dce3ea]">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#0f8a4f]">{paidCount}</p>
                <p className="text-xs text-[#475569]">支払済み</p>
              </CardContent>
            </Card>
            <Card className="border-[#dce3ea]">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#b8860b]">{unpaidCount}</p>
                <p className="text-xs text-[#475569]">未払い</p>
              </CardContent>
            </Card>
            <Card className="border-[#dce3ea]">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold text-[#005F8C]">
                  ¥{paidAmount.toLocaleString()}
                </p>
                <p className="text-xs text-[#475569]">
                  / ¥{totalAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 月次一覧（月謝タブのみ）: 1〜12月の支払い状況をまとめて確認できる年間マトリクス */}
          {selectedType === "monthly" && teamFeeFlags.has_monthly_fee && (
            <MonthlyFeeMatrix teamId={teamId} initialYear={now.getFullYear()} />
          )}

          {/* Stripe Subscription 管理（月謝タブ・Stripe 設定済み時のみ） */}
          {selectedType === "monthly" && stripeEnabled && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-[#1a2332]">
                Stripe Subscription 管理
              </h2>
              <p className="text-xs text-[#64748b]">
                月謝会員ごとに自動引き落とし（Subscription）を開始・停止できます。
              </p>
              <SubscriptionSection teamId={teamId} members={monthlyMembers} />
            </div>
          )}

          {/* Fee list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1a2332]">
                支払い状況一覧 ({fees.length}名)
              </h2>
              <FeeActions
                teamId={teamId}
                type={selectedType}
                period={selectedPeriod}
                hasFees={fees.length > 0}
              />
            </div>

            {fees.length === 0 ? (
              <Card className="border-[#dce3ea]">
                <CardContent className="py-10 text-center">
                  <p className="text-sm text-[#475569]">会費データがありません</p>
                  <p className="mt-1 text-xs text-[#64748b]">
                    「一括生成」ボタンで全メンバー分のレコードを作成できます
                  </p>
                </CardContent>
              </Card>
            ) : (
              <FeeList
                fees={fees.map((fee) => {
                  const swimmer = fee.swimmer as Record<string, unknown> | null
                  return {
                    id: fee.id as string,
                    name: (swimmer?.name as string) || "不明",
                    amount: (fee.amount as number) ?? 0,
                    paidAt: (fee.paid_at as string) ?? null,
                    status: fee.status as "unpaid" | "paid" | "failed" | "no_record",
                  }
                })}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function NoFeeTypeMessage({ teamId }: { teamId: string }) {
  return (
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
  )
}
