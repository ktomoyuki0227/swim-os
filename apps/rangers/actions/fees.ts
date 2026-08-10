"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { FeeType } from "@/types/database"
import type { Database } from "@/types/database-generated"
import { isTeamAdmin, isAdminOfAnyTeamWithMember } from "@/lib/auth/require-team-admin"
import { notifyUser } from "@/lib/notifications"

export interface MonthlyFeeCell {
  month: number
  feeId: string | null
  status: "unpaid" | "paid" | "failed" | "no_record"
  amount: number | null
  paidAt: string | null
}

export interface MonthlyFeeMatrixRow {
  swimmerId: string
  name: string
  role: string
  months: MonthlyFeeCell[]
}

/**
 * 月謝会員の年間(1〜12月)支払い状況マトリクスを返す。
 * membership_fees(type='monthly') の既存レコードを集計するのみで、新規テーブルは使わない。
 */
export async function getMonthlyFeeMatrix(teamId: string, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { data: null }

  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, role, profiles(id, name)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "monthly")

  if (!members || members.length === 0) return { data: { year, members: [] } }

  const { data: feeRecords } = await admin
    .from("membership_fees")
    .select("id, swimmer_id, period, status, amount, paid_at")
    .eq("team_id", teamId)
    .eq("type", "monthly")
    .like("period", `${year}-%`)

  const rows: MonthlyFeeMatrixRow[] = members.map((m) => {
    const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as unknown as { id: string; name: string } | null)
    const months: MonthlyFeeCell[] = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const period = `${year}-${String(month).padStart(2, "0")}`
      const fee = (feeRecords || []).find((f) => f.swimmer_id === m.swimmer_id && f.period === period)
      if (!fee) return { month, feeId: null, status: "no_record", amount: null, paidAt: null }
      return {
        month,
        feeId: fee.id,
        status: fee.status as "unpaid" | "paid" | "failed",
        amount: fee.amount,
        paidAt: fee.paid_at,
      }
    })
    return { swimmerId: m.swimmer_id, name: profile?.name || "不明", role: m.role, months }
  })

  return { data: { year, members: rows } }
}

/**
 * 年会費会員の年間(1〜12月)支払い状況マトリクスを返す。
 * 年会費は年1回・単一レコードでの支払いのため、実データは1件だが、月謝と同じ
 * 見た目(1〜12月マス目)で表示するために、同じレコードの状態を12マスすべてに
 * 複製する。どのマスをタップしても同じ feeId が更新され、12マスまとめて切り替わる。
 */
export async function getAnnualFeeMatrix(teamId: string, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { data: null }

  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, role, profiles(id, name)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "annual")

  if (!members || members.length === 0) return { data: { year, members: [] } }

  const { data: feeRecords } = await admin
    .from("membership_fees")
    .select("id, swimmer_id, status, amount, paid_at")
    .eq("team_id", teamId)
    .eq("type", "annual")
    .eq("period", String(year))

  const rows: MonthlyFeeMatrixRow[] = members.map((m) => {
    const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as unknown as { id: string; name: string } | null)
    const fee = (feeRecords || []).find((f) => f.swimmer_id === m.swimmer_id)
    const months: MonthlyFeeCell[] = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      if (!fee) return { month, feeId: null, status: "no_record", amount: null, paidAt: null }
      return {
        month,
        feeId: fee.id,
        status: fee.status as "unpaid" | "paid" | "failed",
        amount: fee.amount,
        paidAt: fee.paid_at,
      }
    })
    return { swimmerId: m.swimmer_id, name: profile?.name || "不明", role: m.role, months }
  })

  return { data: { year, members: rows } }
}

export async function updateFeeStatus(
  feeId: string,
  status: "unpaid" | "paid" | "failed",
  paymentMethod?: "stripe" | "cash"
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: fee } = await admin
    .from("membership_fees")
    .select("team_id, swimmer_id, amount, type, period")
    .eq("id", feeId)
    .single()
  if (!fee) return { error: "会費レコードが見つかりません" }

  if (!(await isTeamAdmin(admin, fee.team_id, user.id))) return { error: "権限がありません" }

  const updateData: Database["public"]["Tables"]["membership_fees"]["Update"] = { status }
  if (status === "paid") {
    updateData.paid_at = new Date().toISOString()
  }
  if (paymentMethod) {
    updateData.payment_method = paymentMethod
  }

  const { error } = await admin
    .from("membership_fees")
    .update(updateData)
    .eq("id", feeId)

  if (error) return { error: "支払い状況の更新に失敗しました" }

  // 支払い確認通知（本人へ）
  if (status === "paid") {
    const label = fee.type === "annual"
      ? `年会費 ${fee.period}年`
      : `月謝 ${fee.period.replace("-", "年")}月`
    await notifyUser(fee.swimmer_id, {
      type: "payment_charged",
      title: `${label}のお支払いが確認されました`,
      body: `¥${fee.amount.toLocaleString()}のお支払いを受領しました`,
      team_id: fee.team_id,
      link: "/payments",
    })
  }

  revalidatePath("/fees")
  return { success: true }
}

export async function bulkCreateFees(
  teamId: string,
  type: FeeType,
  period: string,
  amount: number
) {
  if (!Number.isInteger(amount) || amount <= 0) return { error: "金額は1以上の整数を入力してください" }
  // 月部分は 01〜12 に制限する(範囲チェックなしだと "2024-13" 等の実在しない月の
  // レコードが作成でき、マトリクス表示(1〜12月固定)からは永久に見えない孤立データになる)
  if (!/^\d{4}(-(0[1-9]|1[0-2]))?$/.test(period)) return { error: "期間の形式が不正です（例: 2024 または 2024-04）" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // admin権限チェック（team_members は RLS バイパスが必要）
  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  // 対応する会員種別のみ対象（年会費 → annual, 月謝 → monthly）
  const bulkMembership = type === "annual" ? ["annual"] : type === "monthly" ? ["monthly"] : ["annual", "monthly"]
  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", teamId)
    .eq("status", "active")
    .in("membership_type", bulkMembership)

  if (!members || members.length === 0) {
    return { error: "対象メンバーがいません" }
  }

  const fees = members.map((m) => ({
    team_id: teamId,
    swimmer_id: m.swimmer_id,
    type,
    period,
    amount,
  }))

  const { error } = await admin
    .from("membership_fees")
    .upsert(fees, { onConflict: "team_id,swimmer_id,type,period" })

  if (error) return { error: "会費の一括生成に失敗しました" }

  revalidatePath("/fees")
  return { success: true, count: fees.length }
}

export async function getMemberFees(swimmerId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const targetId = swimmerId || user.id

  // 他ユーザーのデータを取得する場合はadmin権限チェック（team_members は RLS バイパスが必要）
  if (targetId !== user.id) {
    const admin = createAdminClient()
    if (!(await isAdminOfAnyTeamWithMember(admin, targetId, user.id))) return { error: "権限がありません" }
  }

  const { data, error } = await supabase
    .from("membership_fees")
    .select("*, team:teams(id, name)")
    .eq("swimmer_id", targetId)
    .order("created_at", { ascending: false })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function purchasePointCard(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // グループのポイントカード設定を取得
  const { data: team } = await supabase
    .from("teams")
    .select("point_card_count, point_card_price")
    .eq("id", teamId)
    .single()

  if (!team) return { error: "グループが見つかりません" }
  if (!team.point_card_price) return { error: "ポイントカードの料金が設定されていません" }

  // メンバー情報を取得（team_members は RLS バイパスが必要）
  const adminMemberCheck = createAdminClient()
  const { data: member } = await adminMemberCheck
    .from("team_members")
    .select("id, stamp_remaining, membership_type")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .single()

  if (!member) return { error: "グループメンバーではありません" }
  if (member.membership_type !== "point_card") {
    return { error: "ポイントカード会員ではありません" }
  }

  // Stripe決済が未実装のため、実際の課金なしにスタンプを付与してしまわないよう
  // ここで明示的に処理を止める。UIから呼び出す前に決済処理を実装すること。
  return { error: "回数券のオンライン購入は現在準備中です。グループ管理者にお問い合わせください" }
}
