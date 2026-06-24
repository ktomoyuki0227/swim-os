"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { teamSchema, teamUpdateSchema } from "@/lib/validations"
import { SWIMMER_TYPES, SWIM_DISCIPLINES, SWIM_LEVELS, SYSTEM_TAGS } from "@/types/database"
import type { MembershipType } from "@/types/database"

export async function uploadTeamImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return { error: "ファイルを選択してください" }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) return { error: "JPEG・PNG・WebP形式のみアップロードできます" }
  if (file.size > 5 * 1024 * 1024) return { error: "ファイルサイズは5MB以下にしてください" }

  const type = (formData.get("type") as string) || "cover" // "cover" | "icon"
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const filePath = `${user.id}/${type}-${Date.now()}.${ext}`

  const admin = await createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("teams")
    .upload(filePath, file, { upsert: true })

  if (uploadError) return { error: "画像のアップロードに失敗しました" }

  const { data: urlData } = admin.storage.from("teams").getPublicUrl(filePath)
  return { url: `${urlData.publicUrl}?t=${Date.now()}` }
}

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
      avatar_url: parsed.data.avatar_url || null,
      cover_image_url: parsed.data.cover_image_url || null,
      is_recruiting: parsed.data.is_recruiting ?? true,
      activity_area: parsed.data.activity_area || null,
      practice_frequency: parsed.data.practice_frequency || null,
      practice_days: parsed.data.practice_days ?? [],
      main_pool: parsed.data.main_pool || null,
      has_session_fee: parsed.data.has_session_fee ?? true,
      has_annual_fee: parsed.data.has_annual_fee ?? false,
      has_monthly_fee: parsed.data.has_monthly_fee ?? false,
      has_point_card: parsed.data.has_point_card ?? false,
      default_member_price: parsed.data.default_member_price,
      default_guest_price: parsed.data.default_guest_price,
      annual_fee_amount: parsed.data.annual_fee_amount || null,
      monthly_fee_amount: parsed.data.monthly_fee_amount || null,
      cancellation_days: parsed.data.cancellation_days,
      point_card_count: parsed.data.point_card_count,
      point_card_price: parsed.data.point_card_price || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
    })
    .select()
    .single()

  if (error) {
    return { error: "グループの作成に失敗しました" }
  }

  // 作成者を admin として追加（失敗時はグループごと削除してロールバック）
  // 管理者の会員種別: チームの料金体系に合わせて設定
  const adminMembershipType: MembershipType =
    team.has_annual_fee && !team.has_monthly_fee ? "annual" :
    team.has_monthly_fee ? "monthly" :
    "monthly"
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    swimmer_id: user.id,
    role: "admin",
    membership_type: adminMembershipType,
  })

  if (memberError) {
    await supabase.from("teams").delete().eq("id", team.id)
    return { error: "グループの作成に失敗しました" }
  }

  revalidatePath("/teams")
  return { data: team }
}

export async function updateTeam(teamId: string, data: unknown) {
  const parsed = teamUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

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
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await admin
    .from("teams")
    .update(parsed.data)
    .eq("id", teamId)

  if (error) return { error: "グループ情報の更新に失敗しました" }

  revalidatePath(`/teams/${teamId}`)
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

  if (!membership) return { error: "グループが見つかりません" }

  const { data: team, error } = await admin
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single()

  if (error || !team) return { error: "グループが見つかりません" }
  return { data: team }
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

  // 招待コードでグループを検索
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

  if (existing) return { error: "既にこのグループに参加しています" }

  // メンバーとして追加
  const { error: joinError } = await supabase.from("team_members").insert({
    team_id: team.id,
    swimmer_id: user.id,
    role: "member",
    membership_type: membershipType,
    stamp_remaining: 0,
  })

  if (joinError) return { error: "グループへの参加に失敗しました" }

  // 年会費会員なら年会費レコードを自動生成
  if (membershipType === "annual" && team.annual_fee_amount) {
    const currentYear = new Date().getFullYear().toString()
    // 年会費生成失敗はグループ参加を妨げない（非致命的）
    await supabase.from("membership_fees").insert({
      team_id: team.id,
      swimmer_id: user.id,
      type: "annual",
      period: currentYear,
      amount: team.annual_fee_amount,
    })
  }

  revalidatePath("/teams")
  return { data: team }
}

export async function getTeamMembers(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: "ログインが必要です" }

  // RLS バイパスが必要なため adminClient で admin チェック
  const admin = createAdminClient()
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { data: [], error: "権限がありません" }
  const { data, error } = await admin
    .from("team_members")
    .select("*, swimmer:profiles(id, name, avatar_url, furigana, gender, birthday, phone, address, emergency_contact, emergency_contact_name, emergency_contact_relation, masters_registered, masters_number, jsa_registered, jsa_number, specialties, prefectures, swimming_goals, participation_styles, level, swimmer_type, swim_disciplines)")
    .eq("team_id", teamId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })

  if (error) return { data: [], error: "メンバーの取得に失敗しました" }
  return { data: data || [] }
}

export async function getMemberEmail(teamId: string, swimmerId: string): Promise<{ email?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

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

  const { data: authUser, error } = await admin.auth.admin.getUserById(swimmerId)
  if (error || !authUser?.user?.email) return { error: "メールアドレスを取得できませんでした" }
  return { email: authUser.user.email }
}

export async function removeMember(teamId: string, swimmerId: string) {
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
  if (!adminMembership) return { error: "権限がありません" }

  // 最後の管理者の削除を防ぐ
  const { data: targetMember } = await admin
    .from("team_members")
    .select("role")
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

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

export async function updateMembershipType(
  teamMemberId: string,
  type: MembershipType
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: tm } = await admin
    .from("team_members")
    .select("team_id")
    .eq("id", teamMemberId)
    .single()
  if (!tm) return { error: "メンバーが見つかりません" }

  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", tm.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await admin
    .from("team_members")
    .update({ membership_type: type })
    .eq("id", teamMemberId)

  if (error) return { error: "会員種別の変更に失敗しました" }

  revalidatePath("/teams")
  return { success: true }
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

export async function getPublicTeams(options?: { q?: string; excludeUserId?: string }) {
  const admin = createAdminClient()

  // ログインユーザーが所属しているグループIDを取得して除外
  let excludeIds: string[] = []
  if (options?.excludeUserId) {
    const { data: memberships } = await admin
      .from("team_members")
      .select("team_id")
      .eq("swimmer_id", options.excludeUserId)
      .eq("status", "active")
    excludeIds = (memberships ?? []).map((m) => m.team_id as string)
  }

  let query = admin
    .from("teams")
    .select("id, name, description, avatar_url, coach_id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)

  if (options?.q) {
    query = query.ilike("name", `%${options.q}%`)
  }

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`)
  }

  const { data, error } = await query
  if (error) return { data: [] }
  return { data: data || [] }
}

export async function regenerateInviteCode(teamId: string) {
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
  if (!adminMembership) return { error: "権限がありません" }

  const { data, error } = await supabase
    .rpc("gen_random_uuid")

  if (error) return { error: "招待コードの再生成に失敗しました" }

  const { error: updateError } = await supabase
    .from("teams")
    .update({ invite_code: data })
    .eq("id", teamId)

  if (updateError) return { error: "招待コードの更新に失敗しました" }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

export async function getTeamFeeStats(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  // RLS バイパスが必要なため adminClient で admin チェック
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
  const currentYear = new Date().getFullYear().toString()

  // 全アクティブメンバーを取得
  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, membership_type")
    .eq("team_id", teamId)
    .eq("status", "active")

  if (!members || members.length === 0) {
    return { data: { paid: 0, subscriptionUnpaid: 0, stampUnpaid: 0, total: 0 } }
  }

  const total = members.length
  const annualIds = members.filter((m) => m.membership_type === "annual").map((m) => m.swimmer_id)
  const monthlyIds = members.filter((m) => m.membership_type === "monthly").map((m) => m.swimmer_id)
  const pointCardIds = members.filter((m) => m.membership_type === "point_card").map((m) => m.swimmer_id)

  // 年会費メンバー: 今年の年会費ステータスを確認
  let annualPaid = 0
  let annualUnpaid = 0
  if (annualIds.length > 0) {
    const { data: fees } = await admin
      .from("membership_fees")
      .select("swimmer_id, status")
      .eq("team_id", teamId)
      .eq("type", "annual")
      .eq("period", currentYear)
      .in("swimmer_id", annualIds)

    const feeMap = new Map((fees || []).map((f) => [f.swimmer_id, f.status]))
    annualPaid = annualIds.filter((id) => feeMap.get(id) === "paid").length
    annualUnpaid = annualIds.length - annualPaid
  }

  // 月謝メンバー: 今月の月謝ステータスを確認
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  let monthlyPaid = 0
  let monthlyUnpaid = 0
  if (monthlyIds.length > 0) {
    const { data: fees } = await admin
      .from("membership_fees")
      .select("swimmer_id, status")
      .eq("team_id", teamId)
      .eq("type", "monthly")
      .eq("period", currentMonth)
      .in("swimmer_id", monthlyIds)

    const feeMap = new Map((fees || []).map((f) => [f.swimmer_id, f.status]))
    monthlyPaid = monthlyIds.filter((id) => feeMap.get(id) === "paid").length
    monthlyUnpaid = monthlyIds.length - monthlyPaid
  }

  const subscriptionPaid = annualPaid + monthlyPaid
  const subscriptionUnpaid = annualUnpaid + monthlyUnpaid

  // 回数券メンバー（point_card）: 未払い・失敗の購入記録があるか確認
  let stampPaid = 0
  let stampUnpaid = 0
  if (pointCardIds.length > 0) {
    const { data: unpaidStamps } = await admin
      .from("stamp_purchases")
      .select("swimmer_id")
      .eq("team_id", teamId)
      .in("status", ["unpaid", "failed"])
      .in("swimmer_id", pointCardIds)

    const stampUnpaidIds = new Set((unpaidStamps || []).map((s) => s.swimmer_id))
    stampUnpaid = stampUnpaidIds.size
    stampPaid = pointCardIds.length - stampUnpaid
  }

  const paid = subscriptionPaid + stampPaid

  return { data: { paid, subscriptionUnpaid, stampUnpaid, total } }
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
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  // 自分自身のロール変更禁止（管理者が自分を降格するのを防ぐ）
  if (swimmerId === user.id && data.role !== "admin") {
    return { error: "自分自身のロールは変更できません" }
  }

  // 最後の管理者を降格しようとしていないかチェック（管理者→一般への変更のみ対象）
  if (data.role === "member") {
    const { data: current } = await admin
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("swimmer_id", swimmerId)
      .single()
    if (current?.role === "admin") {
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
  }

  const updateData: Record<string, unknown> = {
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

  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

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

// 認証不要・公開向けグループ詳細取得
export async function getPublicTeam(teamId: string) {
  const admin = createAdminClient()

  const { data: team, error } = await admin
    .from("teams")
    .select("id, name, description, avatar_url, cover_image_url, is_recruiting, activity_area, practice_frequency, practice_days, main_pool, status, has_annual_fee, has_monthly_fee, has_point_card, annual_fee_amount, monthly_fee_amount, point_card_count, point_card_price, contact_email, contact_phone")
    .eq("id", teamId)
    .eq("status", "active")
    .single()

  if (error || !team) return { error: "グループが見つかりません" }

  // 管理者プロフィール
  const { data: adminMember } = await admin
    .from("team_members")
    .select("swimmer:profiles(id, name, avatar_url, bio, career, achievements, prefectures)")
    .eq("team_id", teamId)
    .eq("role", "admin")
    .eq("status", "active")
    .single()

  // メンバー数
  const { count: memberCount } = await admin
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("status", "active")

  // 直近の公開セッション
  const { data: sessions } = await admin
    .from("practice_sessions")
    .select("id, title, scheduled_at, location, member_price, guest_price, type")
    .eq("team_id", teamId)
    .eq("status", "published")
    .gt("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5)

  // Supabase の外部キー結合は配列で返る場合があるため正規化
  const rawSwimmer = adminMember?.swimmer as unknown
  const coach: Record<string, unknown> | null = Array.isArray(rawSwimmer)
    ? ((rawSwimmer[0] as Record<string, unknown>) ?? null)
    : ((rawSwimmer as Record<string, unknown>) ?? null)

  return {
    data: {
      team,
      coach,
      memberCount: memberCount ?? 0,
      sessions: sessions ?? [],
    },
  }
}
