export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getMyTeams } from "@/actions/teams"
import { getTeamFees } from "@/actions/fees"
import { getStampMembers } from "@/actions/stamps"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FeeActions } from "./fee-actions"
import { FeeFilters } from "./fee-filters"
import { StampSection } from "./stamp-section"

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

  const selectedTeamId = params.team || (adminTeams[0]?.id as string) || ""
  const selectedType = (params.type as "annual" | "monthly" | "stamp_card") || "annual"
  const now = new Date()
  const defaultPeriod =
    selectedType === "annual"
      ? now.getFullYear().toString()
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const selectedPeriod = params.period || defaultPeriod

  // 回数券タブ
  if (selectedType === "stamp_card") {
    const admin = createAdminClient()
    const { data: teamInfo } = await admin
      .from("teams")
      .select("point_card_count, point_card_price")
      .eq("id", selectedTeamId)
      .single()

    const { data: stampMembers } = await getStampMembers(selectedTeamId)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1a2332]">会費管理</h1>
        </div>

        {adminTeams.length === 0 ? (
          <Card className="border-[#dce3ea]">
            <CardContent className="py-10 text-center text-sm text-[#5c6a7a]">
              チームを作成してください
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
              />
            </Card>

            <div className="space-y-3">
              <h2 className="text-base font-semibold text-[#1a2332]">
                回数券会員 ({(stampMembers || []).length}名)
              </h2>
              <StampSection
                pointCardCount={teamInfo?.point_card_count ?? 10}
                members={stampMembers || []}
              />
            </div>
          </>
        )}
      </div>
    )
  }

  // 年会費・月謝タブ
  let fees: Record<string, unknown>[] = []
  if (selectedTeamId) {
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
        <h1 className="text-2xl font-bold text-[#1a2332]">会費管理</h1>
      </div>

      {adminTeams.length === 0 ? (
        <Card className="border-[#dce3ea]">
          <CardContent className="py-10 text-center text-sm text-[#5c6a7a]">
            チームを作成してください
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
            />
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-[#dce3ea]">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#0f8a4f]">{paidCount}</p>
                <p className="text-xs text-[#5c6a7a]">支払済み</p>
              </CardContent>
            </Card>
            <Card className="border-[#dce3ea]">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[#b8860b]">{unpaidCount}</p>
                <p className="text-xs text-[#5c6a7a]">未払い</p>
              </CardContent>
            </Card>
            <Card className="border-[#dce3ea]">
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold text-[#005F8C]">
                  ¥{paidAmount.toLocaleString()}
                </p>
                <p className="text-xs text-[#5c6a7a]">
                  / ¥{totalAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

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
                  <p className="text-sm text-[#5c6a7a]">会費データがありません</p>
                  <p className="mt-1 text-xs text-[#8d99a8]">
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
                          <p className="text-xs text-[#5c6a7a]">
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
                                ? "bg-[#edf0f4] text-[#5c6a7a] border-transparent"
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
    </div>
  )
}
