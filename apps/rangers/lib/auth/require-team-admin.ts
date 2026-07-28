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

/**
 * 指定チームの有効なメンバー(role不問、status="active")かどうかを判定する。
 * admin専用操作ではなく「メンバーなら誰でも閲覧可」なチェックに使う。
 */
export async function isTeamMember(
  admin: AdminClient,
  teamId: string,
  userId: string
): Promise<boolean> {
  const { data } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", userId)
    .eq("status", "active")
    .single()
  return !!data
}

/**
 * 指定チームの有効な管理者(role="admin", status="active")のswimmer_id一覧を取得する。
 * 通知送信先の組み立てでactions/配下に多数コピペされていたクエリをここに集約する。
 * excludeUserId を渡すと、その本人（多くの場合は操作した管理者自身）を除外する。
 */
export async function getActiveTeamAdminIds(
  admin: AdminClient,
  teamId: string,
  excludeUserId?: string
): Promise<string[]> {
  let query = admin
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", teamId)
    .eq("role", "admin")
    .eq("status", "active")

  if (excludeUserId) {
    query = query.neq("swimmer_id", excludeUserId)
  }

  const { data } = await query
  return (data ?? []).map((m) => m.swimmer_id)
}

/**
 * 呼び出し元(callerId)が、対象スイマー(targetSwimmerId)が所属するいずれかの
 * チームの有効な管理者であるかを判定する。teamId を受け取らず対象ユーザーのみで
 * 認可判定したい場合（例: getMemberFees）に使う。
 */
export async function isAdminOfAnyTeamWithMember(
  admin: AdminClient,
  targetSwimmerId: string,
  callerId: string
): Promise<boolean> {
  const { data: adminTeams } = await admin
    .from("team_members")
    .select("team_id")
    .eq("swimmer_id", callerId)
    .eq("role", "admin")
    .eq("status", "active")

  if (!adminTeams || adminTeams.length === 0) return false

  const adminTeamIds = adminTeams.map((t) => t.team_id)

  const { data: targetMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("swimmer_id", targetSwimmerId)
    .in("team_id", adminTeamIds)
    .eq("status", "active")
    .single()

  return !!targetMembership
}
