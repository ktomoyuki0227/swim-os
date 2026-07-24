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
  let customer: Awaited<ReturnType<typeof stripe.customers.create>>
  try {
    customer = await stripe.customers.create({
      email,
      ...(name.trim() ? { name: name.trim() } : {}),
      metadata: { supabase_user_id: userId },
    })
  } catch (err) {
    console.error("[stripe] customers.create failed:", err)
    throw new Error("Stripe カスタマーの作成に失敗しました。時間を置いて再試行してください。")
  }

  // stripe_customer_id がまだ null の行のみ更新（並行リクエストによる二重作成を防ぐ）
  const { data: saved } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId)
    .is("stripe_customer_id", null)
    .select("stripe_customer_id")
    .maybeSingle()

  if (!saved) {
    // 別リクエストが先に書き込んだ場合: 今作成した Customer を削除して既存値を返す
    await stripe.customers.del(customer.id).catch(() => null)
    const { data: existing } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()
    return existing?.stripe_customer_id ?? customer.id
  }

  return customer.id
}

/**
 * チームの Stripe Product を取得または新規作成する。
 * Product ID は teams.stripe_product_id に保存する。
 */
export async function getOrCreateStripeProduct(
  teamId: string,
  teamName: string,
  existingProductId: string | null
): Promise<string> {
  if (existingProductId) return existingProductId

  let product: Awaited<ReturnType<typeof stripe.products.create>>
  try {
    product = await stripe.products.create({
      name: `月謝 - ${teamName}`,
      metadata: { team_id: teamId },
    })
  } catch (err) {
    console.error("[stripe] products.create failed:", err)
    throw new Error("Stripe プロダクトの作成に失敗しました。時間を置いて再試行してください。")
  }

  const admin = createAdminClient()
  await admin.from("teams").update({ stripe_product_id: product.id }).eq("id", teamId)

  return product.id
}

/**
 * チームの月謝 Stripe Price を取得または新規作成する。
 * 金額が変わった場合は新しい Price を作成して teams.stripe_monthly_price_id を更新する。
 */
export async function getOrCreateMonthlyPrice(
  teamId: string,
  amount: number,
  productId: string,
  existingPriceId: string | null
): Promise<string> {
  // 既存の Price がある場合は金額確認
  if (existingPriceId) {
    const existingPrice = await stripe.prices.retrieve(existingPriceId).catch(() => null)
    if (existingPrice && existingPrice.unit_amount === amount && existingPrice.active) {
      return existingPriceId
    }
  }

  // 新しい Price を作成
  let price: Awaited<ReturnType<typeof stripe.prices.create>>
  try {
    price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: "jpy",
      recurring: { interval: "month" },
      metadata: { team_id: teamId },
    })
  } catch (err) {
    console.error("[stripe] prices.create failed:", err)
    throw new Error("Stripe 料金プランの作成に失敗しました。時間を置いて再試行してください。")
  }

  const admin = createAdminClient()
  await admin.from("teams").update({ stripe_monthly_price_id: price.id }).eq("id", teamId)

  return price.id
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
