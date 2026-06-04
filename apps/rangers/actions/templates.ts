"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { templateUpdateSchema } from "@/lib/validations"

export async function saveAsTemplate(sessionId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // practice_sessions・team_members ともに RLS 自己参照問題があるため adminClient で統一
  const admin = createAdminClient()

  const { data: session, error: sessionError } = await admin
    .from("practice_sessions")
    .select("*")
    .eq("id", sessionId)
    .single()

  if (sessionError || !session) return { error: "セッションが見つかりません" }

  // admin権限チェック（adminClient で RLS バイパス）
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", session.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { data: template, error } = await supabase
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
      deadline_days: session.cancellation_days,
      min_participants: session.min_participants,
      max_participants: session.max_participants,
      course_rules: session.course_rules,
      target_tags: session.target_tags,
      allow_point_card: session.allow_point_card,
      cancellation_days: session.cancellation_days,
      is_external: session.is_external,
    })
    .select()
    .single()

  if (error) return { error: "テンプレートの保存に失敗しました" }

  revalidatePath("/instructor/sessions")
  return { data: template }
}

export async function getTeamTemplates(teamId: string) {
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
  if (!adminMembership) return { data: [] }

  const { data, error } = await supabase
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

  const { data, error } = await supabase
    .from("session_templates")
    .select("*")
    .eq("id", templateId)
    .single()
  if (error) return { data: null }

  // 取得したテンプレートのチームのadminか確認
  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", data.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { data: null }

  return { data }
}

export async function updateTemplate(
  templateId: string,
  data: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 入力値のZod検証（任意カラムへの書き込みを防ぐ）
  const parsed = templateUpdateSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const { data: tmpl } = await supabase
    .from("session_templates")
    .select("team_id")
    .eq("id", templateId)
    .single()
  if (!tmpl) return { error: "テンプレートが見つかりません" }

  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", tmpl.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await supabase
    .from("session_templates")
    .update(parsed.data)
    .eq("id", templateId)

  if (error) return { error: "テンプレートの更新に失敗しました" }

  revalidatePath("/instructor/sessions")
  return { success: true }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: tmpl } = await supabase
    .from("session_templates")
    .select("team_id")
    .eq("id", templateId)
    .single()
  if (!tmpl) return { error: "テンプレートが見つかりません" }

  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", tmpl.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { error } = await supabase
    .from("session_templates")
    .delete()
    .eq("id", templateId)

  if (error) return { error: "テンプレートの削除に失敗しました" }

  revalidatePath("/instructor/sessions")
  return { success: true }
}

export async function createSessionFromTemplate(
  templateId: string,
  scheduledAt: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: template } = await supabase
    .from("session_templates")
    .select("*")
    .eq("id", templateId)
    .single()

  if (!template) return { error: "テンプレートが見つかりません" }

  // admin権限チェック
  const { data: adminMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", template.team_id)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  // 締め切り日時を計算
  let registrationDeadline: string | null = null
  if (template.deadline_days) {
    const deadline = new Date(scheduledAt)
    deadline.setDate(deadline.getDate() - template.deadline_days)
    registrationDeadline = deadline.toISOString()
  }

  const { data: session, error } = await supabase
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
      member_price: template.member_price,
      guest_price: template.guest_price,
      registration_deadline: registrationDeadline,
      min_participants: template.min_participants,
      max_participants: template.max_participants,
      course_rules: template.course_rules,
      target_tags: template.target_tags,
      cancellation_days: template.cancellation_days,
      allow_point_card: template.allow_point_card,
      is_external: template.is_external,
    })
    .select()
    .single()

  if (error) return { error: "セッションの作成に失敗しました" }

  revalidatePath("/instructor/sessions")
  return { data: session }
}
