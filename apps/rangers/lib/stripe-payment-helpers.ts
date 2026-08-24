import { randomUUID } from "node:crypto"
import Stripe from "stripe"
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

  // Step 1: PI作成（confirm前）— 課金はまだ発生しない。
  // Idempotency Keyは呼び出し1回ごとに新規生成する（registrationId等の固定値にすると、
  // 24時間以内の正当な再試行(retryPayment)がStripe側にキャッシュされた古いレスポンスを
  // 返してしまい新規PIが作られなくなる）。ここでの目的はSDKの自動ネットワークリトライで
  // 同一呼び出しが二重にPIを作成しないようにする防御であり、呼び出し単位で閉じていればよい。
  const createIdempotencyKey = randomUUID()
  // off_session は「confirm時に、顧客不在の請求であることをStripeに伝える」ための
  // パラメータであり、confirm=trueを同時に指定しない限りcreate時には渡せない
  // (渡すと invalid_request_error になる)。confirm は Step 3 で別途行うため、
  // ここでは付与しない。
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: "jpy",
    customer: stripeCustomerId,
    payment_method: stripePaymentMethodId,
    metadata: { session_id: sessionId, registration_id: registrationId, swimmer_id: swimmerId },
    ...(connectFees && connectAccountId ? {
      application_fee_amount: connectFees.platformFee,
      transfer_data: { destination: connectAccountId },
    } : {}),
  }, { idempotencyKey: createIdempotencyKey }).catch((err) => {
    console.error(`[chargeSessionRegistrationStripe] paymentIntents.create failed for registration ${registrationId}:`, err)
    return null
  })

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
    const { error: paidStatusErr } = await admin
      .from("session_registrations")
      .update({ payment_status: "paid" })
      .eq("id", registrationId)
    if (paidStatusErr) {
      // Stripe側の課金自体は成功しているためユーザー通知はそのまま行うが、
      // DB側がpendingのまま取り残されるとretryPaymentが拾えなくなるため、
      // webhook(payment_intent.succeeded)による事後整合までの間を追跡できるようログに残す
      console.error(`[chargeSessionRegistrationStripe] payment_status update to "paid" failed for ${registrationId}:`, paidStatusErr)
    }
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

interface RefundSessionRegistrationParams {
  admin: AdminClient
  registrationId: string
  stripePaymentIntentId: string
  /** ログメッセージ用の呼び出し元識別子（例: "[cancelSession]"） */
  logPrefix: string
}

type RefundResult = { ok: true } | { ok: false; error: string }

/**
 * セッション参加登録のStripe返金処理（transfer_records基準でのreverse_transfer判定
 * → refunds.create → transfer_records更新）を行う。
 * cancelSession・cancelRegistrationで重複していた返金フローをここに集約する。
 * session_registrations.payment_status の更新は呼び出し元の責務とする
 * （cancelSessionは即時更新、cancelRegistrationはcancelled_atと同一書き込みで
 * 原子的に更新するため、更新タイミングが異なる）。
 */
export async function refundSessionRegistrationStripe(
  params: RefundSessionRegistrationParams
): Promise<RefundResult> {
  const { admin, registrationId, stripePaymentIntentId, logPrefix } = params

  // この決済自体がConnect送金(destination charge)を伴ったかどうかを、Stripe上の
  // PaymentIntent.transfer_dataで直接判定する。以前はローカルのtransfer_recordsに
  // status='succeeded'の行があるかで判定していたが、chargeSessionRegistrationStripe
  // でのtransfer_records INSERT失敗(まれなDB障害等)やwebhook反映前のタイミングでは
  // 行が存在せずhasConnectが常にfalseになり、reverse_transferが漏れて送金済みの
  // 資金が引き戻されないままプラットフォームが返金額を丸かぶりする不整合があった。
  // Stripe自身が決済時に記録したtransfer_dataは事実そのものであり、ローカルの
  // 記帳漏れの影響を受けないため、これを一次情報源とする。
  let hasConnect: boolean
  try {
    const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId)
    hasConnect = !!pi.transfer_data
  } catch (err) {
    console.error(`${logPrefix} Failed to retrieve PaymentIntent ${stripePaymentIntentId} for transfer check:`, err)
    return { ok: false, error: "failed to verify payment intent transfer data" }
  }

  try {
    // Connect(Destination Charge)経由の決済は reverse_transfer を指定しないと
    // コーチ側へ送金済みの資金が自動的には引き戻されず、返金差額をプラット
    // フォームが負担することになるため明示的に指定する
    await stripe.refunds.create({
      payment_intent: stripePaymentIntentId,
      ...(hasConnect ? { reverse_transfer: true, refund_application_fee: true } : {}),
    })
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError && err.code === "charge_already_refunded") {
      // 前回の返金はStripeで成功していたがDB更新が失敗していたケース → DB更新に進む
      console.warn(`${logPrefix} Refund already processed for ${registrationId}, syncing DB status`)
    } else {
      console.error(`${logPrefix} Stripe refund failed for ${registrationId}:`, err)
      return { ok: false, error: "stripe refund failed" }
    }
  }

  if (hasConnect) {
    // 返金後もtransfer_records.statusが"succeeded"のままだと会計上の
    // 不整合になるため、返金済みとして反映する
    await admin
      .from("transfer_records")
      .update({ status: "reversed" })
      .eq("stripe_payment_intent_id", stripePaymentIntentId)
      .eq("status", "succeeded")
  }

  return { ok: true }
}
