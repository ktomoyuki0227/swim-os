"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

/**
 * カード情報を更新する。
 * SetupIntent で確定した paymentMethodId を受け取り、
 * Stripe 側でデフォルト設定 & profiles.stripe_payment_method_id を更新する。
 */
export async function updatePaymentMethod(
  paymentMethodId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "ログインが必要です" }

  // pm_ で始まらない値を拒否（不正な入力ガード）
  if (!paymentMethodId.startsWith("pm_")) {
    return { error: "無効な支払い方法IDです" }
  }

  const admin = createAdminClient()

  // profiles から stripe_customer_id を取得
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return { error: "Stripe カスタマー情報が見つかりません" }
  }

  // Stripe: Payment Method を Customer にアタッチ
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: profile.stripe_customer_id,
  })

  // Stripe: Customer のデフォルト決済手段を更新
  await stripe.customers.update(profile.stripe_customer_id, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  // Supabase: profiles の stripe_payment_method_id を更新
  const { error } = await admin
    .from("profiles")
    .update({ stripe_payment_method_id: paymentMethodId })
    .eq("id", user.id)

  if (error) return { error: "カード情報の保存に失敗しました" }

  return { error: null }
}
