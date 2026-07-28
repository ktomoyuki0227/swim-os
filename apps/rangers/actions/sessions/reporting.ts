"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { CompetitionField } from "@/types/database"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"

export async function exportSessionRegistrations(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const exportAdmin = createAdminClient()
  const { data: session } = await exportAdmin
    .from("practice_sessions")
    .select("team_id, title, type, competition_fields")
    .eq("id", sessionId)
    .single()

  if (!session) return { error: "セッションが見つかりません" }

  // admin権限チェック
  if (!(await isTeamAdmin(exportAdmin, session.team_id, user.id))) return { error: "権限がありません" }

  // adminClientで全参加者を取得（user clientはRLSで自分の登録しか見えない）
  const { data: registrations } = await exportAdmin
    .from("session_registrations")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)
    .order("registered_at", { ascending: true })

  if (!registrations) return { error: "参加者情報の取得に失敗しました" }

  const fields: CompetitionField[] = (session.competition_fields as unknown as CompetitionField[]) || []

  // CSV生成
  const headers = ["名前", "メンバー/ゲスト", "支払方法", "支払状態"]
  fields.forEach((f) => headers.push(f.label))

  const rows = registrations.map((reg) => {
    const swimmer = reg.swimmer as Record<string, unknown> | null
    const entry = (reg.competition_entry || {}) as Record<string, unknown>
    const row = [
      (swimmer?.name as string) || "不明",
      reg.is_member ? "メンバー" : "ゲスト",
      reg.payment_method === "stripe" ? "カード" : reg.payment_method === "point_card" ? "回数券" : "現金",
      reg.payment_status,
    ]
    fields.forEach((f) => row.push(String(entry[f.key] || "")))
    return row
  })

  // セル先頭が =+-@ の場合、Excel等が数式として解釈しうる（CSVインジェクション対策）
  const sanitizeCsvCell = (value: string) => (/^[=+\-@]/.test(value) ? `'${value}` : value)

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${sanitizeCsvCell(String(cell)).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  // BOM付きUTF-8 CSV
  const bom = "\uFEFF"
  return { data: bom + csvContent, filename: `${session.title}_参加者.csv` }
}

export async function recordPriceView(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase.from("price_views").insert({
    session_id: sessionId,
    viewer_id: user.id,
  })

  return { success: true }
}

export async function getPriceViewers(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [] }

  const priceAdmin = createAdminClient()

  // admin権限チェック（adminClientでRLS自己参照をバイパス）
  const { data: session } = await priceAdmin
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session) return { data: [] }

  if (!(await isTeamAdmin(priceAdmin, session.team_id, user.id))) return { error: "権限がありません", data: [] }

  const { data, error } = await priceAdmin
    .from("price_views")
    .select("*, viewer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .order("viewed_at", { ascending: false })

  if (error) return { data: [] }
  return { data: data || [] }
}

export async function getSessionRegistrations(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], count: 0 }

  const regAdmin = createAdminClient()

  // セッションのグループIDを取得してadmin権限チェック（adminClientでRLSバイパス）
  const { data: session } = await regAdmin
    .from("practice_sessions")
    .select("team_id")
    .eq("id", sessionId)
    .maybeSingle()
  if (!session) return { data: [], count: 0 }

  if (!(await isTeamAdmin(regAdmin, session.team_id, user.id))) return { error: "権限がありません", data: [], count: 0 }

  // adminClientで全参加者を取得（user clientはRLSで自分の登録しか見えない）
  const { data, error } = await regAdmin
    .from("session_registrations")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .order("registered_at", { ascending: true })

  if (error) return { data: [], count: 0 }
  const activeCount = data?.filter((r) => !r.cancelled_at).length || 0
  return { data: data || [], count: activeCount }
}
