"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { FeeType } from "@/types/database"

export async function getTeamFees(
  teamId: string,
  type?: FeeType,
  period?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { data: [] }

  // 年会費・月謝の対象メンバーを取得（回数券会員は除外）
  const feeTypeMembership = type === "annual" ? ["annual"] : type === "monthly" ? ["monthly"] : ["annual", "monthly"]
  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, membership_type, profiles(id, name, avatar_url)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .in("membership_type", feeTypeMembership)

  if (!members || members.length === 0) return { data: [] }

  // 既存の会費レコードを取得
  let feeQuery = admin
    .from("membership_fees")
    .select("*")
    .eq("team_id", teamId)
  if (type) feeQuery = feeQuery.eq("type", type)
  if (period) feeQuery = feeQuery.eq("period", period)

  const { data: feeRecords } = await feeQuery

  // 全メンバーに会費レコードをマージ（レコードがなければ未登録として表示）
  const merged = members.map((m) => {
    const fee = (feeRecords || []).find((f) => f.swimmer_id === m.swimmer_id)
    const profile = m.profiles as unknown as Record<string, unknown> | null
    if (fee) {
      return { ...fee, swimmer: profile }
    }
    return {
      id: `no-record-${m.swimmer_id}`,
      team_id: teamId,
      swimmer_id: m.swimmer_id,
      type: type || "annual",
      period: period || "",
      amount: 0,
      status: "no_record",
      paid_at: null,
      swimmer: profile,
    }
  })

  return { data: merged }
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
    .select("team_id")
    .eq("id", feeId)
    .single()
  if (!fee) return { error: "会費レコードが見つかりません" }

  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", fee.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const updateData: Record<string, unknown> = { status }
  if (status === "paid") {
    updateData.paid_at = new Date().toISOString()
  }
  if (paymentMethod) {
    updateData.payment_method = paymentMethod
  }

  const { error } = await supabase
    .from("membership_fees")
    .update(updateData)
    .eq("id", feeId)

  if (error) return { error: "支払い状況の更新に失敗しました" }

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
  if (!/^\d{4}(-\d{2})?$/.test(period)) return { error: "期間の形式が不正です（例: 2024 または 2024-04）" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // admin権限チェック（team_members は RLS バイパスが必要）
  const admin = createAdminClient()
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

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

  const { error } = await supabase
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
    const { data: adminTeams } = await admin
      .from("team_members")
      .select("team_id")
      .eq("swimmer_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")

    if (!adminTeams || adminTeams.length === 0) return { error: "権限がありません" }

    const adminTeamIds = adminTeams.map((t) => t.team_id)

    const { data: targetMembership } = await admin
      .from("team_members")
      .select("id")
      .eq("swimmer_id", targetId)
      .in("team_id", adminTeamIds)
      .eq("status", "active")
      .single()

    if (!targetMembership) return { error: "権限がありません" }
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

  // TODO: Stripe 決済（サンドボックス）
  // const paymentIntent = await stripe.paymentIntents.create({
  //   amount: team.point_card_price,
  //   currency: 'jpy',
  //   customer: user.stripe_customer_id,
  // })

  // スタンプ加算（アトミック: レースコンディション防止）
  const { error } = await supabase.rpc("increment_stamp_by", {
    p_team_member_id: member.id,
    p_count: team.point_card_count,
  })

  if (error) return { error: "ポイントカードの購入に失敗しました" }

  revalidatePath("/teams")
  return { success: true }
}
