import { createAdminClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database-generated"

export interface NotifyData {
  type: string
  title: string
  body?: string | null
  link?: string | null
  team_id?: string | null
  metadata?: Json
}

/**
 * 通知INSERTの共通ヘルパー。
 * "use server" ファイルでexportするとServer Action化され任意のクライアントから
 * 直接呼び出せてしまう（=呼び出し元の権限チェックをバイパスして他ユーザーに通知注入できる）ため、
 * 通常のモジュールとして提供し、各actions側で権限チェック後にサーバー内部から呼び出す。
 */
export async function notifyUser(userId: string, data: NotifyData) {
  const admin = createAdminClient()
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
    link: data.link ?? null,
    team_id: data.team_id ?? null,
    metadata: data.metadata ?? {},
  })
  if (error) console.error("[notifyUser] insert failed:", error)
  return { error: error ? "通知の作成に失敗しました" : null }
}

/** 複数ユーザーへ同一内容の通知をまとめて送る */
export async function notifyUsers(userIds: string[], data: NotifyData) {
  if (userIds.length === 0) return { error: null }
  const admin = createAdminClient()
  const { error } = await admin.from("notifications").insert(
    userIds.map((userId) => ({
      user_id: userId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      link: data.link ?? null,
      team_id: data.team_id ?? null,
      metadata: data.metadata ?? {},
    }))
  )
  if (error) console.error("[notifyUsers] insert failed:", error)
  return { error: error ? "通知の作成に失敗しました" : null }
}
