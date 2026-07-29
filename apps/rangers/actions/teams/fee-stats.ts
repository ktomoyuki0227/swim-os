"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"

export async function getTeamFeeStats(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  // RLS バイパスが必要なため adminClient で admin チェック
  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }
  const currentYear = new Date().getFullYear().toString()

  // 全アクティブメンバーを取得（管理者は会費不要のため除外）
  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, membership_type, role")
    .eq("team_id", teamId)
    .eq("status", "active")
    .neq("role", "admin")

  if (!members || members.length === 0) {
    return { data: { paid: 0, subscriptionUnpaid: 0, stampUnpaid: 0, total: 0, unpaidSwimmerIds: [] as string[] } }
  }

  const total = members.length
  const annualIds = members.filter((m) => m.membership_type === "annual").map((m) => m.swimmer_id)
  const monthlyIds = members.filter((m) => m.membership_type === "monthly").map((m) => m.swimmer_id)
  const pointCardIds = members.filter((m) => m.membership_type === "point_card").map((m) => m.swimmer_id)

  // 年会費メンバー: 今年の年会費ステータスを確認
  let annualUnpaidIds: string[] = []
  if (annualIds.length > 0) {
    const { data: fees } = await admin
      .from("membership_fees")
      .select("swimmer_id, status")
      .eq("team_id", teamId)
      .eq("type", "annual")
      .eq("period", currentYear)
      .in("swimmer_id", annualIds)

    const feeMap = new Map((fees || []).map((f) => [f.swimmer_id, f.status]))
    annualUnpaidIds = annualIds.filter((id) => feeMap.get(id) !== "paid")
  }
  const annualUnpaid = annualUnpaidIds.length
  const annualPaid = annualIds.length - annualUnpaid

  // 月謝メンバー: 今月の月謝ステータスを確認
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  let monthlyUnpaidIds: string[] = []
  if (monthlyIds.length > 0) {
    const { data: fees } = await admin
      .from("membership_fees")
      .select("swimmer_id, status")
      .eq("team_id", teamId)
      .eq("type", "monthly")
      .eq("period", currentMonth)
      .in("swimmer_id", monthlyIds)

    const feeMap = new Map((fees || []).map((f) => [f.swimmer_id, f.status]))
    monthlyUnpaidIds = monthlyIds.filter((id) => feeMap.get(id) !== "paid")
  }
  const monthlyUnpaid = monthlyUnpaidIds.length
  const monthlyPaid = monthlyIds.length - monthlyUnpaid

  const subscriptionPaid = annualPaid + monthlyPaid
  const subscriptionUnpaid = annualUnpaid + monthlyUnpaid

  // 回数券メンバー（point_card）: 未払い・失敗の購入記録があるか確認
  let stampUnpaidIds: string[] = []
  if (pointCardIds.length > 0) {
    const { data: unpaidStamps } = await admin
      .from("stamp_purchases")
      .select("swimmer_id")
      .eq("team_id", teamId)
      .in("status", ["unpaid", "failed"])
      .in("swimmer_id", pointCardIds)

    stampUnpaidIds = Array.from(new Set((unpaidStamps || []).map((s) => s.swimmer_id)))
  }
  const stampUnpaid = stampUnpaidIds.length
  const stampPaid = pointCardIds.length - stampUnpaid

  const paid = subscriptionPaid + stampPaid
  const unpaidSwimmerIds = [...annualUnpaidIds, ...monthlyUnpaidIds, ...stampUnpaidIds]

  return { data: { paid, subscriptionUnpaid, stampUnpaid, total, unpaidSwimmerIds } }
}
