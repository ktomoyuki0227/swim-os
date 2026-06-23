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

  // PM ID の形式チェック（pm_ + 英数字10文字以上）
  if (!/^pm_[a-zA-Z0-9]{10,}$/.test(paymentMethodId)) {
    return { error: "無効な支払い方法IDです" }
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return { error: "Stripe カスタマー情報が見つかりません" }
  }

  try {
    // PM を Stripe から取得し、所有権を確認（他ユーザーの PM の不正使用を防止）
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)

    if (pm.customer && pm.customer !== profile.stripe_customer_id) {
      // 別の Customer に紐づいた PM は使用不可
      return { error: "無効な支払い方法です" }
    }

    // まだ Customer にアタッチされていない場合のみアタッチ
    if (!pm.customer) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: profile.stripe_customer_id,
      })
    }

    // Customer のデフォルト決済手段を更新
    await stripe.customers.update(profile.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })
  } catch (err) {
    console.error("[payments] Stripe payment method update failed:", err)
    return { error: "カード情報の更新に失敗しました。もう一度お試しください。" }
  }

  // Supabase: profiles の stripe_payment_method_id を更新
  const { error } = await admin
    .from("profiles")
    .update({ stripe_payment_method_id: paymentMethodId })
    .eq("id", user.id)

  if (error) return { error: "カード情報の保存に失敗しました" }

  return { error: null }
}
