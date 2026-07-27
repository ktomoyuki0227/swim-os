"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { MembershipType } from "@/types/database"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { notifyUser, notifyUsers } from "@/lib/notifications"

const VALID_MEMBERSHIP_TYPES: MembershipType[] = ["annual", "monthly", "point_card"]

// 参加申請を送信する（公開ページからの申請・承認制）
export async function requestJoinTeam(
  teamId: string,
  membershipType: MembershipType
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (!VALID_MEMBERSHIP_TYPES.includes(membershipType)) {
    return { error: "会員種別が不正です" }
  }

  const admin = createAdminClient()

  // 既にアクティブなメンバーかチェック
  const { data: existing } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (existing) return { error: "既にこのグループに参加しています" }

  // 既にpending申請があるかチェック
  const { data: pending } = await admin
    .from("join_requests")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("status", "pending")
    .maybeSingle()

  if (pending) return { error: "既に参加申請中です" }

  // チーム情報を取得
  const { data: team } = await admin
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .eq("status", "active")
    .single()

  if (!team) return { error: "グループが見つかりません" }

  // 申請者のプロフィールを取得（通知文に使用）
  const { data: profile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  // join_request を作成
  const { error: requestError } = await admin
    .from("join_requests")
    .insert({
      team_id: teamId,
      swimmer_id: user.id,
      membership_type: membershipType,
      status: "pending",
    })

  if (requestError) return { error: "申請に失敗しました" }

  // チームの管理者全員に通知を送信
  const { data: admins } = await admin
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", teamId)
    .eq("role", "admin")
    .eq("status", "active")

  if (admins && admins.length > 0) {
    const applicantName = profile?.name ?? "新しいユーザー"
    await notifyUsers(admins.map((a) => a.swimmer_id), {
      type: "join_request_received",
      title: `${team.name}への参加申請が届きました`,
      body: `${applicantName}さんが参加を申請しました`,
      link: `/teams/${teamId}?tab=requests`,
      team_id: teamId,
      metadata: { applicant_id: user.id },
    })
  }

  revalidatePath(`/teams/${teamId}`)
  revalidatePath("/notifications")
  return { success: true }
}

// Form Action ラッパー（useActionState で使用）
export async function requestJoinTeamAction(
  _prev: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  const teamId = (formData.get("team_id") as string)?.trim()
  const membershipType = (formData.get("membership_type") as MembershipType)

  if (!teamId) return { error: "グループIDが不正です", success: false }

  const result = await requestJoinTeam(teamId, membershipType)
  if (result.error) return { error: result.error, success: false }
  return { error: null, success: true }
}

// 参加申請を承認する（管理者のみ）
export async function approveJoinRequest(
  requestId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // 申請を取得
  const { data: request } = await admin
    .from("join_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single()

  if (!request) return { error: "申請が見つかりません" }

  // 管理者権限チェック
  if (!(await isTeamAdmin(admin, request.team_id, user.id))) {
    return { error: "権限がありません" }
  }

  // チーム情報を取得
  const { data: team } = await admin
    .from("teams")
    .select("name, annual_fee_amount")
    .eq("id", request.team_id)
    .single()

  if (!team) return { error: "グループが見つかりません" }

  // team_members にメンバー追加
  const { error: memberError } = await admin
    .from("team_members")
    .insert({
      team_id: request.team_id,
      swimmer_id: request.swimmer_id,
      role: "member",
      membership_type: request.membership_type,
      stamp_remaining: 0,
      status: "active",
    })

  if (memberError) return { error: "メンバー追加に失敗しました" }

  // 年会費メンバーなら年会費レコードを自動生成
  if (request.membership_type === "annual" && team.annual_fee_amount) {
    const currentYear = new Date().getFullYear().toString()
    await admin.from("membership_fees").insert({
      team_id: request.team_id,
      swimmer_id: request.swimmer_id,
      type: "annual",
      period: currentYear,
      amount: team.annual_fee_amount,
    })
  }

  // 申請ステータスを承認済みに更新
  await admin
    .from("join_requests")
    .update({ status: "approved" })
    .eq("id", requestId)

  // 申請者に承認通知を送信
  await notifyUser(request.swimmer_id, {
    type: "join_request_approved",
    title: `${team.name}への参加が承認されました`,
    body: "グループページからセッションの確認や申し込みができます",
    link: `/teams/${request.team_id}`,
    team_id: request.team_id,
    metadata: {},
  })

  // 他の管理者へ新メンバー参加通知（承認した管理者自身は除く）
  const { data: joinerProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", request.swimmer_id)
    .single()
  const { data: otherAdmins } = await admin
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", request.team_id)
    .eq("role", "admin")
    .eq("status", "active")
    .neq("swimmer_id", user.id)
  if (otherAdmins && otherAdmins.length > 0) {
    await notifyUsers(otherAdmins.map((a) => a.swimmer_id), {
      type: "member_joined",
      title: `${joinerProfile?.name ?? "新しいメンバー"}さんが「${team.name}」に参加しました`,
      body: null,
      team_id: request.team_id,
      link: `/teams/${request.team_id}?tab=members`,
    })
  }

  revalidatePath(`/teams/${request.team_id}`)
  revalidatePath("/notifications")
  return { success: true }
}

// 参加申請を拒否する（管理者のみ）
export async function rejectJoinRequest(
  requestId: string,
  reason?: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // 申請を取得
  const { data: request } = await admin
    .from("join_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single()

  if (!request) return { error: "申請が見つかりません" }

  // 管理者権限チェック
  if (!(await isTeamAdmin(admin, request.team_id, user.id))) {
    return { error: "権限がありません" }
  }

  // チーム情報
  const { data: team } = await admin
    .from("teams")
    .select("name")
    .eq("id", request.team_id)
    .single()

  // 申請ステータスを拒否済みに更新
  await admin
    .from("join_requests")
    .update({ status: "rejected", rejection_reason: reason ?? null })
    .eq("id", requestId)

  // 申請者に拒否通知を送信
  await notifyUser(request.swimmer_id, {
    type: "join_request_rejected",
    title: `${team?.name ?? "グループ"}への参加申請が見送られました`,
    body: reason ? `理由: ${reason}` : null,
    link: `/teams/${request.team_id}`,
    team_id: request.team_id,
    metadata: {},
  })

  revalidatePath(`/teams/${request.team_id}`)
  revalidatePath("/notifications")
  return { success: true }
}

// チームへのpending申請一覧を取得（管理者のみ）
export async function getTeamJoinRequests(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です", data: [] }

  const admin = createAdminClient()

  // 管理者権限チェック
  if (!(await isTeamAdmin(admin, teamId, user.id))) {
    return { error: "権限がありません", data: [] }
  }

  const { data, error } = await admin
    .from("join_requests")
    .select("*, swimmer:profiles(id, name, avatar_url, furigana)")
    .eq("team_id", teamId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (error) return { error: "申請の取得に失敗しました", data: [] }
  return { data: data ?? [] }
}

// 自分の特定チームへの申請状況を取得
export async function getMyJoinRequest(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null }

  const admin = createAdminClient()
  const { data } = await admin
    .from("join_requests")
    .select("id, status, membership_type, created_at")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return { data: data ?? null }
}
