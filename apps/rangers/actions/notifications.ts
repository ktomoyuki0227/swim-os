"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function getMyNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) return { error: "既読の更新に失敗しました" }
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { error: "既読の更新に失敗しました" }
  return { success: true }
}

// 内部専用: Server Action としてexportしない（任意ユーザーへの通知注入を防ぐ）
// 他ユーザーへの INSERT は RLS をバイパスする service_role クライアントを使用
async function createNotification(
  userId: string,
  data: { type: string; title: string; body?: string; link?: string }
) {
  const supabase = createAdminClient()

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: data.type,
    title: data.title,
    body: data.body || null,
    link: data.link || null,
  })

  if (error) return { error: "通知の作成に失敗しました" }
  return { success: true }
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { count: 0 }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) return { count: 0 }
  return { count: count || 0 }
}
