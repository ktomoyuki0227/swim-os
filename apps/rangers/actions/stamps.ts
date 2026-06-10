"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function getStampMembers(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: adminCheck } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminCheck) return { data: [] }

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
      stamp_remaining: m.stamp_remaining,
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: adminCheck } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminCheck) return { error: "権限がありません" }

  // 購入記録を追加
  const { error: purchaseError } = await admin
    .from("stamp_purchases")
    .insert({
      team_id: teamId,
      swimmer_id: swimmerId,
      card_count: cardCount,
      stamp_count: stampCount,
      amount,
      note: note || null,
    })

  if (purchaseError) return { error: "購入記録の追加に失敗しました" }

  // stamp_remaining を加算
  const addedStamps = cardCount * stampCount
  const { data: tm } = await admin
    .from("team_members")
    .select("stamp_remaining")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .single()

  await admin
    .from("team_members")
    .update({ stamp_remaining: (tm?.stamp_remaining ?? 0) + addedStamps })
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)

  revalidatePath("/fees")
  return { success: true }
}
