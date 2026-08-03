"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { SWIMMER_TYPES, SWIM_DISCIPLINES, SWIM_LEVELS, SYSTEM_TAGS } from "@/types/database"
import type { MembershipType } from "@/types/database"
import type { Database } from "@/types/database-generated"
import { isTeamAdmin, getActiveTeamAdminIds } from "@/lib/auth/require-team-admin"
import { notifyUsers } from "@/lib/notifications"
import { isRateLimited } from "@/lib/rate-limit"
import { stripe } from "@/lib/stripe"

const JOIN_TEAM_RATE_LIMIT = 10
const JOIN_TEAM_RATE_WINDOW_MS = 60 * 1000

/**
 * メンバー削除・会員種別変更で月謝会員でなくなる際に、既存のStripe Subscriptionを
 * cancelMonthlySubscription(actions/subscriptions.ts)と同じcancel_at_period_end方式で
 * キャンセルする内部ヘルパー。これを呼ばないと、削除/変更後もStripe側の定期課金が
 * 残り続けて請求され続けてしまう。Stripe未設定環境やSubscriptionが無い場合は何もしない。
 */
async function cancelStripeSubscriptionIfActive(
  admin: ReturnType<typeof createAdminClient>,
  teamMemberId: string,
  stripeSubscriptionId: string | null
): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY || !stripeSubscriptionId) return
  try {
    await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true })
  } catch (err) {
    console.error("[cancelStripeSubscriptionIfActive] Stripe subscription cancel failed:", err)
    return
  }
  const { error } = await admin
    .from("team_members")
    .update({ subscription_status: "canceled" })
    .eq("id", teamMemberId)
  if (error) {
    console.error("[cancelStripeSubscriptionIfActive] DB update failed:", error)
  }
}

export async function joinTeamByCode(
  inviteCode: unknown,
  membershipType: unknown,
) {
  if (typeof inviteCode !== "string" || inviteCode.trim() === "") {
    return { error: "無効な招待コードです" }
  }
  if (membershipType !== "annual" && membershipType !== "monthly" && membershipType !== "point_card") {
    return { error: "会員種別が不正です" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (isRateLimited(`join_team:${user.id}`, JOIN_TEAM_RATE_LIMIT, JOIN_TEAM_RATE_WINDOW_MS)) {
    return { error: "試行回数が多すぎます。しばらく時間をおいてから再度お試しください" }
  }

  const admin = createAdminClient()

  // 招待コードでグループを検索
  // 参加前の非メンバーは teams_select 系RLSで大半のプライベートチームが見えないため、
  // 招待コード自体を知っていることを認可の根拠として adminClient で検索する
  const { data: team, error: teamError } = await admin
    .from("teams")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("status", "active")
    .single()

  if (teamError || !team) return { error: "無効な招待コードです" }

  // 既にメンバーか確認（removeMemberはソフトデリート(status="inactive")のため、
  // 過去に退会した行が残っている場合がある。statusを見ずに存在チェックすると
  // 退会済みユーザーが二度と参加できなくなるため、activeな行のみを対象にする）
  const { data: existing } = await supabase
    .from("team_members")
    .select("id, status")
    .eq("team_id", team.id)
    .eq("swimmer_id", user.id)
    .maybeSingle()

  if (existing?.status === "active") return { error: "既にこのグループに参加しています" }

  if (existing) {
    // 退会済み(inactive)の行を再アクティブ化する。team_members_update ポリシーは
    // admin限定のUPDATEしか許可しないため、通常クライアントでの自己UPDATEは通らない。
    // 招待コードの正当性は直前のteams検索(adminClient)で確認済みのため、adminClientで
    // 再アクティブ化してよい。
    const { error: reactivateError } = await admin
      .from("team_members")
      .update({
        status: "active",
        role: "member",
        membership_type: membershipType,
        stamp_remaining: 0,
        joined_at: new Date().toISOString(),
      })
      .eq("id", existing.id)

    if (reactivateError) return { error: "グループへの再参加に失敗しました" }
  } else {
    // メンバーとして追加
    const { error: joinError } = await supabase.from("team_members").insert({
      team_id: team.id,
      swimmer_id: user.id,
      role: "member",
      membership_type: membershipType,
      stamp_remaining: 0,
    })

    if (joinError) return { error: "グループへの参加に失敗しました" }
  }

  // 年会費会員なら年会費レコードを自動生成
  // fees_insert_admin ポリシーは管理者のみ許可のため、参加した本人（非管理者）による
  // 通常クライアントでのINSERTは常にRLS違反で失敗する。adminClientで作成する。
  if (membershipType === "annual" && team.annual_fee_amount) {
    const currentYear = new Date().getFullYear().toString()
    // 年会費生成失敗はグループ参加を妨げない（非致命的）
    const { error: feeError } = await admin.from("membership_fees").insert({
      team_id: team.id,
      swimmer_id: user.id,
      type: "annual",
      period: currentYear,
      amount: team.annual_fee_amount,
    })
    if (feeError) {
      console.error("[joinTeamByCode] Failed to create annual fee record:", feeError)
    }
  }

  // 参加者名を取得して管理者へ通知
  const { data: joinerProfile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()
  const teamAdminIds = await getActiveTeamAdminIds(admin, team.id)
  if (teamAdminIds.length > 0) {
    await notifyUsers(teamAdminIds, {
      type: "member_joined",
      title: `${joinerProfile?.name ?? "新しいメンバー"}さんが「${team.name}」に参加しました`,
      body: null,
      team_id: team.id,
      link: `/teams/${team.id}?tab=members`,
    })
  }

  revalidatePath("/teams")
  revalidatePath("/notifications")
  return { data: team }
}

export async function joinTeamAction(
  _prev: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const invite = (formData.get("invite") as string)?.trim()
  const membershipType = formData.get("membership_type") as string

  const result = await joinTeamByCode(invite, membershipType)
  if ("error" in result) return { error: result.error ?? "参加に失敗しました" }

  redirect(`/teams/${result.data.id}`)
}

export async function getTeamMembers(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "ログインが必要です" }

  // RLS バイパスが必要なため adminClient で admin チェック
  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { data: [], error: "権限がありません" }
  const { data, error } = await admin
    .from("team_members")
    .select("*, swimmer:profiles(id, name, avatar_url, furigana, gender, birthday, phone, address, emergency_contact, emergency_contact_name, emergency_contact_relation, masters_registered, masters_number, jsa_registered, jsa_number, specialties, prefectures, swimming_goals, participation_styles, level, swimmer_type, swim_disciplines)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(500) // データ増加に伴う無制限クエリを防ぐ安全上限（通常のチーム規模を大きく超える値）

  if (error) return { data: [], error: "メンバーの取得に失敗しました" }
  return { data: data || [] }
}

export async function getMemberEmail(teamId: string, swimmerId: string): Promise<{ email?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  const { data: authUser, error } = await admin.auth.admin.getUserById(swimmerId)
  if (error || !authUser?.user?.email) return { error: "メールアドレスを取得できませんでした" }
  return { email: authUser.user.email }
}

export async function removeMember(teamId: string, swimmerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  // 最後の管理者の削除を防ぐ
  const { data: targetMember } = await admin
    .from("team_members")
    .select("id, role, stripe_subscription_id")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .eq("status", "active")
    .single()

  if (targetMember?.role === "admin") {
    const { count } = await admin
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("role", "admin")
      .eq("status", "active")
    if ((count ?? 0) <= 1) {
      return { error: "最後の管理者は削除できません" }
    }
  }

  const { error } = await admin
    .from("team_members")
    .update({ status: "inactive" })
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)

  if (error) return { error: "メンバーの削除に失敗しました" }

  if (targetMember?.id) {
    await cancelStripeSubscriptionIfActive(admin, targetMember.id, targetMember.stripe_subscription_id)
  }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

export async function updateMembershipType(
  teamMemberId: string,
  type: MembershipType
) {
  const validMembershipTypes: MembershipType[] = ["annual", "monthly", "point_card"]
  if (!validMembershipTypes.includes(type)) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: tm } = await admin
    .from("team_members")
    .select("team_id, membership_type, stripe_subscription_id")
    .eq("id", teamMemberId)
    .single()
  if (!tm) return { error: "メンバーが見つかりません" }

  if (!(await isTeamAdmin(admin, tm.team_id, user.id))) return { error: "権限がありません" }

  const { error } = await admin
    .from("team_members")
    .update({ membership_type: type })
    .eq("id", teamMemberId)

  if (error) return { error: "会員種別の変更に失敗しました" }

  // 月謝以外に変更した場合、既存のStripe Subscriptionが残っていれば請求が続かないよう
  // キャンセルする（cancelStripeSubscriptionIfActiveが内部でsubscription_statusも更新する）
  if (type !== "monthly" && tm.membership_type === "monthly") {
    await cancelStripeSubscriptionIfActive(admin, teamMemberId, tm.stripe_subscription_id)
  }

  revalidatePath("/teams")
  return { success: true }
}

export async function updateMemberInfo(
  teamId: string,
  swimmerId: string,
  data: {
    membershipType: MembershipType
    stampRemaining?: number
    role: "admin" | "member"
  }
) {
  // 入力バリデーション
  const validMembershipTypes: MembershipType[] = ["annual", "monthly", "point_card"]
  if (!validMembershipTypes.includes(data.membershipType)) return { error: "入力値が不正です" }
  if (data.role !== "admin" && data.role !== "member") return { error: "入力値が不正です" }
  if (
    data.stampRemaining !== undefined &&
    (!Number.isInteger(data.stampRemaining) || data.stampRemaining < 0)
  ) {
    return { error: "入力値が不正です" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const admin = createAdminClient()

  // 操作者が管理者かチェック
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  // 自分自身のロール変更禁止（管理者が自分を降格するのを防ぐ）
  if (swimmerId === user.id && data.role !== "admin") {
    return { error: "自分自身のロールは変更できません" }
  }

  // 変更前の会員種別・Subscription情報を取得（月謝→他種別への変更時にキャンセル判定で使う）
  const { data: beforeUpdate } = await admin
    .from("team_members")
    .select("role, membership_type, stripe_subscription_id")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .single()

  // 最後の管理者を降格しようとしていないかチェック（管理者→一般への変更のみ対象）
  if (data.role === "member" && beforeUpdate?.role === "admin") {
    const { count } = await admin
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("role", "admin")
      .eq("status", "active")
    if ((count ?? 0) <= 1) {
      return { error: "最後の管理者のロールは変更できません" }
    }
  }

  const updateData: Database["public"]["Tables"]["team_members"]["Update"] = {
    membership_type: data.membershipType,
    role: data.role,
  }
  if (data.membershipType === "point_card") {
    updateData.stamp_remaining = data.stampRemaining !== undefined
      ? Math.max(0, data.stampRemaining)
      : 0
  } else {
    // 回数券以外に切り替えたときは残数をリセット
    updateData.stamp_remaining = 0
  }

  const { data: updated, error } = await admin
    .from("team_members")
    .update(updateData)
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .select("id")

  if (error) return { error: "メンバー情報の更新に失敗しました" }
  if (!updated || updated.length === 0) return { error: "メンバーが見つかりません" }

  // 月謝以外に変更した場合、既存のStripe Subscriptionが残っていれば請求が続かないよう
  // キャンセルする（cancelStripeSubscriptionIfActiveが内部でsubscription_statusも更新する）
  if (data.membershipType !== "monthly" && beforeUpdate?.membership_type === "monthly") {
    await cancelStripeSubscriptionIfActive(admin, updated[0].id, beforeUpdate.stripe_subscription_id)
  }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

// SYSTEM_TAGS でカバーする値（保存時に非対象の値を保持するため）
const SYSTEM_TAG_SPECIALTIES: string[] = SYSTEM_TAGS.filter((t) => t.category === "泳法").map((t) => t.label)
const SYSTEM_TAG_GOALS: string[] = SYSTEM_TAGS.filter((t) => t.category === "目的").map((t) => t.label)

export async function updateMemberProfileTags(
  teamId: string,
  swimmerId: string,
  data: {
    level: string | null
    specialties: string[]
    swimmingGoals: string[]
    swimmerType: string | null
    swimDisciplines: string[]
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const admin = createAdminClient()

  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  // 入力値ホワイトリストバリデーション
  if (data.level !== null && !(SWIM_LEVELS as readonly string[]).includes(data.level)) {
    return { error: "入力値が不正です" }
  }
  if (!data.specialties.every((s) => SYSTEM_TAG_SPECIALTIES.includes(s))) {
    return { error: "入力値が不正です" }
  }
  if (!data.swimmingGoals.every((g) => SYSTEM_TAG_GOALS.includes(g))) {
    return { error: "入力値が不正です" }
  }
  if (data.swimmerType !== null && !(SWIMMER_TYPES as readonly string[]).includes(data.swimmerType)) {
    return { error: "入力値が不正です" }
  }
  if (!data.swimDisciplines.every((d) => (SWIM_DISCIPLINES as readonly string[]).includes(d))) {
    return { error: "入力値が不正です" }
  }

  // 現在のプロフィールを取得し、SYSTEM_TAGS が管理しない値を保持する
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("specialties, swimming_goals")
    .eq("id", swimmerId)
    .single()

  const otherSpecialties = ((currentProfile?.specialties ?? []) as string[]).filter(
    (s) => !SYSTEM_TAG_SPECIALTIES.includes(s)
  )
  const otherGoals = ((currentProfile?.swimming_goals ?? []) as string[]).filter(
    (g) => !SYSTEM_TAG_GOALS.includes(g)
  )

  const { error } = await admin
    .from("profiles")
    .update({
      level: data.level,
      specialties: [...otherSpecialties, ...data.specialties],
      swimming_goals: [...otherGoals, ...data.swimmingGoals],
      swimmer_type: data.swimmerType,
      swim_disciplines: data.swimDisciplines,
    })
    .eq("id", swimmerId)

  if (error) return { error: "プロフィールの更新に失敗しました" }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}
