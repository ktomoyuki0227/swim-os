import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/server"
import { notifyUser, notifyUsers } from "@/lib/notifications"

// Route Handler は body parsing を自動で行わない（req.text() で生バイトを取得）
export const dynamic = "force-dynamic"

// ── セッション決済ハンドラ ──────────────────────────────────────────────────────

/** セッション参加登録の決済確定 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const admin = createAdminClient()

  // .eq("payment_status", "pending") で冪等性を保証（二重処理防止）
  const { error } = await admin
    .from("session_registrations")
    .update({ payment_status: "paid" })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .eq("payment_status", "pending")

  if (error) {
    console.error(`[webhook] payment_intent.succeeded (${paymentIntent.id}): DB update failed`, error)
    throw error
  }

  // Connect 送金記録を confirmed に更新
  if (paymentIntent.transfer_data) {
    await admin
      .from("transfer_records")
      .update({ status: "succeeded" })
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .eq("status", "pending")
  }
}

/** セッション参加登録の決済失敗 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const admin = createAdminClient()

  const { error } = await admin
    .from("session_registrations")
    .update({ payment_status: "failed" })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .eq("payment_status", "pending")

  if (error) {
    console.error(`[webhook] payment_intent.payment_failed (${paymentIntent.id}): DB update failed`, error)
    throw error
  }

  // Connect 送金記録を failed に更新（confirm前にpendingで作成されているため対象行は存在する）
  if (paymentIntent.transfer_data) {
    await admin
      .from("transfer_records")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .eq("status", "pending")
  }
}

// ── 月謝 Subscription ハンドラ ─────────────────────────────────────────────────

/** Invoice から subscription ID を取得する（Stripe v22 の parent 構造に対応） */
function getSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === "string" ? sub : sub.id
}

/** 月謝 Invoice 決済完了 → membership_fees に記録 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId = getSubscriptionId(invoice)

  if (!subId) return

  // amount_paid = 0 は Subscription 作成直後のセットアップインボイス等。記録不要
  if (!invoice.amount_paid || invoice.amount_paid === 0) return

  const subscription = await stripe.subscriptions.retrieve(subId).catch(() => null)
  if (!subscription) return

  const { team_id, swimmer_id } = subscription.metadata
  if (!team_id || !swimmer_id) return

  // 請求期間を YYYY-MM 形式に変換
  const periodDate = new Date(invoice.period_start * 1000)
  const period = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, "0")}`

  const admin = createAdminClient()

  // stripe_invoice_id のユニーク制約でリトライ時の二重 INSERT を防止
  const { error } = await admin
    .from("membership_fees")
    .insert({
      team_id,
      swimmer_id,
      type: "monthly",
      period,
      amount: invoice.amount_paid,
      payment_method: "stripe",
      stripe_subscription_id: subId,
      stripe_invoice_id: invoice.id,
      status: "paid",
      paid_at: new Date().toISOString(),
    })

  // 23505 = unique_violation（既に処理済み）は正常
  if (error && !error.message?.includes("duplicate") && error.code !== "23505") {
    console.error(`[webhook] invoice.paid (${invoice.id}): DB insert failed`, error)
    throw error
  }

  // 月謝決済通知（新規 INSERT 成功時のみ。二重通知防止のため unique_violation は除外）
  if (!error) {
    await notifyUser(swimmer_id, {
      type: "payment_charged",
      title: `${period.replace("-", "年")}月の月謝が引き落とされました`,
      body: `¥${invoice.amount_paid.toLocaleString()}が引き落とされました`,
      team_id,
      link: "/payments",
    })
  }

  // subscription_status を active に同期
  await admin
    .from("team_members")
    .update({ subscription_status: "active" })
    .eq("stripe_subscription_id", subId)
}

/** 月謝 Invoice 決済失敗 → 管理者・本人に通知 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = getSubscriptionId(invoice)

  if (!subId) return

  const subscription = await stripe.subscriptions.retrieve(subId).catch(() => null)
  if (!subscription) return

  const { team_id, swimmer_id } = subscription.metadata
  if (!team_id || !swimmer_id) return

  const admin = createAdminClient()

  // Stripeは同一請求の支払い失敗を複数回(リトライスケジュールに応じて)通知してくるため、
  // 既にpast_dueへ遷移済みなら再通知しない(subscription_statusを冪等性の判定に使う)
  const { data: currentMember } = await admin
    .from("team_members")
    .select("subscription_status")
    .eq("stripe_subscription_id", subId)
    .maybeSingle()
  const alreadyNotified = currentMember?.subscription_status === "past_due"

  // subscription_status を past_due に更新
  await admin
    .from("team_members")
    .update({ subscription_status: "past_due" })
    .eq("stripe_subscription_id", subId)

  if (alreadyNotified) return

  // 管理者に通知
  const { data: admins } = await admin
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", team_id)
    .eq("role", "admin")
    .eq("status", "active")

  if (admins && admins.length > 0) {
    await notifyUsers(admins.map((a) => a.swimmer_id), {
      type: "payment_failed",
      title: "メンバーの月謝決済に失敗しました",
      body: "月謝の自動引き落としに失敗しました。Stripe ダッシュボードで詳細を確認してください。",
      team_id,
      link: `/fees?team=${team_id}&type=monthly`,
    })
  }

  // 本人に通知
  await notifyUser(swimmer_id, {
    type: "payment_failed",
    title: "月謝の決済に失敗しました",
    body: "今月の月謝引き落としに失敗しました。登録カードを確認してください。",
    team_id,
    link: "/payments",
  })
}

/** Subscription ステータス変更 → team_members に同期 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  // cancel_at_period_end=true の場合は期間終了後キャンセル予定扱い → UI 上は "canceled" で表示
  const status = subscription.cancel_at_period_end ? "canceled" : subscription.status
  await admin
    .from("team_members")
    .update({ subscription_status: status })
    .eq("stripe_subscription_id", subscription.id)
}

/** Subscription 削除（完全キャンセル）→ team_members をクリア */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  await admin
    .from("team_members")
    .update({
      stripe_subscription_id: null,
      subscription_status: "canceled",
    })
    .eq("stripe_subscription_id", subscription.id)
}

// ── Stripe Connect ハンドラ ────────────────────────────────────────────────────

/** Connected Account のステータス変更 → teams.stripe_onboarding_completed を同期 */
async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.metadata?.team_id) return
  const admin = createAdminClient()
  const completed = account.charges_enabled && account.details_submitted
  await admin
    .from("teams")
    .update({ stripe_onboarding_completed: completed })
    .eq("stripe_account_id", account.id)
}

// ── エントリーポイント ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  // Stripe のシグネチャ検証には生の Request body が必要
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  console.info(`[webhook] Received: ${event.type} (${event.id})`)

  try {
    switch (event.type) {
      // セッション決済
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      // 月謝 Subscription
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      // Stripe Connect
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      // 未処理のイベントは 200 を返してリトライを防ぐ
      default:
        console.info(`[webhook] Unhandled event type: ${event.type}`)
        break
    }
  } catch (err) {
    // ハンドラ内のエラーは 500 で返し、Stripe にリトライさせる
    console.error(`[webhook] Handler failed for event ${event.type} (${event.id}):`, err)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
