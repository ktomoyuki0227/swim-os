import "server-only"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * userId のユーザーに紐づく Stripe Customer を取得、または新規作成する。
 * 作成した Customer ID は profiles.stripe_customer_id に保存する。
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  // name が空文字の場合は Stripe に渡さない（ダッシュボードの検索性向上のため）
  const customer = await stripe.customers.create({
    email,
    ...(name.trim() ? { name: name.trim() } : {}),
    metadata: { supabase_user_id: userId },
  })

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId)

  return customer.id
}

/**
 * Stripe PaymentMethod ID からカード情報（ブランド・末4桁・有効期限）を取得する。
 * 取得失敗時は null を返す。
 */
export async function getCardDetails(paymentMethodId: string): Promise<{
  brand: string
  last4: string
  expMonth: number
  expYear: number
} | null> {
  try {
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (!pm.card) return null
    return {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    }
  } catch {
    return null
  }
}
