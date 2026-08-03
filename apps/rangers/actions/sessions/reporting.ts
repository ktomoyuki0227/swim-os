"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { CompetitionField } from "@/types/database"
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { isRateLimited } from "@/lib/rate-limit"

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

  // adminClientで全参加者を取得（user clientはRLSで自分の登録しか見えない）。
  // max_participantsが未設定(無制限)のセッションもあるため、他の一覧クエリ
  // (getTeamMembers等)と同様にデータ増加に伴う無制限クエリを防ぐ安全上限を設ける
  const { data: registrations } = await exportAdmin
    .from("session_registrations")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .is("cancelled_at", null)
    .order("registered_at", { ascending: true })
    .limit(1000)

  if (!registrations) return { error: "参加者情報の取得に失敗しました" }

  // competition_fields は jsonb のため、DBの実データが不正な形の可能性を考慮し
  // 配列であることを実行時に確認してから扱う(他経路での書き込みミス等による
  // 実行時エラー・欠損を防ぐ)
  const rawCompetitionFields = session.competition_fields
  const fields: CompetitionField[] = Array.isArray(rawCompetitionFields)
    ? (rawCompetitionFields as unknown as CompetitionField[])
    : []

  // CSV生成
  const headers = ["名前", "メンバー/ゲスト", "支払方法", "支払状態"]
  fields.forEach((f) => headers.push(f.label))

  const rows = registrations.map((reg) => {
    const swimmer = reg.swimmer
    const entry = (reg.competition_entry || {}) as Record<string, unknown>
    const row = [
      swimmer?.name || "不明",
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

const PRICE_VIEW_RATE_LIMIT = 60
const PRICE_VIEW_RATE_WINDOW_MS = 60 * 1000

/**
 * 「料金を確認する」ボタン押下時に呼ばれ、閲覧記録の登録と価格の取得を
 * 単一のServer Actionにまとめて行う。
 * 以前はページ側からmemberPrice/guestPriceをクライアントコンポーネントへ
 * 無条件にpropsで渡していたため、RSC payload経由でボタンを押す前でも
 * 価格が読み取れてしまい、「閲覧＝管理者に通知」という設計が形骸化していた。
 * このアクションを呼ぶまで価格をクライアントに一切送らないことで、
 * 通知トリガーとデータ取得のタイミングを一致させる。
 */
export async function recordPriceView(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (isRateLimited(`price_view:${user.id}`, PRICE_VIEW_RATE_LIMIT, PRICE_VIEW_RATE_WINDOW_MS)) {
    return { error: "しばらく時間をおいてから再度お試しください" }
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from("practice_sessions")
    .select("member_price, guest_price, is_external, status")
    .eq("id", sessionId)
    .single()

  if (!session || !session.is_external || session.status !== "published") {
    return { error: "セッションが見つかりません" }
  }

  await supabase.from("price_views").insert({
    session_id: sessionId,
    viewer_id: user.id,
  })

  return { data: { memberPrice: session.member_price, guestPrice: session.guest_price } }
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

  // adminClientで全参加者を取得（user clientはRLSで自分の登録しか見えない）。
  // exportSessionRegistrationsと同様、無制限クエリを防ぐ安全上限を設ける
  const { data, error } = await regAdmin
    .from("session_registrations")
    .select("*, swimmer:profiles(id, name, avatar_url)")
    .eq("session_id", sessionId)
    .order("registered_at", { ascending: true })
    .limit(1000)

  if (error) return { data: [], count: 0 }
  const activeCount = data?.filter((r) => !r.cancelled_at).length || 0
  return { data: data || [], count: activeCount }
}
