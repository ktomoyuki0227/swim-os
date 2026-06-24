export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateStripeCustomer, getCardDetails } from "@/lib/stripe-helpers"
import { CreditCard, CheckCircle, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UpdateCardForm } from "./update-card-form"
import { PaymentHistoryFilters } from "./payment-history-filters"

export const metadata: Metadata = {
  title: "お支払い",
}

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  jcb: "JCB",
  discover: "Discover",
  diners: "Diners Club",
  unionpay: "UnionPay",
  unknown: "カード",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "開催待ち",
  paid: "支払済",
  failed: "決済失敗",
  refunded: "返金済",
  unpaid: "未払い",
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-[#eaf7f0] text-[#0f8a4f] border-transparent",
  pending: "bg-[#fdf6e3] text-[#b8860b] border-transparent",
  unpaid: "bg-[#fdf6e3] text-[#b8860b] border-transparent",
  failed: "bg-red-50 text-red-600 border-transparent",
  refunded: "bg-[#edf0f4] text-[#5c6a7a] border-transparent",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "カード",
  cash: "現金",
  point_card: "回数券",
}

// セッション参加費 or 会費の統一型
type PaymentItem = {
  id: string
  itemType: "session" | "annual" | "monthly"
  label: string
  teamId: string
  teamName: string
  amount: number
  status: string
  paymentMethod: string
  date: Date
}

interface PaymentsPageProps {
  searchParams: Promise<{ team?: string; type?: string }>
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const filterTeam = params.team ?? ""
  const filterType = params.type ?? ""

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

  // ① セッション参加履歴（RLS: registrations_select_own で自分の分のみ取得）
  const { data: sessionRegs } = await supabase
    .from("session_registrations")
    .select(
      `id, payment_status, payment_method, registered_at, is_member, cancelled_at,
       session:practice_sessions(
         id, title, scheduled_at, member_price, guest_price,
         team:teams(id, name)
       )`
    )
    .eq("swimmer_id", user.id)
    .order("registered_at", { ascending: false })

  // ② 会費履歴（RLS: fees_select_own で自分の分のみ取得）
  const { data: membershipFees } = await supabase
    .from("membership_fees")
    .select(`id, type, period, amount, status, paid_at, created_at, team_id, team:teams(id, name)`)
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  // ——— 統合リストを作成 ———

  const items: PaymentItem[] = []

  for (const reg of sessionRegs ?? []) {
    // キャンセル済み & 支払いが一度も確定していない行は支払い履歴に含めない
    if (reg.cancelled_at && reg.payment_status === "pending") continue
    // 無料参加（member_price = 0 で payment_status = "free"）は除外
    if (reg.payment_status === "free") continue

    const session = Array.isArray(reg.session) ? (reg.session[0] ?? null) : reg.session
    if (!session) continue
    const team = Array.isArray(session.team) ? (session.team[0] ?? null) : session.team
    if (!team) continue

    items.push({
      id: reg.id,
      itemType: "session",
      label: session.title ?? "セッション",
      teamId: team.id,
      teamName: team.name,
      amount: reg.is_member ? (session.member_price ?? 0) : (session.guest_price ?? 0),
      status: reg.payment_status,
      paymentMethod: reg.payment_method,
      date: new Date(session.scheduled_at ?? reg.registered_at),
    })
  }

  for (const fee of membershipFees ?? []) {
    const team = Array.isArray(fee.team) ? (fee.team[0] ?? null) : fee.team
    if (!team) continue

    const label =
      fee.type === "annual"
        ? `年会費 ${fee.period}年`
        : `月謝 ${fee.period.replace("-", "年")}月`

    items.push({
      id: fee.id,
      itemType: fee.type as "annual" | "monthly",
      label,
      teamId: fee.team_id,
      teamName: team.name,
      amount: fee.amount,
      status: fee.status,
      paymentMethod: "stripe",
      date: new Date(fee.paid_at ?? fee.created_at),
    })
  }

  // 最新順にソート（未払い・直近のものが上に来る）
  items.sort((a, b) => b.date.getTime() - a.date.getTime())

  // フィルター用グループ一覧
  const teamMap = new Map<string, string>()
  for (const item of items) teamMap.set(item.teamId, item.teamName)
  const teams = Array.from(teamMap.entries()).map(([id, name]) => ({ id, name }))

  // フィルター適用
  const filtered = items.filter((item) => {
    if (filterTeam && item.teamId !== filterTeam) return false
    if (filterType && item.itemType !== filterType) return false
    return true
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[#1a2332]">お支払い</h1>

      {/* カード設定 */}
      <Card className="border-[#dce3ea]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            登録済みクレジットカード
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cardDetails ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-medium">
                    {CARD_BRAND_LABELS[cardDetails.brand] ?? cardDetails.brand}{" "}
                    <span className="font-mono">•••• {cardDetails.last4}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    有効期限: {String(cardDetails.expMonth).padStart(2, "0")}/{cardDetails.expYear}
                  </p>
                </div>
              </div>
              <UpdateCardForm hasCard={true} />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                クレジットカードが登録されていません。グループの参加費・年会費・月謝の支払いに使用されます。
              </p>
              <UpdateCardForm hasCard={false} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 支払い履歴 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-[#005F8C]" />
          <h2 className="text-lg font-semibold text-[#1a2332]">支払い履歴</h2>
        </div>

        {teams.length > 0 && (
          <PaymentHistoryFilters
            teams={teams}
            selectedTeam={filterTeam}
            selectedType={filterType}
          />
        )}

        {filtered.length === 0 ? (
          <Card className="border-[#dce3ea]">
            <CardContent className="py-10 text-center text-sm text-[#5c6a7a]">
              {items.length === 0 ? "支払い履歴がありません" : "条件に一致する履歴がありません"}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <Card key={item.id} className="border-[#dce3ea]">
                <CardContent className="flex items-center gap-3 p-4">
                  {/* 種別アイコン */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-xs font-semibold text-[#005F8C]">
                    {item.itemType === "session" ? "練" : item.itemType === "annual" ? "年" : "月"}
                  </div>

                  {/* ラベル・グループ・日付 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#1a2332]">{item.label}</p>
                    <p className="text-xs text-[#5c6a7a]">
                      {item.teamName}
                      {" · "}
                      {item.date.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {PAYMENT_METHOD_LABELS[item.paymentMethod] ?? item.paymentMethod}
                    </p>
                  </div>

                  {/* 金額・ステータス */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {item.amount > 0 && (
                      <p className="text-sm font-semibold text-[#1a2332]">
                        ¥{item.amount.toLocaleString()}
                      </p>
                    )}
                    <Badge className={STATUS_STYLES[item.status] ?? "border-transparent"}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
