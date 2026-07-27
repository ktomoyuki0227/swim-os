import { stripe } from "@/lib/stripe"
import { calculateFees } from "@/lib/stripe-connect"
import { notifyUser } from "@/lib/notifications"
import type { createAdminClient } from "@/lib/supabase/server"

type AdminClient = ReturnType<typeof createAdminClient>

interface ChargeSessionRegistrationParams {
  admin: AdminClient
  registrationId: string
  swimmerId: string
  sessionId: string
  sessionTitle: string
  teamId: string
  amount: number
  stripeCustomerId: string
  stripePaymentMethodId: string
  /** Connect送金先のアカウントID。Connect未設定のチームはnullを渡す */
  connectAccountId: string | null
  feePercent: number
}

type ChargeResult = { ok: true } | { ok: false; error: string }

/**
 * セッション参加費のStripe決済（PI作成 → DB保存 → Connect送金記録 → confirm）を行う。
 * confirmSession・retryPaymentで重複していた一連の決済フローをここに集約する。
 * 呼び出し元は事前に payment_status を "pending" にした上で呼び出すこと。
 */
export async function chargeSessionRegistrationStripe(
  params: ChargeSessionRegistrationParams
): Promise<ChargeResult> {
  const {
    admin, registrationId, swimmerId, sessionId, sessionTitle, teamId,
    amount, stripeCustomerId, stripePaymentMethodId, connectAccountId, feePercent,
  } = params

  const connectFees = connectAccountId ? calculateFees(amount, feePercent) : null

  // Step 1: PI作成（confirm前）— 課金はまだ発生しない
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: "jpy",
    customer: stripeCustomerId,
    payment_method: stripePaymentMethodId,
    off_session: true,
    metadata: { session_id: sessionId, registration_id: registrationId, swimmer_id: swimmerId },
    ...(connectFees && connectAccountId ? {
      application_fee_amount: connectFees.platformFee,
      transfer_data: { destination: connectAccountId },
    } : {}),
  }).catch(() => null)

  if (!pi) {
    await admin.from("session_registrations").update({ payment_status: "failed" }).eq("id", registrationId)
    await notifyUser(swimmerId, {
      type: "payment_failed",
      title: `「${sessionTitle}」の参加費決済に失敗しました`,
      body: "決済処理中にエラーが発生しました。カード情報をご確認ください",
      team_id: teamId,
      link: "/payments",
    })
    return { ok: false, error: "stripe payment intent creation failed" }
  }

  // Step 2: PI idをDBに保存（confirmより先）— webhookが後から拾える状態にする
  const { error: piSaveErr } = await admin
    .from("session_registrations")
    .update({ stripe_payment_intent_id: pi.id })
    .eq("id", registrationId)
  if (piSaveErr) {
    // DB保存失敗 → 未請求PIを取り消してスキップ（ユーザーへの課金なし）
    await stripe.paymentIntents.cancel(pi.id).catch(() => null)
    await admin.from("session_registrations").update({ payment_status: "failed" }).eq("id", registrationId)
    return { ok: false, error: "failed to save payment intent id" }
  }

  // Connect 送金記録は confirm より先に pending で作成しておく。
  // webhook の payment_intent.succeeded がこの後の confirm() より先に届いても
  // 更新対象の行が既に存在するため、条件付きUPDATEがサイレントに0件ヒットしない。
  if (connectFees && connectAccountId) {
    const { error: trErr } = await admin.from("transfer_records").insert({
      team_id: teamId,
      session_id: sessionId,
      registration_id: registrationId,
      stripe_payment_intent_id: pi.id,
      amount,
      platform_fee: connectFees.platformFee,
      net_amount: connectFees.netAmount,
      status: "pending",
    })
    if (trErr) {
      console.error(`[chargeSessionRegistrationStripe] transfer_records insert failed for PI ${pi.id}:`, trErr)
    }
  }

  // Step 3: 確定（ここで実際に課金）— 失敗してもwebhookがDBを更新できる
  try {
    await stripe.paymentIntents.confirm(pi.id, { off_session: true })
    await admin.from("session_registrations").update({ payment_status: "paid" }).eq("id", registrationId)
    await notifyUser(swimmerId, {
      type: "payment_charged",
      title: `「${sessionTitle}」の参加費が決済されました`,
      body: `¥${amount.toLocaleString()}が引き落とされました`,
      team_id: teamId,
      link: "/payments",
    })
    return { ok: true }
  } catch (err) {
    console.error(`[chargeSessionRegistrationStripe] Stripe confirm failed for ${registrationId}:`, err)
    await admin.from("session_registrations").update({ payment_status: "failed" }).eq("id", registrationId)
    await admin
      .from("transfer_records")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", pi.id)
      .eq("status", "pending")
    await notifyUser(swimmerId, {
      type: "payment_failed",
      title: `「${sessionTitle}」の参加費決済に失敗しました`,
      body: "お支払いカードへの請求に失敗しました。カード情報をご確認ください",
      team_id: teamId,
      link: "/payments",
    })
    return { ok: false, error: "stripe confirm failed" }
  }
}
