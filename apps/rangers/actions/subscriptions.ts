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
import { isTeamAdmin } from "@/lib/auth/require-team-admin"
import { mapWithConcurrency } from "@/lib/utils"
import { notifyUsers } from "@/lib/notifications"

type AdminClient = ReturnType<typeof createAdminClient>

// Subscription更新の同時実行数（Stripe API呼び出しが多くなりすぎないよう制限）
const SUBSCRIPTION_SYNC_CONCURRENCY = 5

/**
 * チームの月謝額が変更された際、既にアクティブなStripe Subscriptionを
 * 全て新しい価格に切り替える。値上げ・値下げのたびにチームを作り直す必要が
 * ないよう、既存会員・新規会員の両方が自動的に新価格に統一される仕組み。
 *
 * proration_behavior: "none" を指定し、変更時点での差額調整(プロレーション)は
 * 行わない。次回の請求サイクルから新しい金額が適用される（月の途中で
 * 予告なく差額が引かれる/戻される驚きを避けるため）。
 *
 * 呼び出し元(updateTeam)で monthly_fee_amount の変更を検知した後に呼ぶ。
 * Stripe未設定環境では何もしない。
 */
export async function syncActiveSubscriptionsToNewPrice(
  admin: AdminClient,
  teamId: string,
  teamName: string,
  newAmount: number,
  currentProductId: string | null,
  currentPriceId: string | null
): Promise<{ updated: number; failed: number }> {
  if (!process.env.STRIPE_SECRET_KEY) return { updated: 0, failed: 0 }

  const { data: activeMembers } = await admin
    .from("team_members")
    .select("id, swimmer_id, stripe_subscription_id")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "monthly")
    .not("stripe_subscription_id", "is", null)
    .in("subscription_status", ["active", "past_due", "trialing"])

  if (!activeMembers || activeMembers.length === 0) return { updated: 0, failed: 0 }

  let newPriceId: string
  try {
    const productId = await getOrCreateStripeProduct(teamId, teamName, currentProductId)
    newPriceId = await getOrCreateMonthlyPrice(teamId, newAmount, productId, currentPriceId)
  } catch (err) {
    console.error("[syncActiveSubscriptionsToNewPrice] failed to prepare new price:", err)
    return { updated: 0, failed: activeMembers.length }
  }

  let updated = 0
  let failed = 0

  await mapWithConcurrency(activeMembers, SUBSCRIPTION_SYNC_CONCURRENCY, async (member) => {
    if (!member.stripe_subscription_id) return
    try {
      const subscription = await stripe.subscriptions.retrieve(member.stripe_subscription_id)
      const itemId = subscription.items.data[0]?.id
      if (!itemId) {
        failed++
        return
      }
      await stripe.subscriptions.update(member.stripe_subscription_id, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: "none",
      })
      updated++
    } catch (err) {
      console.error(`[syncActiveSubscriptionsToNewPrice] failed for member ${member.id}:`, err)
      failed++
    }
  })

  if (updated > 0) {
    await notifyUsers(activeMembers.map((m) => m.swimmer_id), {
      type: "fee_amount_changed",
      title: "月謝額が変更されました",
      body: `次回の請求から新しい金額(¥${newAmount.toLocaleString()})が適用されます`,
      team_id: teamId,
      link: "/payments",
    })
  }

  return { updated, failed }
}

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
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

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
  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

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

  if (!(await isTeamAdmin(admin, teamId, user.id))) return { error: "権限がありません" }

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
