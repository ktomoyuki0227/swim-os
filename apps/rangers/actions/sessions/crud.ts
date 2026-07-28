"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sessionSchema, sessionUpdateSchema } from "@/lib/validations"
import { isTeamAdmin, isTeamMember } from "@/lib/auth/require-team-admin"
import { notifyUsers } from "@/lib/notifications"

export async function createSession(teamId: string, data: unknown) {
  const parsed = sessionSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // admin権限チェック（adminClientでRLSをバイパス）
  const adminClient = createAdminClient()
  if (!(await isTeamAdmin(adminClient, teamId, user.id))) return { error: "権限がありません" }

  // RLS の自己参照ポリシーをバイパスするため adminClient で INSERT
  const { data: session, error } = await adminClient
    .from("practice_sessions")
    .insert({
      team_id: teamId,
      coach_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      content: parsed.data.content || null,
      type: parsed.data.type,
      scheduled_at: new Date(parsed.data.scheduled_at + '+09:00').toISOString(),
      end_at: parsed.data.end_at ? new Date(parsed.data.end_at + '+09:00').toISOString() : null,
      location: parsed.data.location,
      meeting_point: parsed.data.meeting_point || null,
      gender_filter: parsed.data.gender_filter || "all",
      member_price: parsed.data.member_price,
      guest_price: parsed.data.guest_price,
      registration_deadline: parsed.data.registration_deadline
        ? new Date(parsed.data.registration_deadline + '+09:00').toISOString()
        : null,
      min_participants: parsed.data.min_participants || null,
      max_participants: parsed.data.max_participants || null,
      course_rules: parsed.data.course_rules || null,
      target_tags: parsed.data.target_tags,
      target_members: parsed.data.target_members || null,
      cancellation_days: parsed.data.cancellation_days || null,
      allow_point_card: parsed.data.allow_point_card,
      is_external: parsed.data.is_external,
      competition_fields: parsed.data.competition_fields || null,
    })
    .select()
    .single()

  if (error) return { error: `セッションの作成に失敗しました: ${error.message}` }

  // チームの全メンバー（管理者除く）に新規セッション通知
  const { data: members } = await adminClient
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", teamId)
    .eq("status", "active")
    .neq("role", "admin")
  if (members && members.length > 0) {
    const scheduledDate = new Date(session.scheduled_at).toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Tokyo",
    })
    try {
      const { error: notifError } = await notifyUsers(
        members.map((m) => m.swimmer_id),
        {
          type: "session_added",
          title: `新しいセッションが追加されました`,
          body: `「${session.title}」${scheduledDate}`,
          team_id: teamId,
          link: `/teams/${teamId}/sessions/${session.id}`,
        }
      )
      if (notifError) console.error("[createSession] notification insert failed:", notifError)
    } catch (err) {
      console.error("[createSession] notification insert threw:", err)
    }
  }

  revalidatePath("/sessions")
  revalidatePath("/notifications")
  return { data: session }
}

export async function updateSession(sessionId: string, data: unknown) {
  const parsed = sessionUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const updateAdmin = createAdminClient()
  const { data: session } = await updateAdmin
    .from("practice_sessions")
    .select("team_id, session_status, title, scheduled_at, location")
    .eq("id", sessionId)
    .single()
  if (!session) return { error: "セッションが見つかりません" }

  if (!(await isTeamAdmin(updateAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  // 開催確定済みセッションの料金変更を禁止
  // （確定後は Stripe PI の決済済み金額と乖離するため）
  const updateData = { ...parsed.data }
  if (session.session_status === "confirmed") {
    delete updateData.member_price
    delete updateData.guest_price
  }
  // datetime-local値はタイムゾーン情報がないためJSTとして解釈してUTCに変換
  if (updateData.scheduled_at) {
    updateData.scheduled_at = new Date(updateData.scheduled_at + '+09:00').toISOString()
  }
  if (updateData.end_at) {
    updateData.end_at = new Date(updateData.end_at + '+09:00').toISOString()
  }
  if (updateData.registration_deadline) {
    updateData.registration_deadline = new Date(updateData.registration_deadline + '+09:00').toISOString()
  }

  // adminClientでRLSをバイパスして更新（user clientだとサイレントブロックの可能性あり）
  const { error } = await updateAdmin
    .from("practice_sessions")
    .update(updateData)
    .eq("id", sessionId)

  if (error) return { error: "セッションの更新に失敗しました" }

  // 日時・場所・タイトルが変更された場合、参加登録済みメンバーへ通知
  const hasImportantChange =
    (parsed.data.title && parsed.data.title !== session.title) ||
    (parsed.data.scheduled_at &&
      new Date(parsed.data.scheduled_at + '+09:00').toISOString() !== new Date(session.scheduled_at).toISOString()) ||
    (parsed.data.location && parsed.data.location !== session.location)

  if (hasImportantChange) {
    const { data: registrants } = await updateAdmin
      .from("session_registrations")
      .select("swimmer_id")
      .eq("session_id", sessionId)
      .is("cancelled_at", null)
    if (registrants && registrants.length > 0) {
      const sessionTitle = parsed.data.title ?? session.title
      await notifyUsers(registrants.map((r) => r.swimmer_id), {
        type: "session_updated",
        title: `「${sessionTitle}」の内容が変更されました`,
        body: "日時・場所などの情報が更新されています。ご確認ください",
        team_id: session.team_id,
        link: `/teams/${session.team_id}/sessions/${sessionId}`,
      })
    }
  }

  revalidatePath("/sessions")
  revalidatePath(`/sessions/${sessionId}`)
  revalidatePath("/notifications")
  return { success: true }
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const adminClient = createAdminClient()
  const { data: session } = await adminClient
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .single()
  if (!session) return { error: "セッションが見つかりません" }

  if (!(await isTeamAdmin(adminClient, session.team_id, user.id))) return { error: "権限がありません" }

  // 参加者がいるか確認
  const { data: registrations } = await adminClient
    .from("session_registrations")
    .select("id")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)

  if (registrations && registrations.length > 0) {
    return { error: `${registrations.length}名が参加登録済みです。先にセッションを中止してください。` }
  }

  const { error } = await adminClient
    .from("practice_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) return { error: "セッションの削除に失敗しました" }

  revalidatePath("/sessions")
  return { success: true }
}

export async function getTeamSessions(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [] }

  const admin = createAdminClient()
  if (!(await isTeamMember(admin, teamId, user.id))) return { data: [] }

  const { data, error } = await admin
    .from("practice_sessions")
    .select("*")
    .eq("team_id", teamId)
    .order("scheduled_at", { ascending: true })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function getPublicSessions(filters?: {
  tags?: string[]
  q?: string
  location?: string
  from?: string
  to?: string
  type?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from("practice_sessions")
    .select("*, team:teams(id, name, avatar_url)")
    .eq("is_external", true)
    .eq("status", "published")
    .eq("session_status", "open")
    .order("scheduled_at", { ascending: true })

  if (filters?.from) {
    query = query.gte("scheduled_at", filters.from)
  }
  if (filters?.to) {
    query = query.lte("scheduled_at", filters.to)
  }
  if (filters?.q) {
    query = query.ilike("title", `%${filters.q}%`)
  }
  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`)
  }

  if (filters?.type) {
    query = query.eq("type", filters.type)
  }

  const { data, error } = await query
  if (error) return { data: [] }

  // タグフィルタ（アプリ層）
  let filtered = data || []
  if (filters?.tags && filters.tags.length > 0) {
    filtered = filtered.filter((s) => {
      const sessionTags: string[] = (s.target_tags as string[]) || []
      if (sessionTags.length === 0) return true
      return filters.tags!.some((t) => sessionTags.includes(t))
    })
  }

  return { data: filtered }
}

export async function getSession(sessionId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("practice_sessions")
    .select("*, team:teams(*)")
    .eq("id", sessionId)
    .single()

  if (error || !data) return { error: "セッションが見つかりません" }

  // 外部公開セッション（ゲスト向け）はログイン不要で閲覧可能。
  // ただし匿名の閲覧者には team の全カラム（invite_code, stripe_account_id等の機微情報）を
  // 返してはならないため、公開して問題ない項目のみに絞る。
  if (data.is_external && data.status === "published") {
    const rawTeam = data.team as Record<string, unknown> | null
    const publicTeam = rawTeam
      ? {
          id: rawTeam.id,
          name: rawTeam.name,
          description: rawTeam.description,
          avatar_url: rawTeam.avatar_url,
        }
      : null
    return { data: { ...data, team: publicTeam } }
  }

  // それ以外は同じチームのアクティブなメンバーのみ閲覧可能
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "セッションが見つかりません" }
  if (!(await isTeamMember(admin, data.team_id, user.id))) return { error: "セッションが見つかりません" }

  return { data }
}
