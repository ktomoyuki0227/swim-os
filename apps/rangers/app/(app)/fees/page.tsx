export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getMyTeams } from "@/actions/teams"
import { getTeamFees } from "@/actions/fees"
import { getStampMembers } from "@/actions/stamps"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FeeActions } from "./fee-actions"
import { FeeFilters } from "./fee-filters"
import { StampSection } from "./stamp-section"
import { SubscriptionSection } from "./subscription-section"

interface FeesPageProps {
  searchParams: Promise<{ team?: string; type?: string; period?: string }>
}

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const { data: teams } = await getMyTeams()
  const adminTeams = ((teams || []) as Record<string, unknown>[]).filter((t) => t.my_role === "admin")
  const adminTeamIds = new Set(adminTeams.map((t) => t.id as string))

  const selectedTeamId =
    (params.team && adminTeamIds.has(params.team) ? params.team : (adminTeams[0]?.id as string)) || ""
  const selectedType = (params.type as "annual" | "monthly" | "stamp_card") || "annual"
  const now = new Date()
  const defaultPeriod =
    selectedType === "annual"
      ? now.getFullYear().toString()
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const selectedPeriod = params.period || defaultPeriod

  // 選択中グループの料金体系フラグを取得
  const admin = createAdminClient()
  const teamFeeFlags = { has_annual_fee: false, has_monthly_fee: false, has_point_card: false }
  if (selectedTeamId) {
    const { data: flagData } = await admin
      .from("teams")
      .select("has_annual_fee, has_monthly_fee, has_point_card")
      .eq("id", selectedTeamId)
      .single()
    if (flagData) {
      teamFeeFlags.has_annual_fee = flagData.has_annual_fee ?? false
      teamFeeFlags.has_monthly_fee = flagData.has_monthly_fee ?? false
      teamFeeFlags.has_point_card = flagData.has_point_card ?? false
    }
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
      redirect(`/fees?team=${selectedTeamId}&type=${firstValidType}${periodParam}`)
    }
  }

  // 回数券タブ
  if (selectedType === "stamp_card") {
    const { data: teamInfo } = await admin
      .from("teams")
      .select("point_card_count, point_card_price")
      .eq("id", selectedTeamId)
      .single()

    const { data: stampMembers } = await getStampMembers(selectedTeamId)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#1a2332]">会費管理</h1>
        </div>

        {adminTeams.length === 0 ? (
          <Card className="border-[#dce3ea]">
            <CardContent className="py-10 text-center text-sm text-[#475569]">
              グループを作成してください
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-[#dce3ea]">
              <FeeFilters
                teams={adminTeams.map((t) => ({ id: t.id as string, name: t.name as string }))}
                selectedTeamId={selectedTeamId}
                selectedType={selectedType}
                selectedPeriod={selectedPeriod}
                teamFeeFlags={teamFeeFlags}
              />
            </Card>

            {!teamFeeFlags.has_point_card ? (
              <NoFeeTypeMessage teamId={selectedTeamId} />
            ) : (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-[#1a2332]">
                  回数券会員 ({(stampMembers || []).length}名)
                </h2>
                <StampSection
                  teamId={selectedTeamId}
                  pointCardCount={teamInfo?.point_card_count ?? 10}
                  members={stampMembers || []}
                />
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // 月謝タブ: Stripe Subscription 管理用のメンバー一覧を取得
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY
  type MonthlyMember = {
    swimmer_id: string
    stripe_subscription_id: string | null
    subscription_status: string | null
    swimmer: { name: string | null } | null
  }
  let monthlyMembers: MonthlyMember[] = []
  if (selectedTeamId && selectedType === "monthly" && teamFeeFlags.has_monthly_fee && stripeEnabled) {
    const { data: members } = await admin
      .from("team_members")
      .select("swimmer_id, stripe_subscription_id, subscription_status, swimmer:profiles(name)")
      .eq("team_id", selectedTeamId)
      .eq("status", "active")
      .eq("membership_type", "monthly")
    // Supabase joins return the related row as an array; normalize to single object
    monthlyMembers = (members || []).map((m) => ({
      swimmer_id: m.swimmer_id,
      stripe_subscription_id: m.stripe_subscription_id ?? null,
      subscription_status: m.subscription_status ?? null,
      swimmer: Array.isArray(m.swimmer) ? (m.swimmer[0] ?? null) : (m.swimmer ?? null),
    }))
  }

  // 年会費・月謝タブ
  let fees: Record<string, unknown>[] = []
  if (selectedTeamId && hasAnyFeeType) {
    const result = await getTeamFees(selectedTeamId, selectedType, selectedPeriod)
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
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#1a2332]">会費管理</h1>
      </div>

      {adminTeams.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="py-10 text-center text-sm text-[#475569]">
            グループを作成してください
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="border-[#dce3ea]">
            <FeeFilters
              teams={adminTeams.map((t) => ({ id: t.id as string, name: t.name as string }))}
              selectedTeamId={selectedTeamId}
              selectedType={selectedType}
              selectedPeriod={selectedPeriod}
              teamFeeFlags={teamFeeFlags}
            />
          </Card>

          {!hasAnyFeeType ? (
            <NoFeeTypeMessage teamId={selectedTeamId} />
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

              {/* Stripe Subscription 管理（月謝タブ・Stripe 設定済み時のみ） */}
              {selectedType === "monthly" && stripeEnabled && (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-[#1a2332]">
                    Stripe Subscription 管理
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    月謝会員ごとに自動引き落とし（Subscription）を開始・停止できます。
                  </p>
                  <SubscriptionSection teamId={selectedTeamId} members={monthlyMembers} />
                </div>
              )}

              {/* Fee list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#1a2332]">
                    会員一覧 ({fees.length}名)
                  </h2>
                  {selectedTeamId && (
                    <FeeActions
                      teamId={selectedTeamId}
                      type={selectedType}
                      period={selectedPeriod}
                      hasFees={fees.length > 0}
                    />
                  )}
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
                  <div className="space-y-2">
                    {fees.map((fee) => {
                      const swimmer = fee.swimmer as Record<string, unknown> | null
                      const isPaid = fee.status === "paid"
                      const isNoRecord = fee.status === "no_record"
                      return (
                        <Card key={fee.id as string} className="border-[#dce3ea]">
                          <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-sm font-semibold text-[#005F8C]">
                              {(swimmer?.name as string)?.[0] || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[#1a2332]">
                                {(swimmer?.name as string) || "不明"}
                              </p>
                              <p className="text-xs text-[#475569]">
                                {isNoRecord
                                  ? "会費レコード未作成"
                                  : `¥${(fee.amount as number)?.toLocaleString()}${fee.paid_at ? ` · ${new Date(fee.paid_at as string).toLocaleDateString("ja-JP")}支払済` : ""}`
                                }
                              </p>
                            </div>
                            <Badge
                              className={
                                isPaid
                                  ? "bg-[#eaf7f0] text-[#0f8a4f] border-transparent"
                                  : isNoRecord
                                    ? "bg-[#edf0f4] text-[#475569] border-transparent"
                                    : "bg-[#fdf6e3] text-[#b8860b] border-transparent"
                              }
                            >
                              {isPaid ? "支払済" : isNoRecord ? "未登録" : "未払い"}
                            </Badge>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
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
