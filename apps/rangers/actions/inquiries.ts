"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function sendInquiry(
  teamId: string,
  message: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (!UUID_REGEX.test(teamId)) {
    return { error: "グループIDが不正です" }
  }

  const trimmed = message.trim()
  if (!trimmed || trimmed.length > 1000) {
    return { error: "メッセージを1〜1000文字で入力してください" }
  }

  const admin = createAdminClient()

  // 既存メンバーはグループ内で直接コミュニケーションできるため問い合わせ不要
  const { data: existingMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (existingMembership) {
    return { error: "既にこのグループのメンバーです" }
  }

  const [teamResult, profileResult, adminsResult] = await Promise.all([
    admin.from("teams").select("name").eq("id", teamId).single(),
    admin.from("profiles").select("name").eq("id", user.id).single(),
    admin
      .from("team_members")
      .select("swimmer_id")
      .eq("team_id", teamId)
      .eq("role", "admin")
      .eq("status", "active"),
  ])

  if (!teamResult.data) return { error: "グループが見つかりません" }

  const senderName = profileResult.data?.name ?? "新しいユーザー"
  const preview = trimmed.length > 100 ? `${trimmed.slice(0, 100)}…` : trimmed

  if (adminsResult.data && adminsResult.data.length > 0) {
    const { error: notifyError } = await admin.from("notifications").insert(
      adminsResult.data.map((a) => ({
        user_id: a.swimmer_id,
        type: "inquiry_received",
        title: `${teamResult.data.name}へのお問い合わせが届きました`,
        body: `${senderName}さん: ${preview}`,
        team_id: teamId,
        metadata: { sender_id: user.id, message: trimmed },
      }))
    )
    if (notifyError) {
      console.error("inquiry notification insert failed", notifyError)
    }
  }

  return { success: true }
}
