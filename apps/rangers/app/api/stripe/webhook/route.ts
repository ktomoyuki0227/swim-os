import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/server"

// Route Handler は body parsing を自動で行わない（req.text() で生バイトを取得）
export const dynamic = "force-dynamic"

// ── イベントハンドラ ─────────────────────────────────────────────────────────

/** セッション参加登録の決済確定 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const admin = createAdminClient()

  // .eq("payment_status", "pending") で冪等性を保証（二重処理防止）
  const { error } = await admin
    .from("session_registrations")
    .update({ payment_status: "paid" })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .eq("payment_status", "pending")

  if (error) {
    console.error("[webhook] payment_intent.succeeded: DB update failed", error)
    throw error
  }
}

/** セッション参加登録の決済失敗 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  const admin = createAdminClient()

  const { error } = await admin
    .from("session_registrations")
    .update({ payment_status: "failed" })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .eq("payment_status", "pending")

  if (error) {
    console.error("[webhook] payment_intent.payment_failed: DB update failed", error)
    throw error
  }
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

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      // 未処理のイベントは 200 を返してリトライを防ぐ
      default:
        break
    }
  } catch (err) {
    // ハンドラ内のエラーは 500 で返し、Stripe にリトライさせる
    console.error(`[webhook] Handler failed for event ${event.type}:`, err)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
