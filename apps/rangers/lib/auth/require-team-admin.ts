import type { createAdminClient } from "@/lib/supabase/server"

type AdminClient = ReturnType<typeof createAdminClient>

/**
 * 指定チームの有効な管理者(role="admin", status="active")かどうかを判定する。
 * actions/ 配下で同一のチェックが多数コピペされていたのをここに集約する。
 * adminClient(service role)を受け取り、呼び出し元のクライアント管理はそのまま維持する。
 */
export async function isTeamAdmin(
  admin: AdminClient,
  teamId: string,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", userId)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  return !!data
}
