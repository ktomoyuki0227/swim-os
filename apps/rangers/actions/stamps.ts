"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"

export async function getStampMembers(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  if (!(await isTeamAdmin(admin, teamId, user.id))) return { data: [] }

  // 回数券会員一覧
  const { data: members } = await admin
    .from("team_members")
    .select("id, swimmer_id, stamp_remaining, joined_at, profiles(id, name, avatar_url)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "point_card")

  if (!members || members.length === 0) return { data: [] }

  const swimmerIds = members.map((m) => m.swimmer_id)

  // 購入履歴
  const { data: purchases } = await admin
    .from("stamp_purchases")
    .select("*")
    .eq("team_id", teamId)
    .in("swimmer_id", swimmerIds)
    .order("purchased_at", { ascending: false })

  return {
    data: members.map((m) => ({
      team_member_id: m.id,
      swimmer_id: m.swimmer_id,
      stamp_remaining: m.stamp_remaining ?? 0,
      joined_at: m.joined_at,
      profile: Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles as unknown as { id: string; name: string; avatar_url: string } | null),
      purchases: (purchases || []).filter((p) => p.swimmer_id === m.swimmer_id),
    })),
  }
}

export async function addStampPurchase(
  teamId: string,
  swimmerId: string,
  cardCount: number,
  stampCount: number,
  amount: number,
  note?: string
) {
  if (!Number.isInteger(cardCount) || cardCount <= 0) return { error: "枚数は1以上の整数を入力してください" }
  if (!Number.isInteger(stampCount) || stampCount <= 0) return { error: "回数券の回数は1以上の整数を入力してください" }
  if (!Number.isInteger(amount) || amount < 0) return { error: "金額は0以上の整数を入力してください" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  const { data: tm } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .eq("status", "active")
    .single()
  if (!tm) return { error: "対象メンバーが見つかりません" }

  // 購入記録の追加とstamp_remainingの加算を単一トランザクションで原子的に行う
  // (片方だけ成功して購入記録とスタンプ残数が不整合になることを防ぐ)
  const { error: purchaseError } = await admin.rpc("add_stamp_purchase", {
    p_team_id: teamId,
    p_swimmer_id: swimmerId,
    p_team_member_id: tm.id,
    p_card_count: cardCount,
    p_stamp_count: stampCount,
    p_amount: amount,
    p_note: note || undefined,
  })
  if (purchaseError) {
    console.error("[addStampPurchase] add_stamp_purchase failed:", purchaseError)
    return { error: "購入記録の追加に失敗しました" }
  }

  revalidatePath("/fees")
  return { success: true }
}
