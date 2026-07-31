"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { templateSchema, templateUpdateSchema } from "@/lib/validations"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { toJstEndOfDayIso } from "@/lib/format-date"

export async function saveAsTemplate(sessionId: string, name: string) {
  const parsed = templateSchema.safeParse({ name })
  if (!parsed.success) return { error: "テンプレート名を確認してください" }
  name = parsed.data.name

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: session, error: sessionError } = await admin
    .from("practice_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) return { error: "セッションが見つかりません" }

  if (!(await isTeamAdmin(admin, session.team_id, user.id))) {
    return { error: "権限がありません" }
  }

  // deadline_days: 開催日から何日前を申込み締切とするかをテンプレートに保存する。
  // テンプレートには具体的なscheduled_atがないため、相対日数で持っておき
  // createSessionFromTemplateで新しいscheduled_atから締切日を再計算する。
  // registration_deadlineがscheduled_at以降になっている不整合なセッション(サーバー側では
  // 順序を強制していない)からコピーされた場合でも負値にならないよう下限を0に固定する。
  // 負値のまま保存すると、createSessionFromTemplate側の
  // `deadline.setDate(deadline.getDate() - template.deadline_days)` が符号反転し、
  // 新しいセッションの締切が開催日より後になってしまう。
  const deadlineDays = session.registration_deadline
    ? Math.max(
        0,
        Math.round(
          (new Date(session.scheduled_at).getTime() - new Date(session.registration_deadline).getTime()) /
            (24 * 60 * 60 * 1000)
        )
      )
    : null

  const { data: template, error } = await admin
    .from("session_templates")
    .insert({
      team_id: session.team_id,
      name,
      title: session.title,
      description: session.description,
      content: session.content,
      type: session.type,
      location: session.location,
      member_price: session.member_price,
      guest_price: session.guest_price,
      deadline_days: deadlineDays,
      min_participants: session.min_participants,
      max_participants: session.max_participants,
      course_rules: session.course_rules,
      target_tags: session.target_tags,
      allow_point_card: session.allow_point_card,
      is_external: session.is_external,
    })
    .select()
    .single()

  if (error) return { error: "テンプレートの保存に失敗しました" }

  revalidatePath("/sessions")
  return { data: template }
}

export async function getTeamTemplates(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  if (!(await isTeamAdmin(admin, teamId, user.id))) return { data: [] }

  const { data, error } = await admin
    .from("session_templates")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function getTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data, error } = await admin
    .from("session_templates")
    .select("*")
    .eq("id", templateId)
    .single()
  if (error || !data) return { data: null }

  if (!(await isTeamAdmin(admin, data.team_id, user.id))) return { data: null }

  return { data }
}

export async function updateTemplate(
  templateId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const parsed = templateUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const admin = createAdminClient()

  const { data: tmpl } = await admin
    .from("session_templates")
    .select("team_id")
    .eq("id", templateId)
    .single()
  if (!tmpl) return { error: "テンプレートが見つかりません" }

  if (!(await isTeamAdmin(admin, tmpl.team_id, user.id))) {
    return { error: "権限がありません" }
  }

  const { error } = await admin
    .from("session_templates")
    .update(parsed.data)
    .eq("id", templateId)

  if (error) return { error: "テンプレートの更新に失敗しました" }

  revalidatePath("/sessions")
  return { success: true }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: tmpl } = await admin
    .from("session_templates")
    .select("team_id")
    .eq("id", templateId)
    .single()
  if (!tmpl) return { error: "テンプレートが見つかりません" }

  if (!(await isTeamAdmin(admin, tmpl.team_id, user.id))) {
    return { error: "権限がありません" }
  }

  const { error } = await admin
    .from("session_templates")
    .delete()
    .eq("id", templateId)

  if (error) return { error: "テンプレートの削除に失敗しました" }

  revalidatePath("/sessions")
  return { success: true }
}

export async function createSessionFromTemplate(
  templateId: string,
  scheduledAt: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  const { data: template } = await admin
    .from("session_templates")
    .select("*")
    .eq("id", templateId)
    .single()

  if (!template) return { error: "テンプレートが見つかりません" }

  if (!(await isTeamAdmin(admin, template.team_id, user.id))) {
    return { error: "権限がありません" }
  }

  let registrationDeadline: string | null = null
  if (template.deadline_days) {
    const deadline = new Date(scheduledAt)
    deadline.setDate(deadline.getDate() - template.deadline_days)
    registrationDeadline = toJstEndOfDayIso(deadline.toISOString())
  }

  const { data: session, error } = await admin
    .from("practice_sessions")
    .insert({
      team_id: template.team_id,
      coach_id: user.id,
      title: template.title,
      description: template.description,
      content: template.content,
      type: template.type,
      scheduled_at: scheduledAt,
      location: template.location,
      member_price: template.member_price ?? 0,
      guest_price: template.guest_price ?? 0,
      registration_deadline: registrationDeadline,
      min_participants: template.min_participants,
      max_participants: template.max_participants,
      course_rules: template.course_rules,
      target_tags: template.target_tags,
      allow_point_card: template.allow_point_card,
      is_external: template.is_external,
    })
    .select()
    .single()

  if (error) return { error: "セッションの作成に失敗しました" }

  revalidatePath("/sessions")
  return { data: session }
}
