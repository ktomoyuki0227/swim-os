"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  getOrCreateStripeCustomer,
  getOrCreateStripeProduct,
  getOrCreateMonthlyPrice,
} from "@/lib/stripe-helpers"

/** 月謝 Subscription を開始する（管理者のみ） */
export async function startMonthlySubscription(teamId: string, swimmerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Stripe 未設定環境では Subscription を作成できません" }
  }

  const admin = createAdminClient()

  // admin 権限チェック
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  // 対象メンバー情報を取得
  const { data: member } = await admin
    .from("team_members")
    .select("id, membership_type, stripe_subscription_id")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .eq("status", "active")
    .single()
  if (!member) return { error: "メンバーが見つかりません" }
  if (member.membership_type !== "monthly") {
    return { error: "月謝会員のみ Subscription を開始できます" }
  }
  if (member.stripe_subscription_id) {
    return { error: "既に Subscription が有効です" }
  }

  // チーム情報を取得
  const { data: team } = await admin
    .from("teams")
    .select("name, monthly_fee_amount, stripe_product_id, stripe_monthly_price_id")
    .eq("id", teamId)
    .single()
  if (!team) return { error: "チームが見つかりません" }
  if (!team.monthly_fee_amount || team.monthly_fee_amount <= 0) {
    return { error: "月謝金額が設定されていません（チーム設定で金額を入力してください）" }
  }

  // メンバーの email 取得（Stripe Customer 作成に必要）
  const { data: authData } = await admin.auth.admin.getUserById(swimmerId)
  const email = authData?.user?.email ?? ""

  const { data: profile } = await admin
    .from("profiles")
    .select("name")
    .eq("id", swimmerId)
    .single()
  const name = profile?.name ?? ""

  // Stripe Customer / Product / Price 取得または作成
  let customerId: string
  let productId: string
  let priceId: string
  try {
    customerId = await getOrCreateStripeCustomer(swimmerId, email, name)
    productId = await getOrCreateStripeProduct(teamId, team.name, team.stripe_product_id)
    priceId = await getOrCreateMonthlyPrice(
      teamId,
      team.monthly_fee_amount,
      productId,
      team.stripe_monthly_price_id
    )
  } catch (err) {
    console.error("[subscriptions] Stripe setup failed:", err)
    return { error: err instanceof Error ? err.message : "Stripe の準備に失敗しました" }
  }

  // Stripe Subscription 作成
  let subscription: Awaited<ReturnType<typeof stripe.subscriptions.create>>
  try {
    subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      metadata: {
        team_id: teamId,
        swimmer_id: swimmerId,
        team_member_id: member.id,
      },
    })
  } catch (err) {
    console.error("[subscriptions] Stripe subscription create failed:", err)
    return { error: "Subscription の作成に失敗しました。カードが登録されているか確認してください。" }
  }

  // DB に保存
  const { error: dbErr } = await admin
    .from("team_members")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
    })
    .eq("id", member.id)

  if (dbErr) {
    // DB 保存失敗 → Stripe Subscription をキャンセルしてロールバック
    await stripe.subscriptions.cancel(subscription.id).catch(() => null)
    return { error: "Subscription の保存に失敗しました" }
  }

  revalidatePath("/fees")
  return { success: true, status: subscription.status }
}

/** 月謝 Subscription をキャンセルする（管理者のみ） */
export async function cancelMonthlySubscription(teamId: string, swimmerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Stripe 未設定環境では Subscription をキャンセルできません" }
  }

  const admin = createAdminClient()

  // admin 権限チェック
  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  // 対象メンバー情報を取得
  const { data: member } = await admin
    .from("team_members")
    .select("id, stripe_subscription_id")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .eq("status", "active")
    .single()
  if (!member) return { error: "メンバーが見つかりません" }
  if (!member.stripe_subscription_id) {
    return { error: "有効な Subscription がありません" }
  }

  // Stripe Subscription をキャンセル（期間終了時にキャンセル）
  try {
    await stripe.subscriptions.update(member.stripe_subscription_id, {
      cancel_at_period_end: true,
    })
  } catch (err) {
    console.error("[subscriptions] Stripe subscription cancel failed:", err)
    return { error: "Subscription のキャンセルに失敗しました" }
  }

  // DB を即時更新（cancel_at_period_end の間も subscription_status は変わらないが UI 上でキャンセル予定を示す）
  // webhook の customer.subscription.updated が cancel_at_period_end=true を検知して "canceled" で同期するため整合する
  const { error: dbErr } = await admin
    .from("team_members")
    .update({ subscription_status: "canceled" })
    .eq("id", member.id)
  if (dbErr) {
    console.error("[subscriptions] cancelMonthlySubscription DB update failed:", dbErr)
  }

  revalidatePath("/fees")
  return { success: true }
}

/** Subscription のステータスを Stripe から同期する（管理者のみ） */
export async function syncSubscriptionStatus(teamId: string, swimmerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (!process.env.STRIPE_SECRET_KEY) return { error: "Stripe 未設定" }

  const admin = createAdminClient()

  const { data: adminMembership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("swimmer_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .single()
  if (!adminMembership) return { error: "権限がありません" }

  const { data: member } = await admin
    .from("team_members")
    .select("id, stripe_subscription_id")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .eq("status", "active")
    .single()
  if (!member?.stripe_subscription_id) return { error: "Subscription が存在しません" }

  const sub = await stripe.subscriptions.retrieve(member.stripe_subscription_id).catch(() => null)
  if (!sub) return { error: "Stripe から Subscription を取得できません" }

  await admin
    .from("team_members")
    .update({ subscription_status: sub.status })
    .eq("id", member.id)

  revalidatePath("/fees")
  return { success: true, status: sub.status }
}
