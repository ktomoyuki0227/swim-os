"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Database } from "@/types/database-generated"
import { isTeamAdmin, isAdminOfAnyTeamWithMember } from "@/lib/auth/require-team-admin"
import { notifyUser } from "@/lib/notifications"
import { isTerminalSubscriptionStatus } from "@/lib/stripe-helpers"

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
 * 現金払い会員(Stripe Subscriptionが無い会員)について、「既に到来していて、
 * 入会日以降で、まだレコードが無い」期間のmembership_feesをチーム設定額で自動生成する。
 * Stripe決済会員はwebhook(invoice.paid)側が別途レコードを作成するため、二重管理・
 * (team_id,swimmer_id,type,period)一意制約の衝突を避けるためここでは一切手を出さない。
 * 失敗しても呼び出し元(マトリクス取得)自体は継続する(非致命的)。
 */
async function ensureCashFeeRecords(
  admin: ReturnType<typeof createAdminClient>,
  teamId: string,
  type: "annual" | "monthly",
  periods: { swimmerId: string; period: string }[],
  amount: number
): Promise<Database["public"]["Tables"]["membership_fees"]["Row"][]> {
  if (periods.length === 0) return []

  const toInsert: Database["public"]["Tables"]["membership_fees"]["Insert"][] = periods.map((p) => ({
    team_id: teamId,
    swimmer_id: p.swimmerId,
    type,
    period: p.period,
    amount,
    payment_method: "cash",
    status: "unpaid",
  }))

  // ignoreDuplicates: 同時アクセスや既存レコードとの競合時に安全に無視する
  // (絶対に既存レコードを上書きしない)
  const { data: inserted, error } = await admin
    .from("membership_fees")
    .upsert(toInsert, { onConflict: "team_id,swimmer_id,type,period", ignoreDuplicates: true })
    .select("*")

  if (error) {
    console.error("[ensureCashFeeRecords] Failed to auto-generate fee records:", error)
    return []
  }
  return inserted ?? []
}

/**
 * 月謝会員の年間(1〜12月)支払い状況マトリクスを返す。
 * membership_fees(type='monthly') の既存レコードを集計し、まだ到来している月で
 * レコードが無い現金払い会員分は自動生成してから返す。新規テーブルは使わない。
 */
export async function getMonthlyFeeMatrix(teamId: string, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { data: null }

  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, role, joined_at, stripe_subscription_id, subscription_status, profiles(id, name)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "monthly")

  if (!members || members.length === 0) return { data: { year, members: [] } }

  const { data: monthlyFeeRecords } = await admin
    .from("membership_fees")
    .select("id, swimmer_id, period, status, amount, paid_at")
    .eq("team_id", teamId)
    .eq("type", "monthly")
    .like("period", `${year}-%`)
  let feeRecords: NonNullable<typeof monthlyFeeRecords> = monthlyFeeRecords ?? []

  const { data: team } = await admin
    .from("teams")
    .select("monthly_fee_amount")
    .eq("id", teamId)
    .single()

  const now = new Date()
  // その年度のうち「既に到来している」最終月(未来の年度は0=対象月なし、過去の年度は12)
  const lastDueMonth =
    year > now.getFullYear() ? 0 : year === now.getFullYear() ? now.getMonth() + 1 : 12

  if (lastDueMonth > 0 && team?.monthly_fee_amount && team.monthly_fee_amount > 0) {
    const toGenerate: { swimmerId: string; period: string }[] = []
    for (const m of members) {
      // Stripe決済が有効(行き止まり状態でない)会員はwebhook側に委ねる
      if (m.stripe_subscription_id && !isTerminalSubscriptionStatus(m.subscription_status)) continue

      const joinedDate = new Date(m.joined_at)
      const joinedYear = joinedDate.getFullYear()
      const joinedMonth = joinedDate.getMonth() + 1
      for (let month = 1; month <= lastDueMonth; month++) {
        if (year < joinedYear || (year === joinedYear && month < joinedMonth)) continue
        const period = `${year}-${String(month).padStart(2, "0")}`
        const exists = feeRecords.some((f) => f.swimmer_id === m.swimmer_id && f.period === period)
        if (!exists) toGenerate.push({ swimmerId: m.swimmer_id, period })
      }
    }
    const inserted = await ensureCashFeeRecords(admin, teamId, "monthly", toGenerate, team.monthly_fee_amount)
    if (inserted.length > 0) feeRecords = [...feeRecords, ...inserted]
  }

  const rows: MonthlyFeeMatrixRow[] = members.map((m) => {
    const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as unknown as { id: string; name: string } | null)
    const months: MonthlyFeeCell[] = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const period = `${year}-${String(month).padStart(2, "0")}`
      const fee = feeRecords.find((f) => f.swimmer_id === m.swimmer_id && f.period === period)
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
 * まだレコードが無く、かつ既にその年度が到来している(入会日以降)会員分は
 * チーム設定額で自動生成する。ただしStripe決済が有効(行き止まり状態でない)会員は
 * webhook(invoice.paid)側が別途レコードを作成するため、月謝と同様に自動生成の
 * 対象から除外する(二重生成・一意制約違反を避けるため)。
 */
export async function getAnnualFeeMatrix(teamId: string, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { data: null }

  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, role, joined_at, stripe_subscription_id, subscription_status, profiles(id, name)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "annual")

  if (!members || members.length === 0) return { data: { year, members: [] } }

  const { data: annualFeeRecords } = await admin
    .from("membership_fees")
    .select("id, swimmer_id, status, amount, paid_at")
    .eq("team_id", teamId)
    .eq("type", "annual")
    .eq("period", String(year))
  let feeRecords: NonNullable<typeof annualFeeRecords> = annualFeeRecords ?? []

  const { data: team } = await admin
    .from("teams")
    .select("annual_fee_amount")
    .eq("id", teamId)
    .single()

  if (year <= new Date().getFullYear() && team?.annual_fee_amount && team.annual_fee_amount > 0) {
    const toGenerate = members
      .filter((m) => !m.stripe_subscription_id || isTerminalSubscriptionStatus(m.subscription_status))
      .filter((m) => new Date(m.joined_at).getFullYear() <= year)
      .filter((m) => !feeRecords.some((f) => f.swimmer_id === m.swimmer_id))
      .map((m) => ({ swimmerId: m.swimmer_id, period: String(year) }))
    const inserted = await ensureCashFeeRecords(admin, teamId, "annual", toGenerate, team.annual_fee_amount)
    if (inserted.length > 0) feeRecords = [...feeRecords, ...inserted]
  }

  const rows: MonthlyFeeMatrixRow[] = members.map((m) => {
    const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as unknown as { id: string; name: string } | null)
    const fee = feeRecords.find((f) => f.swimmer_id === m.swimmer_id)
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
