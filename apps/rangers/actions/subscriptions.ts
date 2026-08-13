"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { getOrCreateStripeProduct, getOrCreateMonthlyPrice } from "@/lib/stripe-helpers"
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
  const updatedSwimmerIds: string[] = []

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
      updatedSwimmerIds.push(member.swimmer_id)
    } catch (err) {
      console.error(`[syncActiveSubscriptionsToNewPrice] failed for member ${member.id}:`, err)
      failed++
    }
  })

  // 実際に価格変更が成功したメンバーにのみ通知する（失敗したメンバーは
  // 旧価格のままなのに「新しい金額が適用されます」という誤った通知を受け取らないよう）
  if (updatedSwimmerIds.length > 0) {
    await notifyUsers(updatedSwimmerIds, {
      type: "fee_amount_changed",
      title: "月謝額が変更されました",
      body: `次回の請求から新しい金額(¥${newAmount.toLocaleString()})が適用されます`,
      team_id: teamId,
      link: "/payments",
    })
  }

  return { updated, failed }
}
