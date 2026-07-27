export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateStripeCustomer, getCardDetails } from "@/lib/stripe-helpers"
import { CardModal } from "./card-modal"
import { PaymentHistoryFilters } from "./payment-history-filters"

export const metadata: Metadata = {
  title: "通帳",
}

// 異常ステータスのみ表示（paid / pending は省略）
const ALERT_STATUS_LABELS: Record<string, string> = {
  failed: "決済失敗",
  refunded: "返金済",
  unpaid: "未払い",
}

const ALERT_STATUS_STYLES: Record<string, string> = {
  failed: "bg-[#fdecea] text-[#c0392b]",
  refunded: "bg-[#edf0f4] text-[#475569]",
  unpaid: "bg-[#fdf6e3] text-[#b8860b]",
}

type PaymentDirection = "expense" | "income"

type PaymentItem = {
  id: string
  itemType: "session" | "annual" | "monthly"
  direction: PaymentDirection
  label: string
  teamId: string
  teamName: string
  /** 収入の場合のみ：支払った相手の名前 */
  payerName?: string
  amount: number
  status: string
  date: Date
}

interface PaymentsPageProps {
  searchParams: Promise<{ type?: string; sort?: string; direction?: string; status?: string }>
}

type IncomeSession = {
  id: string
  title: string | null
  scheduled_at: string
  member_price: number | null
  guest_price: number | null
  team_id: string
}

type IncomeRegistration = {
  id: string
  payment_status: string
  payment_method: string | null
  registered_at: string
  is_member: boolean
  cancelled_at: string | null
  swimmer_id: string
  session_id: string
}

type IncomeFee = {
  id: string
  type: string
  period: string
  amount: number
  status: string
  paid_at: string | null
  created_at: string
  team_id: string
  swimmer_id: string
}

/** itemType に応じた左カラーバーの色 */
function getItemColor(itemType: string): string {
  return itemType === "session" ? "#005F8C" : "#0f8a4f"
}

/** "2025-07" → "2025年7月" */
function formatMonthKey(key: string): string {
  const [year, month] = key.split("-")
  return `${year}年${Number(month)}月`
}

/** Asia/Tokyo タイムゾーン基準で年・月・日を取得する（サーバーのタイムゾーンに依存しないため） */
function getJstDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date)
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return {
    year: Number(partMap.year),
    month: Number(partMap.month),
    day: Number(partMap.day),
  }
}

/** "2025-07" 形式の月次グループキーをJST基準で生成する */
function getJstMonthKey(date: Date): string {
  const { year, month } = getJstDateParts(date)
  return `${year}-${String(month).padStart(2, "0")}`
}

/** "M/D" 形式でJST基準の日付表示文字列を生成する */
function formatJstMonthDay(date: Date): string {
  const { month, day } = getJstDateParts(date)
  return `${month}/${day}`
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const filterType = params.type ?? ""           // "session" | "fee" | ""（すべて）
  const filterSort = params.sort ?? ""            // "asc"（古い順） | ""（新着順）
  const filterDirection = params.direction ?? ""  // "expense" | "income" | ""（すべて）
  const filterStatus = params.status ?? ""        // "unpaid"（要対応のみ） | ""（すべて）

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, stripe_customer_id, stripe_payment_method_id")
    .eq("id", user.id)
    .single()
  if (!profile) redirect("/login")

  // カード情報取得（Stripe 未設定環境では省略）
  let cardDetails: Awaited<ReturnType<typeof getCardDetails>> = null
  if (process.env.STRIPE_SECRET_KEY) {
    await getOrCreateStripeCustomer(user.id, user.email ?? "", profile.name)
    if (profile.stripe_payment_method_id) {
      cardDetails = await getCardDetails(profile.stripe_payment_method_id)
    }
  }

  // ① セッション参加履歴（支出）
  const { data: sessionRegs } = await supabase
    .from("session_registrations")
    .select(
      `id, payment_status, payment_method, registered_at, is_member, cancelled_at,
       session:practice_sessions(
         id, title, scheduled_at, member_price, guest_price, team_id
       )`
    )
    .eq("swimmer_id", user.id)
    .order("registered_at", { ascending: false })

  // ② 会費履歴（支出）
  const { data: membershipFees } = await supabase
    .from("membership_fees")
    .select(`id, type, period, amount, status, paid_at, created_at, team_id`)
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  // ③ 自分が管理者を務めるチーム（収入の対象範囲）
  const { data: adminMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
  const adminTeamIds = (adminMemberships ?? []).map((m) => m.team_id)
  const isTeamAdmin = adminTeamIds.length > 0

  // ④ 収入側データ（自分が管理者のチームに対する、他メンバーの支払い）
  //    registrations_select_admin / fees_select_admin ポリシーにより通常クライアントで取得可能
  let incomeRegs: IncomeRegistration[] = []
  let incomeSessionById = new Map<string, IncomeSession>()
  let incomeFees: IncomeFee[] = []

  if (isTeamAdmin) {
    const { data: incomeSessions } = await supabase
      .from("practice_sessions")
      .select("id, title, scheduled_at, member_price, guest_price, team_id")
      .in("team_id", adminTeamIds)

    incomeSessionById = new Map((incomeSessions ?? []).map((s) => [s.id, s]))
    const incomeSessionIds = Array.from(incomeSessionById.keys())

    if (incomeSessionIds.length > 0) {
      const { data: regs } = await supabase
        .from("session_registrations")
        .select(
          "id, payment_status, payment_method, registered_at, is_member, cancelled_at, swimmer_id, session_id"
        )
        .in("session_id", incomeSessionIds)
        .neq("swimmer_id", user.id)
      incomeRegs = regs ?? []
    }

    const { data: fees } = await supabase
      .from("membership_fees")
      .select("id, type, period, amount, status, paid_at, created_at, team_id, swimmer_id")
      .in("team_id", adminTeamIds)
      .neq("swimmer_id", user.id)
    incomeFees = fees ?? []
  }

  // ⑤ チーム情報を一括取得（ネスト JOIN の RLS 問題を避けるため分離）
  const teamIdSet = new Set<string>(adminTeamIds)
  for (const reg of sessionRegs ?? []) {
    const session = Array.isArray(reg.session) ? (reg.session[0] ?? null) : reg.session
    const teamId = session?.team_id as string | null
    if (teamId) teamIdSet.add(teamId)
  }
  for (const fee of membershipFees ?? []) {
    if (fee.team_id) teamIdSet.add(fee.team_id)
  }
  const { data: teamsData } =
    teamIdSet.size > 0
      ? await supabase.from("teams").select("id, name").in("id", Array.from(teamIdSet))
      : { data: [] as { id: string; name: string }[] }
  const teamById = new Map((teamsData ?? []).map((t) => [t.id, t.name]))

  // ⑥ 支払者（収入の相手）のプロフィールを一括取得（他ユーザーの行は public_profiles ビュー経由。
  // profiles 本体の SELECT ポリシーは本人のみに制限されているため）
  const payerIdSet = new Set<string>()
  for (const reg of incomeRegs) payerIdSet.add(reg.swimmer_id)
  for (const fee of incomeFees) payerIdSet.add(fee.swimmer_id)
  const { data: payersData } =
    payerIdSet.size > 0
      ? await supabase.from("public_profiles").select("id, name").in("id", Array.from(payerIdSet))
      : { data: [] as { id: string; name: string }[] }
  const payerNameById = new Map((payersData ?? []).map((p) => [p.id, p.name]))

  // ——— 統合リストを作成 ———
  const items: PaymentItem[] = []

  // 支出：セッション参加費
  for (const reg of sessionRegs ?? []) {
    // キャンセル済み & 支払い未確定は除外
    if (reg.cancelled_at && reg.payment_status === "pending") continue
    // 無料参加は除外
    if (reg.payment_status === "free") continue

    const session = Array.isArray(reg.session) ? (reg.session[0] ?? null) : reg.session
    if (!session) continue
    const teamId = session.team_id as string | null
    if (!teamId) continue
    const teamName = teamById.get(teamId)
    if (!teamName) continue

    items.push({
      id: reg.id,
      itemType: "session",
      direction: "expense",
      label: session.title ?? "セッション",
      teamId,
      teamName,
      amount: reg.is_member ? (session.member_price ?? 0) : (session.guest_price ?? 0),
      status: reg.payment_status,
      date: new Date(session.scheduled_at ?? reg.registered_at),
    })
  }

  // 支出：会費
  for (const fee of membershipFees ?? []) {
    const teamId = fee.team_id
    if (!teamId) continue
    const teamName = teamById.get(teamId)
    if (!teamName) continue

    const label =
      fee.type === "annual"
        ? `年会費 ${fee.period}年`
        : `月謝 ${fee.period.replace("-", "年")}月`

    items.push({
      id: fee.id,
      itemType: fee.type as "annual" | "monthly",
      direction: "expense",
      label,
      teamId,
      teamName,
      amount: fee.amount,
      status: fee.status,
      date: new Date(fee.paid_at ?? fee.created_at),
    })
  }

  // 収入：セッション参加費（自分が管理するチームへの、他メンバーの支払い）
  for (const reg of incomeRegs) {
    if (reg.cancelled_at && reg.payment_status === "pending") continue
    if (reg.payment_status === "free") continue

    const session = incomeSessionById.get(reg.session_id)
    if (!session) continue
    const teamName = teamById.get(session.team_id)
    if (!teamName) continue

    items.push({
      id: reg.id,
      itemType: "session",
      direction: "income",
      label: session.title ?? "セッション",
      teamId: session.team_id,
      teamName,
      payerName: payerNameById.get(reg.swimmer_id) ?? "不明",
      amount: reg.is_member ? (session.member_price ?? 0) : (session.guest_price ?? 0),
      status: reg.payment_status,
      date: new Date(session.scheduled_at ?? reg.registered_at),
    })
  }

  // 収入：会費（自分が管理するチームへの、他メンバーの会費）
  for (const fee of incomeFees) {
    const teamName = teamById.get(fee.team_id)
    if (!teamName) continue

    const label =
      fee.type === "annual"
        ? `年会費 ${fee.period}年`
        : `月謝 ${fee.period.replace("-", "年")}月`

    items.push({
      id: fee.id,
      itemType: fee.type as "annual" | "monthly",
      direction: "income",
      label,
      teamId: fee.team_id,
      teamName,
      payerName: payerNameById.get(fee.swimmer_id) ?? "不明",
      amount: fee.amount,
      status: fee.status,
      date: new Date(fee.paid_at ?? fee.created_at),
    })
  }

  // ソート（新着順 or 古い順）
  items.sort((a, b) =>
    filterSort === "asc"
      ? a.date.getTime() - b.date.getTime()
      : b.date.getTime() - a.date.getTime()
  )

  // フィルター適用
  const filtered = items.filter((item) => {
    if (filterType === "session" && item.itemType !== "session") return false
    if (filterType === "fee" && item.itemType !== "annual" && item.itemType !== "monthly") return false
    if (filterDirection && item.direction !== filterDirection) return false
    if (filterStatus === "unpaid" && !ALERT_STATUS_LABELS[item.status]) return false
    return true
  })

  // 年月でグループ化
  const groupedByMonth = new Map<string, PaymentItem[]>()
  for (const item of filtered) {
    const key = getJstMonthKey(item.date)
    if (!groupedByMonth.has(key)) groupedByMonth.set(key, [])
    groupedByMonth.get(key)!.push(item)
  }
  const sortedMonthKeys = Array.from(groupedByMonth.keys()).sort((a, b) =>
    filterSort === "asc" ? a.localeCompare(b) : b.localeCompare(a)
  )

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[#1a2332]">通帳</h1>
        {/* クレジットカード管理ボタン */}
        <CardModal cardDetails={cardDetails} hasCard={!!cardDetails} />
      </div>

      {/* フィルターチップ */}
      <PaymentHistoryFilters
        selectedType={filterType}
        selectedSort={filterSort}
        selectedDirection={filterDirection}
        selectedStatus={filterStatus}
        showDirectionFilter={isTeamAdmin}
      />

      {/* 通帳明細 */}
      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-[#dce3ea] bg-white px-6 py-16 text-center">
          <p className="text-sm text-[#475569]">
            {items.length === 0 ? "まだ入出金の記録がありません" : "条件に一致する記録がありません"}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedMonthKeys.map((monthKey) => {
            const monthItems = groupedByMonth.get(monthKey)!
            const totalExpense = monthItems
              .filter((i) => i.direction === "expense")
              .reduce((sum, i) => sum + i.amount, 0)
            const totalIncome = monthItems
              .filter((i) => i.direction === "income")
              .reduce((sum, i) => sum + i.amount, 0)
            const net = totalIncome - totalExpense

            return (
              <div key={monthKey}>
                {/* 月ヘッダー */}
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <p className="text-sm font-semibold text-[#1a2332]">
                    {formatMonthKey(monthKey)}
                  </p>
                  <p className="text-xs text-[#475569]">
                    合計 {net >= 0 ? "+" : "−"}¥{Math.abs(net).toLocaleString()}
                  </p>
                </div>

                {/* 明細リスト（ゆうちょ通帳スタイル） */}
                <div className="overflow-hidden rounded-[14px] border border-[#dce3ea] bg-white divide-y divide-[#f2f7fa]">
                  {monthItems.map((item) => (
                    <div key={item.id} className="flex items-stretch">
                      {/* 左カラーバー: セッション=青, 会費=緑 */}
                      <div
                        className="w-1 shrink-0"
                        style={{ backgroundColor: getItemColor(item.itemType) }}
                      />

                      {/* 行コンテンツ */}
                      <div className="flex flex-1 items-center gap-3 px-4 py-3">
                        {/* 日付（月/日） */}
                        <div className="w-9 shrink-0 text-center">
                          <p className="text-sm font-medium tabular-nums text-[#1a2332]">
                            {formatJstMonthDay(item.date)}
                          </p>
                        </div>

                        {/* 縦区切り線 */}
                        <div className="h-8 w-px shrink-0 bg-[#edf0f4]" />

                        {/* 摘要：セッション名 + グループ名（収入は支払者名も） */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#1a2332]">
                            {item.label}
                          </p>
                          <p className="truncate text-xs text-[#475569]">
                            {item.direction === "income" && item.payerName
                              ? `${item.teamName} · ${item.payerName}さん`
                              : item.teamName}
                          </p>
                        </div>

                        {/* 金額 + 異常ステータスバッジ */}
                        <div className="shrink-0 text-right">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: item.direction === "income" ? "#005F8C" : "#1a2332" }}
                          >
                            {item.direction === "income" ? "+" : "−"}¥{item.amount.toLocaleString()}
                          </p>
                          {ALERT_STATUS_LABELS[item.status] && (
                            <span
                              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ALERT_STATUS_STYLES[item.status]}`}
                            >
                              {ALERT_STATUS_LABELS[item.status]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
