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
  const rows = userIds.map((userId) => ({
    user_id: userId,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
    link: data.link ?? null,
    team_id: data.team_id ?? null,
    metadata: data.metadata ?? {},
  }))
  const { error } = await admin.from("notifications").insert(rows)
  if (!error) return { error: null }

  console.error("[notifyUsers] batch insert failed, retrying individually:", error)
  // 1件のバッチINSERTは1行でも制約違反(存在しないuser_id等)があると全体が失敗するため、
  // 全員への通知が失われないよう1件ずつ再送する（他の受信者への影響を切り離す）。
  // 各行のINSERTは互いに独立しているため、直列awaitではなく並列実行する
  const results = await Promise.all(
    rows.map((row) => admin.from("notifications").insert(row))
  )
  let failedCount = 0
  results.forEach(({ error: rowError }, i) => {
    if (rowError) {
      failedCount++
      console.error(`[notifyUsers] individual insert failed for user ${rows[i].user_id}:`, rowError)
    }
  })
  return { error: failedCount > 0 ? "通知の作成に失敗しました" : null }
}
