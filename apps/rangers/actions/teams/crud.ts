"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { teamSchema, teamUpdateSchema } from "@/lib/validations"
import { isValidImageFile } from "@/lib/file-validation"
import type { MembershipType, SessionType, TeamStatus } from "@/types/database"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { notifyUser, notifyUsers } from "@/lib/notifications"
import { syncActiveSubscriptionsToNewPrice } from "@/actions/subscriptions"
import { isRateLimited } from "@/lib/rate-limit"

// PostgRESTの .not("id", "in", "(...)")  に渡す文字列結合前のUUID形式バリデーション用
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const TEAM_IMAGE_UPLOAD_RATE_LIMIT = 10
const TEAM_IMAGE_UPLOAD_RATE_WINDOW_MS = 60 * 1000

export async function uploadTeamImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  if (isRateLimited(`upload_team_image:${user.id}`, TEAM_IMAGE_UPLOAD_RATE_LIMIT, TEAM_IMAGE_UPLOAD_RATE_WINDOW_MS)) {
    return { error: "アップロードが多すぎます。しばらく時間をおいてから再度お試しください" }
  }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return { error: "ファイルを選択してください" }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) return { error: "JPEG・PNG・WebP形式のみアップロードできます" }
  if (file.size > 5 * 1024 * 1024) return { error: "ファイルサイズは5MB以下にしてください" }
  // file.type はクライアント申告値（偽装可能）のため、実バイト列のマジックナンバーで検証する
  if (!(await isValidImageFile(file, file.type))) {
    return { error: "ファイルの内容が画像形式として不正です" }
  }

  // type はストレージオブジェクトキーに直接使うため、任意文字列を受け付けず固定の2値に限定する
  const type = formData.get("type") === "icon" ? "icon" : "cover"
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
      team_type: parsed.data.team_type ?? "team",
      instructor_title: parsed.data.instructor_title || null,
      show_member_count: parsed.data.show_member_count ?? true,
    })
    .select()
    .single()

  if (error) {
    return { error: "グループの作成に失敗しました" }
  }

  // 作成者を admin として追加（失敗時はグループごと削除してロールバック）
  // 管理者の会員種別: チームの料金体系に合わせて設定
  const adminMembershipType: MembershipType =
    team.has_annual_fee && !team.has_monthly_fee ? "annual" : "monthly"
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

  // チーム作成ウェルカム通知（RLS で INSERT が blocked されるため adminClient を使用）
  await notifyUser(user.id, {
    type: "team_created",
    title: `「${team.name}」を作成しました`,
    body: "メンバーを招待してセッションを追加しましょう",
    team_id: team.id,
    link: `/teams/${team.id}`,
  })

  revalidatePath("/teams")
  revalidatePath("/notifications")
  return { data: team }
}

export async function updateTeam(teamId: string, data: unknown) {
  const parsed = teamUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  // 会費変更時、既存会員への価格同期が必要かどうかを判定するため、更新前の値を取得
  const { data: beforeUpdate } = await admin
    .from("teams")
    .select("name, monthly_fee_amount, annual_fee_amount, stripe_product_id, stripe_monthly_price_id")
    .eq("id", teamId)
    .single()

  const { error } = await admin
    .from("teams")
    .update(parsed.data)
    .eq("id", teamId)

  if (error) return { error: "グループ情報の更新に失敗しました" }

  // 月謝額が変更された場合、既にアクティブなStripe Subscriptionを全て新価格に切り替える。
  // 値上げ・値下げのたびにチームを作り直す必要がないようにするための仕組み。
  if (
    beforeUpdate &&
    parsed.data.monthly_fee_amount !== undefined &&
    parsed.data.monthly_fee_amount !== beforeUpdate.monthly_fee_amount &&
    parsed.data.monthly_fee_amount > 0
  ) {
    await syncActiveSubscriptionsToNewPrice(
      admin,
      teamId,
      beforeUpdate.name,
      parsed.data.monthly_fee_amount,
      beforeUpdate.stripe_product_id,
      beforeUpdate.stripe_monthly_price_id
    ).catch((err) => {
      console.error("[updateTeam] syncActiveSubscriptionsToNewPrice failed:", err)
    })
  }

  // 年会費額が変更された場合、今年分の未払いレコードのみ新金額に更新する
  // (既に支払い済みのレコードは過去の実績として変更しない)
  if (
    beforeUpdate &&
    parsed.data.annual_fee_amount !== undefined &&
    parsed.data.annual_fee_amount !== beforeUpdate.annual_fee_amount &&
    parsed.data.annual_fee_amount > 0
  ) {
    const currentYear = new Date().getFullYear().toString()
    const { data: updatedFees } = await admin
      .from("membership_fees")
      .update({ amount: parsed.data.annual_fee_amount })
      .eq("team_id", teamId)
      .eq("type", "annual")
      .eq("period", currentYear)
      .eq("status", "unpaid")
      .select("swimmer_id")

    if (updatedFees && updatedFees.length > 0) {
      await notifyUsers(updatedFees.map((f) => f.swimmer_id), {
        type: "fee_amount_changed",
        title: "年会費額が変更されました",
        body: `${currentYear}年度の年会費が¥${parsed.data.annual_fee_amount.toLocaleString()}に変更されました`,
        team_id: teamId,
        link: "/payments",
      })
    }
  }

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
  return {
    data: {
      ...team,
      practice_days: team.practice_days ?? [],
      default_member_price: team.default_member_price ?? 0,
      default_guest_price: team.default_guest_price ?? 0,
      cancellation_days: team.cancellation_days ?? 3,
      point_card_count: team.point_card_count ?? 10,
      status: team.status as TeamStatus,
    },
  }
}

export async function getPublicTeams(options?: {
  q?: string
  excludeUserId?: string
  teamType?: "team" | "personal"
  sort?: "newest" | "name"
  recruitingOnly?: boolean
  days?: string[]
}) {
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
    .select("id, name, description, avatar_url, coach_id, team_type, is_recruiting, activity_area, practice_frequency, practice_days, main_pool, default_guest_price, coach:profiles!coach_id(name, avatar_url)")
    .eq("status", "active")
    .limit(50)

  if (options?.sort === "name") {
    query = query.order("name", { ascending: true })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  if (options?.q) {
    query = query.ilike("name", `%${options.q}%`)
  }

  if (options?.teamType) {
    query = query.eq("team_type", options.teamType)
  }

  if (options?.recruitingOnly) {
    query = query.eq("is_recruiting", true)
  }

  if (options?.days && options.days.length > 0) {
    query = query.overlaps("practice_days", options.days)
  }

  if (excludeIds.length > 0) {
    // .not("id", "in", ...) はPostgREST生シンタックスの文字列を要求し配列を直接渡せないため、
    // 各IDがUUID形式であることを検証してから文字列結合する（不正な値の混入を防ぐ）
    const validExcludeIds = excludeIds.filter((id) => UUID_REGEX.test(id))
    if (validExcludeIds.length > 0) {
      query = query.not("id", "in", `(${validExcludeIds.join(",")})`)
    }
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
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

  // gen_random_uuid はpublicスキーマの公開RPCとして定義されていないため
  // Node標準のcrypto.randomUUID()を使う
  const newInviteCode = crypto.randomUUID()

  const { error: updateError } = await admin
    .from("teams")
    .update({ invite_code: newInviteCode })
    .eq("id", teamId)

  if (updateError) return { error: "招待コードの更新に失敗しました" }

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

// 認証不要・公開向けグループ詳細取得
export async function getPublicTeam(teamId: string) {
  const admin = createAdminClient()

  const { data: team, error } = await admin
    .from("teams")
    .select("id, name, description, avatar_url, cover_image_url, is_recruiting, show_member_count, activity_area, practice_frequency, practice_days, main_pool, status, has_annual_fee, has_monthly_fee, has_point_card, annual_fee_amount, monthly_fee_amount, point_card_count, point_card_price, contact_email, contact_phone")
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
      team: { ...team, practice_days: team.practice_days ?? [] },
      coach,
      memberCount: memberCount ?? 0,
      sessions: (sessions ?? []).map((s) => ({ ...s, type: s.type as SessionType })),
    },
  }
}
