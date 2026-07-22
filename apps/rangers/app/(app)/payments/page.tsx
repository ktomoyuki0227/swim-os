export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateStripeCustomer, getCardDetails } from "@/lib/stripe-helpers"
import { CardModal } from "./card-modal"
import { PaymentHistoryFilters } from "./payment-history-filters"

export const metadata: Metadata = {
  title: "お支払い",
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

type PaymentItem = {
  id: string
  itemType: "session" | "annual" | "monthly"
  label: string
  teamId: string
  teamName: string
  amount: number
  status: string
  date: Date
}

interface PaymentsPageProps {
  searchParams: Promise<{ type?: string; sort?: string }>
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

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  // "session" | "fee" | "" (すべて)
  const filterType = params.type ?? ""
  // "asc" (古い順) | "" (新着順・デフォルト)
  const filterSort = params.sort ?? ""

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

  // ① セッション参加履歴
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

  // ② 会費履歴
  const { data: membershipFees } = await supabase
    .from("membership_fees")
    .select(`id, type, period, amount, status, paid_at, created_at, team_id`)
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  // ③ チーム情報を一括取得（ネスト JOIN の RLS 問題を避けるため分離）
  const teamIdSet = new Set<string>()
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

  // ——— 統合リストを作成 ———
  const items: PaymentItem[] = []

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
      label: session.title ?? "セッション",
      teamId,
      teamName,
      amount: reg.is_member ? (session.member_price ?? 0) : (session.guest_price ?? 0),
      status: reg.payment_status,
      date: new Date(session.scheduled_at ?? reg.registered_at),
    })
  }

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
      label,
      teamId,
      teamName,
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
  // "session" → セッション参加費のみ
  // "fee"     → 月謝・年会費のみ
  // ""        → すべて
  const filtered = items.filter((item) => {
    if (filterType === "session") return item.itemType === "session"
    if (filterType === "fee") return item.itemType === "annual" || item.itemType === "monthly"
    return true
  })

  // 年月でグループ化
  const groupedByMonth = new Map<string, PaymentItem[]>()
  for (const item of filtered) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`
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
        <h1 className="text-lg font-semibold text-[#1a2332]">お支払い</h1>
        {/* クレジットカード管理ボタン */}
        <CardModal cardDetails={cardDetails} hasCard={!!cardDetails} />
      </div>

      {/* フィルターチップ */}
      <PaymentHistoryFilters selectedType={filterType} selectedSort={filterSort} />

      {/* 支払い履歴 */}
      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-[#dce3ea] bg-white px-6 py-16 text-center">
          <p className="text-sm text-[#475569]">
            {items.length === 0 ? "支払い履歴がありません" : "条件に一致する履歴がありません"}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedMonthKeys.map((monthKey) => {
            const monthItems = groupedByMonth.get(monthKey)!
            const totalAmount = monthItems.reduce((sum, item) => sum + item.amount, 0)

            return (
              <div key={monthKey}>
                {/* 月ヘッダー */}
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <p className="text-sm font-semibold text-[#1a2332]">
                    {formatMonthKey(monthKey)}
                  </p>
                  <p className="text-sm text-[#475569]">
                    {monthItems.length}件 · ¥{totalAmount.toLocaleString()}
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
                            {item.date.getMonth() + 1}/{item.date.getDate()}
                          </p>
                        </div>

                        {/* 縦区切り線 */}
                        <div className="h-8 w-px shrink-0 bg-[#edf0f4]" />

                        {/* 摘要：セッション名 + グループ名 */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[#1a2332]">
                            {item.label}
                          </p>
                          <p className="truncate text-sm text-[#475569]">{item.teamName}</p>
                        </div>

                        {/* 金額 + 異常ステータスバッジ */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-[#1a2332]">
                            ¥{item.amount.toLocaleString()}
                          </p>
                          {ALERT_STATUS_LABELS[item.status] && (
                            <span
                              className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-sm font-medium ${ALERT_STATUS_STYLES[item.status]}`}
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
