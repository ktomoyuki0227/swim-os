"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { announcementSchema } from "@/lib/validations"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { notifyUsers } from "@/lib/notifications"

export async function createAnnouncement(teamId: string, data: unknown) {
  const parsed = announcementSchema.safeParse(data)
  if (!parsed.success) return { error: "入力値が不正です" }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // admin権限チェック（team_members は RLS バイパスが必要）
  const adminClient = createAdminClient()
  if (!(await isTeamAdmin(adminClient, teamId, user.id))) return { error: "権限がありません" }

  const { data: announcement, error } = await adminClient
    .from("announcements")
    .insert({
      team_id: teamId,
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body || null,
      image_url: parsed.data.image_url || null,
      link_url: parsed.data.link_url || null,
      target_tags: parsed.data.target_tags,
    })
    .select()
    .single()

  if (error) return { error: "お知らせの作成に失敗しました" }

  // チームの全メンバー（管理者除く）に個別通知を送信
  const { data: members } = await adminClient
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", teamId)
    .eq("status", "active")
    .neq("swimmer_id", user.id)
  if (members && members.length > 0) {
    await notifyUsers(members.map((m) => m.swimmer_id), {
      type: "team_announcement",
      title: parsed.data.title,
      body: parsed.data.body || null,
      team_id: teamId,
      link: `/teams/${teamId}`,
    })
  }

  revalidatePath("/teams")
  revalidatePath("/notifications")
  return { data: announcement }
}

export async function getTeamAnnouncements(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("announcements")
    .select("*, author:profiles(id, name, avatar_url)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })

  if (error) return { data: [] }

  // 既読状態を付与
  if (user && data) {
    const { data: reads } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", user.id)

    const readIds = new Set(reads?.map((r) => r.announcement_id) || [])

    return {
      data: data.map((a) => ({
        ...a,
        is_read: readIds.has(a.id),
      })),
    }
  }

  return { data: data || [] }
}

export async function getAnnouncementReads(announcementId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // お知らせのチームIDを取得してadmin権限チェック
  const { data: announcement } = await supabase
    .from("announcements")
    .select("team_id")
    .eq("id", announcementId)
    .single()

  if (!announcement) return { data: [] }

  const admin2 = createAdminClient()
  if (!(await isTeamAdmin(admin2, announcement.team_id, user.id))) return { error: "権限がありません" }

  const { data, error } = await supabase
    .from("announcement_reads")
    .select("*, user:profiles(id, name, avatar_url)")
    .eq("announcement_id", announcementId)
    .order("read_at", { ascending: true })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function markAnnouncementRead(announcementId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const { error } = await supabase
    .from("announcement_reads")
    .upsert(
      { announcement_id: announcementId, user_id: user.id },
      { onConflict: "announcement_id,user_id" }
    )

  if (error) return { error: "既読の記録に失敗しました" }

  revalidatePath("/teams")
  return { success: true }
}

export async function getUnreadAnnouncementCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { count: 0 }

  // 自分が所属するチームのお知らせ（team_members は RLS バイパスが必要）
  const admin3 = createAdminClient()
  const { data: memberships } = await admin3
    .from("team_members")
    .select("team_id")
    .eq("swimmer_id", user.id)
    .eq("status", "active")

  if (!memberships || memberships.length === 0) return { count: 0 }

  const teamIds = memberships.map((m) => m.team_id)

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id")
    .in("team_id", teamIds)

  if (!announcements || announcements.length === 0) return { count: 0 }

  const { data: reads } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", user.id)

  const readIds = new Set(reads?.map((r) => r.announcement_id) || [])
  const unreadCount = announcements.filter((a) => !readIds.has(a.id)).length

  return { count: unreadCount }
}
