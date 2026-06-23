import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateStripeCustomer, getCardDetails } from "@/lib/stripe-helpers"
import { CreditCard, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UpdateCardForm } from "./update-card-form"

export const metadata: Metadata = {
  title: "お支払い設定",
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

export default async function PaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, stripe_customer_id, stripe_payment_method_id")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Stripe Customer を確保 & カード詳細を取得（KEY 未設定環境では省略）
  let cardDetails: Awaited<ReturnType<typeof getCardDetails>> = null
  if (process.env.STRIPE_SECRET_KEY) {
    await getOrCreateStripeCustomer(user.id, user.email ?? "", profile.name)
    if (profile.stripe_payment_method_id) {
      cardDetails = await getCardDetails(profile.stripe_payment_method_id)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">お支払い設定</h1>

      <div className="space-y-6">
        {/* 登録済みカード情報 */}
        <Card>
          <CardHeader>
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
                  まだクレジットカードが登録されていません。
                  グループの年会費・月謝・練習参加費のお支払いに使用されます。
                </p>
                <UpdateCardForm hasCard={false} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 補足情報 */}
        <div className="rounded-lg border border-muted bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            カード情報は Stripe により安全に管理されます。Rangers はカード番号を直接保存しません。
          </p>
        </div>
      </div>
    </div>
  )
}
