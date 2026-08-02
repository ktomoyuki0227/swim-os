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

  // "pending"/"failed" からのみ "paid" に遷移させる（二重処理防止の冪等性ガード）。
  // confirm()がタイムアウト等の例外で"failed"のまま残ったケースからの復旧は拾いつつ、
  // 遅延/リトライされたイベントが "refunded"/"disputed" 等の終端状態を
  // 誤って "paid" に巻き戻さないよう、対象状態を明示的に限定する
  // （以前は .neq("payment_status", "paid") で "paid" 以外すべてを対象にしていたため、
  // 返金・チャージバック後に届いた遅延イベントが状態を巻き戻すバグがあった）。
  const { error } = await admin
    .from("session_registrations")
    .update({ payment_status: "paid" })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .in("payment_status", ["pending", "failed"])

  if (error) {
    console.error(`[webhook] payment_intent.succeeded (${paymentIntent.id}): DB update failed`, error)
    throw error
  }

  // Connect 送金記録も同様に "pending"/"failed" からのみ "succeeded" に遷移させる
  if (paymentIntent.transfer_data) {
    await admin
      .from("transfer_records")
      .update({ status: "succeeded" })
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .in("status", ["pending", "failed"])
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

/**
 * チャージバック（支払い異議申し立て）が発生した際のハンドラ。
 * 従来はこのイベントを一切処理しておらず、DB上は"paid"のまま・管理者への通知もなく、
 * Stripeダッシュボードを個別に確認しない限り一切気づけなかった。
 * 解決(勝訴/敗訴)の自動反映まではスコープに含めず、まずは可視化と通知を行う。
 */
async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id
  if (!paymentIntentId) return

  const admin = createAdminClient()

  const { data: registration } = await admin
    .from("session_registrations")
    .select("id, payment_status, session:practice_sessions(team_id, title)")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle()

  if (!registration) return

  const { data: updated, error } = await admin
    .from("session_registrations")
    .update({ payment_status: "disputed" })
    .eq("id", registration.id)
    .neq("payment_status", "disputed")
    .select("id")

  if (error) {
    console.error(`[webhook] charge.dispute.created (${dispute.id}): DB update failed`, error)
    throw error
  }
  // 既に disputed 済み（冪等性）なら重複通知しない
  if (!updated || updated.length === 0) return

  const session = registration.session as { team_id: string; title: string } | null
  if (!session) return

  const { data: admins } = await admin
    .from("team_members")
    .select("swimmer_id")
    .eq("team_id", session.team_id)
    .eq("role", "admin")
    .eq("status", "active")

  if (admins && admins.length > 0) {
    await notifyUsers(admins.map((a) => a.swimmer_id), {
      type: "payment_failed",
      title: "参加費決済に異議申し立て（チャージバック）が発生しました",
      body: `「${session.title}」の参加費についてチャージバックが発生しました。Stripeダッシュボードで詳細を確認してください。`,
      team_id: session.team_id,
      link: "/payments",
    })
  }
}

/**
 * Stripeダッシュボード等、アプリの返金フローを経由せずに発行された返金をDBに同期する。
 * アプリ内キャンセル(cancelSession/cancelRegistration)は呼び出し元で直接
 * payment_status を更新済みのため、その場合はこのハンドラは冪等に無処理となる。
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  // 部分返金では"refunded"に倒さない（全額返金のみ対象）
  if (!charge.refunded) return

  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return

  const admin = createAdminClient()

  const { error } = await admin
    .from("session_registrations")
    .update({ payment_status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("payment_status", "paid")

  if (error) {
    console.error(`[webhook] charge.refunded (${charge.id}): DB update failed`, error)
    throw error
  }

  await admin
    .from("transfer_records")
    .update({ status: "reversed" })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("status", "succeeded")
}

// ── 月謝 Subscription ハンドラ ─────────────────────────────────────────────────

/** Invoice から subscription ID を取得する（Stripe v22 の parent 構造に対応） */
function getSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === "string" ? sub : sub.id
}

/** Unix seconds を JST 基準の "YYYY-MM" に変換する */
function formatPeriodJst(unixSeconds: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(unixSeconds * 1000))
  const year = parts.find((p) => p.type === "year")?.value
  const month = parts.find((p) => p.type === "month")?.value
  return `${year}-${month}`
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

  // 請求期間を YYYY-MM 形式に変換（サーバーのローカルタイムゾーン(UTC)ではなくJSTで判定。
  // そうしないと日本時間の深夜0時台に発行された請求が前日UTC基準で前月扱いになりうる）
  const period = formatPeriodJst(invoice.period_start)

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
  // 既にpast_dueへ遷移済みなら再通知しない。read-then-writeではなく条件付きUPDATE +
  // .select()の戻り件数で「実際に遷移させた呼び出しか」を判定する（同時配信時の
  // 読み取り→書き込みの間のレースで両方が通知を送ってしまうのを防ぐ）。
  const { data: updated } = await admin
    .from("team_members")
    .update({ subscription_status: "past_due" })
    .eq("stripe_subscription_id", subId)
    .neq("subscription_status", "past_due")
    .select("swimmer_id")

  if (!updated || updated.length === 0) return

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

/**
 * Connected Account のステータス変更 → teams.stripe_onboarding_completed を同期。
 * 一度 true になった後に Stripe 側の審査・リスク保留等で false に戻った場合、
 * confirmSession/retryPayment は現在のDB状態を都度読んで Connect送金なしの
 * 決済(全額プラットフォーム残高行き)に静かにフォールバックしてしまうため、
 * 管理者がUIバナーに気づく前に決済が積み重なるのを防ぐべく能動的に通知する。
 */
async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.metadata?.team_id) return
  const admin = createAdminClient()
  const completed = account.charges_enabled && account.details_submitted

  const { data: team } = await admin
    .from("teams")
    .select("id, name, stripe_onboarding_completed")
    .eq("stripe_account_id", account.id)
    .maybeSingle()

  await admin
    .from("teams")
    .update({ stripe_onboarding_completed: completed })
    .eq("stripe_account_id", account.id)

  if (team && team.stripe_onboarding_completed && !completed) {
    const { data: admins } = await admin
      .from("team_members")
      .select("swimmer_id")
      .eq("team_id", team.id)
      .eq("role", "admin")
      .eq("status", "active")

    if (admins && admins.length > 0) {
      await notifyUsers(admins.map((a) => a.swimmer_id), {
        type: "payment_failed",
        title: "決済アカウントの連携が無効になりました",
        body: `「${team.name}」のStripe決済アカウントが利用できない状態になりました。設定を確認してください（この状態のままだと参加費の分配送金が行われません）。`,
        team_id: team.id,
        link: `/teams/${team.id}?tab=settings`,
      })
    }
  }
}

/**
 * コーチがStripeダッシュボード側からConnect連携を解除した際に送出されるイベント。
 * このイベントには data.object 側に有用な情報がなく、解除された Connected Account の
 * IDは Connect webhook共通で event.account に入る（Stripe Connect webhookの仕様）。
 * 連携が切れているのにteams側がstripe_account_idを保持し続けると、
 * 以降の決済・送金がすべて失敗するため、連携情報をクリアする。
 */
async function handleAccountApplicationDeauthorized(accountId: string) {
  const admin = createAdminClient()
  await admin
    .from("teams")
    .update({ stripe_account_id: null, stripe_onboarding_completed: false })
    .eq("stripe_account_id", accountId)
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

      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute)
        break

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge)
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

      case "account.application.deauthorized":
        if (!event.account) {
          console.error(`[webhook] account.application.deauthorized (${event.id}): missing event.account`)
          break
        }
        await handleAccountApplicationDeauthorized(event.account)
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
