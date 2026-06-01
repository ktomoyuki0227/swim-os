"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { teamSchema, teamUpdateSchema } from "@/lib/validations"
import type { MembershipType } from "@/types/database"

export async function createTeam(data: unknown) {
  const parsed = teamSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      coach_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      default_member_price: parsed.data.default_member_price,
      default_guest_price: parsed.data.default_guest_price,
      annual_fee_amount: parsed.data.annual_fee_amount || null,
      monthly_fee_amount: parsed.data.monthly_fee_amount || null,
      cancellation_days: parsed.data.cancellation_days,
      point_card_count: parsed.data.point_card_count,
      point_card_price: parsed.data.point_card_price || null,
    })
    .select()
    .single()

  if (error) {
    return { error: "チームの作成に失敗しました" }
  }

  // 作成者を admin として追加（失敗時はチームごと削除してロールバック）
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    swimmer_id: user.id,
    role: "admin",
    membership_type: "regular",
  })

  if (memberError) {
    await supabase.from("teams").delete().eq("id", team.id)
    return { error: "チームの作成に失敗しました" }
  }

  // profiles.role を instructor に更新（チーム作成 = コーチ）
  await supabase
    .from("profiles")
    .update({ role: "instructor" })
    .eq("id", user.id)

  revalidatePath("/instructor/teams")
  return { data: team }
}

export async function updateTeam(teamId: string, data: unknown) {
  const parsed = teamUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await supabase
    .from("teams")
    .update(parsed.data)
    .eq("id", teamId)

  if (error) return { error: "チーム情報の更新に失敗しました" }

  revalidatePath(`/instructor/teams/${teamId}`)
  return { success: true }
}

export async function getMyTeams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [] }

  // Service roleでRLSをバイパスして取得（user.idで手動フィルタするので安全）
  const admin = createAdminClient()

  const { data: memberships } = await admin
    .from("team_members")
    .select("team_id, role, membership_type")
    .eq("swimmer_id", user.id)
    .eq("status", "active")

  if (!memberships || memberships.length === 0) return { data: [] }

  const teamIds = memberships.map((m) => m.team_id)

  const { data: teams } = await admin
    .from("teams")
    .select("*")
    .in("id", teamIds)

  if (!teams) return { data: [] }

  return {
    data: teams.map((team) => {
      const membership = memberships.find((m) => m.team_id === team.id)
      return {
        ...team,
        my_role: membership?.role,
        my_membership_type: membership?.membership_type,
      }
    }),
  }
}

export async function getTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // メンバーシップを確認（RLS自己参照問題をバイパス）
  const { data: membership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .single()

  if (!membership) return { error: "チームが見つかりません" }

  const { data: team, error } = await admin
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single()

  if (error || !team) return { error: "チームが見つかりません" }
  return { data: team }
}

export async function joinTeamByCode(
  inviteCode: unknown,
  membershipType: unknown,
  tags: unknown
) {
  if (typeof inviteCode !== "string" || inviteCode.trim() === "") {
    return { error: "無効な招待コードです" }
  }
  if (membershipType !== "regular" && membershipType !== "point_card") {
    return { error: "会員種別が不正です" }
  }
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
    return { error: "タグの値が不正です" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 招待コードでチームを検索
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("status", "active")
    .single()

  if (teamError || !team) return { error: "無効な招待コードです" }

  // 既にメンバーか確認
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("swimmer_id", user.id)
    .single()

  if (existing) return { error: "既にこのチームに参加しています" }

  // メンバーとして追加
  const { error: joinError } = await supabase.from("team_members").insert({
    team_id: team.id,
    swimmer_id: user.id,
    role: "member",
    membership_type: membershipType,
    tags,
    stamp_remaining: membershipType === "point_card" ? 0 : 0,
  })

  if (joinError) return { error: "チームへの参加に失敗しました" }

  // レギュラー会員なら年会費レコードを自動生成
  if (membershipType === "regular" && team.annual_fee_amount) {
    const currentYear = new Date().getFullYear().toString()
    const { error: feeError } = await supabase.from("membership_fees").insert({
      team_id: team.id,
      swimmer_id: user.id,
      type: "annual",
      period: currentYear,
      amount: team.annual_fee_amount,
    })
    // 年会費生成失敗はチーム参加を妨げないが、エラーをログに残す
    if (feeError) {
      console.error("membership_fees insert failed:", feeError.message)
    }
  }

  revalidatePath("/teams")
  return { data: team }
}

export async function getTeamMembers(teamId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("team_members")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function updateMemberTags(teamMemberId: string, tags: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tm } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("id", teamMemberId)
    .single()
  if (!tm) return { error: "メンバーが見つかりません" }

  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", tm.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await supabase
    .from("team_members")
    .update({ tags })
    .eq("id", teamMemberId)

  if (error) return { error: "タグの更新に失敗しました" }

  revalidatePath("/instructor/teams")
  return { success: true }
}

export async function removeMember(teamId: string, swimmerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await supabase
    .from("team_members")
    .update({ status: "inactive" })
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)

  if (error) return { error: "メンバーの削除に失敗しました" }

  revalidatePath(`/instructor/teams/${teamId}`)
  return { success: true }
}

export async function updateMembershipType(
  teamMemberId: string,
  type: MembershipType
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tm } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("id", teamMemberId)
    .single()
  if (!tm) return { error: "メンバーが見つかりません" }

  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", tm.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await supabase
    .from("team_members")
    .update({ membership_type: type })
    .eq("id", teamMemberId)

  if (error) return { error: "会員種別の変更に失敗しました" }

  revalidatePath("/instructor/teams")
  return { success: true }
}

export async function regenerateInviteCode(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { data, error } = await supabase
    .rpc("gen_random_uuid")

  if (error) return { error: "招待コードの再生成に失敗しました" }

  const { error: updateError } = await supabase
    .from("teams")
    .update({ invite_code: data })
    .eq("id", teamId)

  if (updateError) return { error: "招待コードの更新に失敗しました" }

  revalidatePath(`/instructor/teams/${teamId}`)
  return { success: true }
}
