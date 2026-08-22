import "server-only"
import { stripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/server"
import { mapWithConcurrency } from "@/lib/utils"

/**
 * これらの状態は、そのSubscriptionが二度と課金されない「行き止まり」であることを
 * 意味する(Stripe側で完全に終了しており、以後の状態遷移は無い)。該当する場合は
 * 既存の stripe_subscription_id を無視して新規Subscription作成を試みてよい。
 * past_due/unpaid/incomplete はまだ「復帰しうる」途中状態のため含めない。
 */
export const TERMINAL_SUBSCRIPTION_STATUSES = ["canceled", "incomplete_expired"] as const

export function isTerminalSubscriptionStatus(status: string | null): boolean {
  return !status || (TERMINAL_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)
}

/**
 * userId のユーザーに紐づく Stripe Customer を取得、または新規作成する。
 * 作成した Customer ID は profiles.stripe_customer_id に保存する。
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  // name が空文字の場合は Stripe に渡さない（ダッシュボードの検索性向上のため）
  let customer: Awaited<ReturnType<typeof stripe.customers.create>>
  try {
    customer = await stripe.customers.create({
      email,
      ...(name.trim() ? { name: name.trim() } : {}),
      metadata: { supabase_user_id: userId },
    })
  } catch (err) {
    console.error("[stripe] customers.create failed:", err)
    throw new Error("Stripe カスタマーの作成に失敗しました。時間を置いて再試行してください。")
  }

  // stripe_customer_id がまだ null の行のみ更新（並行リクエストによる二重作成を防ぐ）
  const { data: saved } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId)
    .is("stripe_customer_id", null)
    .select("stripe_customer_id")
    .maybeSingle()

  if (!saved) {
    // 別リクエストが先に書き込んだ場合: 今作成した Customer を削除して既存値を返す
    await stripe.customers.del(customer.id).catch(() => null)
    const { data: existing } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()
    return existing?.stripe_customer_id ?? customer.id
  }

  return customer.id
}

/**
 * チームの Stripe Product を取得または新規作成する。
 * Product ID は teams.stripe_product_id に保存する。
 */
export async function getOrCreateStripeProduct(
  teamId: string,
  teamName: string,
  existingProductId: string | null
): Promise<string> {
  if (existingProductId) return existingProductId

  // 1チーム1Productに、月謝(interval=month)・年会費(interval=year)それぞれの
  // Priceを紐づける構成（Stripeの一般的なプラン設計パターン）。そのため名称は
  // 「月謝」固定ではなく「会費」という中立的な表現にする。
  let product: Awaited<ReturnType<typeof stripe.products.create>>
  try {
    product = await stripe.products.create({
      name: `会費 - ${teamName}`,
      metadata: { team_id: teamId },
    })
  } catch (err) {
    console.error("[stripe] products.create failed:", err)
    throw new Error("Stripe プロダクトの作成に失敗しました。時間を置いて再試行してください。")
  }

  const admin = createAdminClient()
  // stripe_product_id がまだ null の行のみ更新（並行リクエストによる重複Product作成を防ぐ）
  const { data: saved } = await admin
    .from("teams")
    .update({ stripe_product_id: product.id })
    .eq("id", teamId)
    .is("stripe_product_id", null)
    .select("stripe_product_id")
    .maybeSingle()

  if (!saved) {
    // 別リクエストが先に書き込んだ場合: 今作成したProductをarchiveして既存値を返す
    await stripe.products.update(product.id, { active: false }).catch(() => null)
    const { data: existing } = await admin
      .from("teams")
      .select("stripe_product_id")
      .eq("id", teamId)
      .single()
    return existing?.stripe_product_id ?? product.id
  }

  return product.id
}

/**
 * チームの月謝 Stripe Price を取得または新規作成する。
 * 金額が変わった場合は新しい Price を作成して teams.stripe_monthly_price_id を更新する。
 */
export async function getOrCreateMonthlyPrice(
  teamId: string,
  amount: number,
  productId: string,
  existingPriceId: string | null
): Promise<string> {
  // 既存の Price がある場合は金額確認
  if (existingPriceId) {
    const existingPrice = await stripe.prices.retrieve(existingPriceId).catch(() => null)
    if (existingPrice && existingPrice.unit_amount === amount && existingPrice.active) {
      return existingPriceId
    }
  }

  // 新しい Price を作成
  let price: Awaited<ReturnType<typeof stripe.prices.create>>
  try {
    price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: "jpy",
      recurring: { interval: "month" },
      metadata: { team_id: teamId },
    })
  } catch (err) {
    console.error("[stripe] prices.create failed:", err)
    throw new Error("Stripe 料金プランの作成に失敗しました。時間を置いて再試行してください。")
  }

  const admin = createAdminClient()
  // 読み取り時点のexistingPriceIdから値が変わっていない行のみ更新
  // （並行リクエストによる重複Price作成を防ぐ。getOrCreateStripeCustomerと同じパターン）
  let updateQuery = admin.from("teams").update({ stripe_monthly_price_id: price.id }).eq("id", teamId)
  updateQuery = existingPriceId
    ? updateQuery.eq("stripe_monthly_price_id", existingPriceId)
    : updateQuery.is("stripe_monthly_price_id", null)
  const { data: saved } = await updateQuery.select("stripe_monthly_price_id").maybeSingle()

  if (!saved) {
    // 別リクエストが先に書き込んだ場合: 今作成したPriceをarchiveして既存値を返す
    await stripe.prices.update(price.id, { active: false }).catch(() => null)
    const { data: existing } = await admin
      .from("teams")
      .select("stripe_monthly_price_id")
      .eq("id", teamId)
      .single()
    return existing?.stripe_monthly_price_id ?? price.id
  }

  return price.id
}

/**
 * チームの年会費 Stripe Price を取得または新規作成する。
 * 金額が変わった場合は新しい Price を作成して teams.stripe_annual_price_id を更新する。
 * getOrCreateMonthlyPrice と対になる関数（interval が year になるだけで構造は同一）。
 */
export async function getOrCreateAnnualPrice(
  teamId: string,
  amount: number,
  productId: string,
  existingPriceId: string | null
): Promise<string> {
  // 既存の Price がある場合は金額確認
  if (existingPriceId) {
    const existingPrice = await stripe.prices.retrieve(existingPriceId).catch(() => null)
    if (existingPrice && existingPrice.unit_amount === amount && existingPrice.active) {
      return existingPriceId
    }
  }

  // 新しい Price を作成
  let price: Awaited<ReturnType<typeof stripe.prices.create>>
  try {
    price = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: "jpy",
      recurring: { interval: "year" },
      metadata: { team_id: teamId },
    })
  } catch (err) {
    console.error("[stripe] prices.create (annual) failed:", err)
    throw new Error("Stripe 料金プランの作成に失敗しました。時間を置いて再試行してください。")
  }

  const admin = createAdminClient()
  // 読み取り時点のexistingPriceIdから値が変わっていない行のみ更新
  // （並行リクエストによる重複Price作成を防ぐ。getOrCreateMonthlyPriceと同じパターン）
  let updateQuery = admin.from("teams").update({ stripe_annual_price_id: price.id }).eq("id", teamId)
  updateQuery = existingPriceId
    ? updateQuery.eq("stripe_annual_price_id", existingPriceId)
    : updateQuery.is("stripe_annual_price_id", null)
  const { data: saved } = await updateQuery.select("stripe_annual_price_id").maybeSingle()

  if (!saved) {
    // 別リクエストが先に書き込んだ場合: 今作成したPriceをarchiveして既存値を返す
    await stripe.prices.update(price.id, { active: false }).catch(() => null)
    const { data: existing } = await admin
      .from("teams")
      .select("stripe_annual_price_id")
      .eq("id", teamId)
      .single()
    return existing?.stripe_annual_price_id ?? price.id
  }

  return price.id
}

/**
 * 月謝会員が入会した際に、既にカードを登録済みであれば自動でStripe Subscriptionを
 * 開始する。以下のいずれかに該当する場合は何もせず skipped 理由を返す(エラー扱いにしない):
 * Stripe未設定・既にSubscription有り・カード未登録・チームに月謝金額が未設定。
 * 呼び出し元(入会処理)はこれをブロッキングせず、失敗してもログに残すだけで
 * 入会自体は成立させる(membership_fees の年会費自動生成と同じ非致命的スタンス)。
 */
export async function tryStartMonthlySubscription(
  teamId: string,
  swimmerId: string
): Promise<{ started: boolean; skipped?: string; error?: string }> {
  if (!process.env.STRIPE_SECRET_KEY) return { started: false, skipped: "stripe_not_configured" }

  const admin = createAdminClient()

  const { data: member } = await admin
    .from("team_members")
    .select("id, stripe_subscription_id, subscription_status")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .eq("status", "active")
    .single()
  if (!member) return { started: false, skipped: "member_not_found" }
  // 行き止まり状態(キャンセル済み・認証期限切れ)のSubscription IDが残っている場合
  // (種別変更で一度キャンセルした後、再度月謝に戻した等)は再開できるようスキップしない
  if (member.stripe_subscription_id && !isTerminalSubscriptionStatus(member.subscription_status)) {
    return { started: false, skipped: "already_subscribed" }
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_payment_method_id, name")
    .eq("id", swimmerId)
    .single()
  if (!profile?.stripe_payment_method_id) return { started: false, skipped: "no_payment_method" }

  const { data: team } = await admin
    .from("teams")
    .select("name, monthly_fee_amount, stripe_product_id, stripe_monthly_price_id")
    .eq("id", teamId)
    .single()
  if (!team?.monthly_fee_amount || team.monthly_fee_amount <= 0) {
    return { started: false, skipped: "no_fee_configured" }
  }

  const { data: authData } = await admin.auth.admin.getUserById(swimmerId)
  const email = authData?.user?.email ?? ""

  let customerId: string
  let productId: string
  let priceId: string
  try {
    customerId = await getOrCreateStripeCustomer(swimmerId, email, profile.name ?? "")
    productId = await getOrCreateStripeProduct(teamId, team.name, team.stripe_product_id)
    priceId = await getOrCreateMonthlyPrice(teamId, team.monthly_fee_amount, productId, team.stripe_monthly_price_id)
  } catch (err) {
    console.error("[tryStartMonthlySubscription] Stripe setup failed:", err)
    return { started: false, error: err instanceof Error ? err.message : "Stripe の準備に失敗しました" }
  }

  // idempotencyKey は team_member_id + 直前のSubscription ID(無ければ"initial")の組で
  // 一意化する。member.id だけをキーにすると、キャンセル後の再開時にStripeが古い
  // (既にキャンセル済みの)Subscription作成レスポンスをキャッシュから返してしまい、
  // 実際には新しいSubscriptionが作られない、という不具合になるため。
  const idempotencySuffix = member.stripe_subscription_id ?? "initial"
  let subscription: Awaited<ReturnType<typeof stripe.subscriptions.create>>
  try {
    subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        // fee_type: webhook(invoice.paid等)がこのSubscriptionが月謝/年会費どちらの
        // ものかを判定するために使う（membership_feesへの記録・通知文の分岐に必要）
        metadata: { team_id: teamId, swimmer_id: swimmerId, team_member_id: member.id, fee_type: "monthly" },
      },
      { idempotencyKey: `subscription-create-monthly-${member.id}-${idempotencySuffix}` }
    )
  } catch (err) {
    console.error("[tryStartMonthlySubscription] Stripe subscription create failed:", err)
    return { started: false, error: "Subscription の作成に失敗しました" }
  }

  const { error: dbErr } = await admin
    .from("team_members")
    .update({ stripe_subscription_id: subscription.id, subscription_status: subscription.status })
    .eq("id", member.id)

  if (dbErr) {
    // DB 保存失敗 → Stripe Subscription をキャンセルしてロールバック
    await stripe.subscriptions.cancel(subscription.id).catch(() => null)
    console.error("[tryStartMonthlySubscription] DB save failed:", dbErr)
    return { started: false, error: "Subscription の保存に失敗しました" }
  }

  await payInitialInvoiceOffSession(subscription, profile.stripe_payment_method_id, "tryStartMonthlySubscription")

  return { started: true }
}

/**
 * 年会費会員が入会した際に、既にカードを登録済みであれば自動でStripe Subscriptionを
 * 開始する(interval=year)。tryStartMonthlySubscriptionと対になる関数で、判定条件・
 * 非致命的なskip方針は同一（annual_fee_amount/stripe_annual_price_idを読む点のみ異なる）。
 * カード未登録・Stripe未設定の場合は呼び出し元が現金払いの年会費レコードを
 * 生成する既存フローにフォールバックする。
 */
export async function tryStartAnnualSubscription(
  teamId: string,
  swimmerId: string
): Promise<{ started: boolean; skipped?: string; error?: string }> {
  if (!process.env.STRIPE_SECRET_KEY) return { started: false, skipped: "stripe_not_configured" }

  const admin = createAdminClient()

  const { data: member } = await admin
    .from("team_members")
    .select("id, stripe_subscription_id, subscription_status")
    .eq("team_id", teamId)
    .eq("swimmer_id", swimmerId)
    .eq("status", "active")
    .single()
  if (!member) return { started: false, skipped: "member_not_found" }
  if (member.stripe_subscription_id && !isTerminalSubscriptionStatus(member.subscription_status)) {
    return { started: false, skipped: "already_subscribed" }
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_payment_method_id, name")
    .eq("id", swimmerId)
    .single()
  if (!profile?.stripe_payment_method_id) return { started: false, skipped: "no_payment_method" }

  const { data: team } = await admin
    .from("teams")
    .select("name, annual_fee_amount, stripe_product_id, stripe_annual_price_id")
    .eq("id", teamId)
    .single()
  if (!team?.annual_fee_amount || team.annual_fee_amount <= 0) {
    return { started: false, skipped: "no_fee_configured" }
  }

  const { data: authData } = await admin.auth.admin.getUserById(swimmerId)
  const email = authData?.user?.email ?? ""

  let customerId: string
  let productId: string
  let priceId: string
  try {
    customerId = await getOrCreateStripeCustomer(swimmerId, email, profile.name ?? "")
    productId = await getOrCreateStripeProduct(teamId, team.name, team.stripe_product_id)
    priceId = await getOrCreateAnnualPrice(teamId, team.annual_fee_amount, productId, team.stripe_annual_price_id)
  } catch (err) {
    console.error("[tryStartAnnualSubscription] Stripe setup failed:", err)
    return { started: false, error: err instanceof Error ? err.message : "Stripe の準備に失敗しました" }
  }

  const idempotencySuffix = member.stripe_subscription_id ?? "initial"
  let subscription: Awaited<ReturnType<typeof stripe.subscriptions.create>>
  try {
    subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          payment_method_types: ["card"],
          save_default_payment_method: "on_subscription",
        },
        metadata: { team_id: teamId, swimmer_id: swimmerId, team_member_id: member.id, fee_type: "annual" },
      },
      { idempotencyKey: `subscription-create-annual-${member.id}-${idempotencySuffix}` }
    )
  } catch (err) {
    console.error("[tryStartAnnualSubscription] Stripe subscription create failed:", err)
    return { started: false, error: "Subscription の作成に失敗しました" }
  }

  const { error: dbErr } = await admin
    .from("team_members")
    .update({ stripe_subscription_id: subscription.id, subscription_status: subscription.status })
    .eq("id", member.id)

  if (dbErr) {
    // DB 保存失敗 → Stripe Subscription をキャンセルしてロールバック
    await stripe.subscriptions.cancel(subscription.id).catch(() => null)
    console.error("[tryStartAnnualSubscription] DB save failed:", dbErr)
    return { started: false, error: "Subscription の保存に失敗しました" }
  }

  await payInitialInvoiceOffSession(subscription, profile.stripe_payment_method_id, "tryStartAnnualSubscription")

  return { started: true }
}

/**
 * payment_behavior: "default_incomplete" で作成したSubscriptionの初回インボイスは
 * auto_advance=false で作成され、Stripe側が自動では課金しない
 * (Stripe.js等でユーザー操作を挟む余地を残すための仕様)。このアプリは既に保存済みの
 * カードでオフセッション課金する運用のため、作成直後にここで明示的に確定させる。
 * 失敗しても例外にはしない(呼び出し元のSubscription作成自体は成功しているため)。
 * 失敗時はStripe側のinvoice.payment_failed webhookがpast_due遷移・通知を担う。
 */
async function payInitialInvoiceOffSession(
  subscription: Awaited<ReturnType<typeof stripe.subscriptions.create>>,
  paymentMethodId: string,
  logPrefix: string
): Promise<void> {
  const invoiceId =
    typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : subscription.latest_invoice?.id
  if (!invoiceId) return

  try {
    await stripe.invoices.pay(invoiceId, { payment_method: paymentMethodId })
  } catch (err) {
    console.error(`[${logPrefix}] initial invoice payment failed:`, err)
  }
}

// チーム一括開始の同時実行数(Stripe API呼び出しが多くなりすぎないよう制限。
// actions/subscriptions.ts の SUBSCRIPTION_SYNC_CONCURRENCY と同じ考え方)
const BULK_SUBSCRIPTION_START_CONCURRENCY = 5

/**
 * チーム内の「月謝会員だがまだSubscriptionが無い(または過去にキャンセル済みの)」
 * 会員全員について、既にカード登録済みであれば自動でStripe Subscriptionを開始する。
 * チームが月謝額を新規設定・変更した際(それまで対象外だった既存会員を遡って
 * 拾うため)に呼び出す想定。tryStartMonthlySubscription 自体が全ての前提条件
 * (カード有無・金額設定・Stripe設定)を再チェックするため、ここでは対象候補を
 * 絞り込んで渡すだけでよい。
 */
export async function tryStartMonthlySubscriptionsForTeam(
  teamId: string
): Promise<{ started: number; skipped: number }> {
  if (!process.env.STRIPE_SECRET_KEY) return { started: 0, skipped: 0 }

  const admin = createAdminClient()
  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, stripe_subscription_id, subscription_status")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "monthly")

  if (!members || members.length === 0) return { started: 0, skipped: 0 }

  const targets = members.filter(
    (m) => !m.stripe_subscription_id || isTerminalSubscriptionStatus(m.subscription_status)
  )
  if (targets.length === 0) return { started: 0, skipped: 0 }

  let started = 0
  let skipped = 0
  await mapWithConcurrency(targets, BULK_SUBSCRIPTION_START_CONCURRENCY, async (m) => {
    const result = await tryStartMonthlySubscription(teamId, m.swimmer_id)
    if (result.started) started++
    else skipped++
    if (result.error) {
      console.error(`[tryStartMonthlySubscriptionsForTeam] failed for swimmer ${m.swimmer_id}:`, result.error)
    }
  })

  return { started, skipped }
}

/**
 * チーム内の「年会費会員だがまだSubscriptionが無い(または過去にキャンセル済みの)」
 * 会員全員について、既にカード登録済みであれば自動でStripe Subscriptionを開始する。
 * tryStartMonthlySubscriptionsForTeamと対になる関数（membership_typeがannualになるだけ）。
 */
export async function tryStartAnnualSubscriptionsForTeam(
  teamId: string
): Promise<{ started: number; skipped: number }> {
  if (!process.env.STRIPE_SECRET_KEY) return { started: 0, skipped: 0 }

  const admin = createAdminClient()
  const { data: members } = await admin
    .from("team_members")
    .select("swimmer_id, stripe_subscription_id, subscription_status")
    .eq("team_id", teamId)
    .eq("status", "active")
    .eq("membership_type", "annual")

  if (!members || members.length === 0) return { started: 0, skipped: 0 }

  const targets = members.filter(
    (m) => !m.stripe_subscription_id || isTerminalSubscriptionStatus(m.subscription_status)
  )
  if (targets.length === 0) return { started: 0, skipped: 0 }

  let started = 0
  let skipped = 0
  await mapWithConcurrency(targets, BULK_SUBSCRIPTION_START_CONCURRENCY, async (m) => {
    const result = await tryStartAnnualSubscription(teamId, m.swimmer_id)
    if (result.started) started++
    else skipped++
    if (result.error) {
      console.error(`[tryStartAnnualSubscriptionsForTeam] failed for swimmer ${m.swimmer_id}:`, result.error)
    }
  })

  return { started, skipped }
}

/**
 * Stripe PaymentMethod ID からカード情報（ブランド・末4桁・有効期限）を取得する。
 * 取得失敗時は null を返す。
 */
export async function getCardDetails(paymentMethodId: string): Promise<{
  brand: string
  last4: string
  expMonth: number
  expYear: number
} | null> {
  try {
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (!pm.card) return null
    return {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    }
  } catch {
    return null
  }
}
