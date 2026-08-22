// 年会費Subscriptionの「翌年自動更新課金」および「更新時の課金失敗」を
// Stripe Test Clock APIで検証するスクリプト。
//
// 実行方法:
//   node scripts/test-annual-renewal-testclock.mjs success   # 更新課金が成功するケース
//   node scripts/test-annual-renewal-testclock.mjs failure   # 更新時にカードが無効化されているケース
//
// 前提:
//   - .env.local の STRIPE_SECRET_KEY がテストモード(sk_test_)であること
//   - ローカルで `pnpm dev`(port 3000)と `stripe listen --forward-to
//     localhost:3000/api/stripe/webhook` が起動していること
//   - マウントリバー水泳クラブ(team_id指定)にtest4が年会費会員として
//     存在すること(このスクリプトが stripe_subscription_id を直接上書きする)
import { readFileSync } from "fs"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

function loadEnv() {
  const content = readFileSync(".env.local", "utf8")
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")
  }
  return env
}

const env = loadEnv()
const stripe = new Stripe(env.STRIPE_SECRET_KEY)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const TEAM_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" // マウントリバー水泳クラブ
const SWIMMER_ID = "8e538fba-2637-4abf-aa9f-5b784cb2f561" // test4@example.com
const TEAM_MEMBER_ID = "94d74428-099b-40e4-a658-be23d40bf5cc"
const ANNUAL_PRICE_ID = "price_1U76FgD6E87vdNswTs70LI1P"

function log(step, msg) {
  console.log(`[${new Date().toISOString()}] [${step}] ${msg}`)
}

async function waitClockReady(clockId, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId)
    if (clock.status === "ready") return
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error(`test clock ${clockId} did not become ready within ${timeoutMs}ms`)
}

async function linkSubscriptionToTeamMember(subscriptionId, status) {
  const { error } = await supabase
    .from("team_members")
    .update({ stripe_subscription_id: subscriptionId, subscription_status: status })
    .eq("id", TEAM_MEMBER_ID)
  if (error) throw new Error(`failed to link subscription to team_member: ${error.message}`)
}

async function getMembershipFees() {
  const { data, error } = await supabase
    .from("membership_fees")
    .select("id, type, period, amount, payment_method, status, paid_at, stripe_invoice_id")
    .eq("team_id", TEAM_ID)
    .eq("swimmer_id", SWIMMER_ID)
    .order("created_at", { ascending: false })
    .limit(5)
  if (error) throw new Error(error.message)
  return data
}

async function getTeamMemberStatus() {
  const { data, error } = await supabase
    .from("team_members")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", TEAM_MEMBER_ID)
    .single()
  if (error) throw new Error(error.message)
  return data
}

async function runSuccessScenario() {
  log("setup", "テストクロックを作成します(更新課金 成功シナリオ)")
  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: "annual-renewal-success",
  })
  log("setup", `test clock: ${clock.id}`)

  const customer = await stripe.customers.create({
    email: "test-annual-renewal-success@example.com",
    test_clock: clock.id,
  })
  const pm = await stripe.paymentMethods.attach("pm_card_visa", { customer: customer.id })
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } })
  log("setup", `customer: ${customer.id}, payment_method: ${pm.id}`)

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: ANNUAL_PRICE_ID }],
    payment_behavior: "default_incomplete",
    payment_settings: { payment_method_types: ["card"], save_default_payment_method: "on_subscription" },
    metadata: { team_id: TEAM_ID, swimmer_id: SWIMMER_ID, team_member_id: TEAM_MEMBER_ID, fee_type: "annual" },
  })
  log("setup", `subscription: ${subscription.id} (status=${subscription.status})`)

  await linkSubscriptionToTeamMember(subscription.id, subscription.status)

  const invoiceId =
    typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : subscription.latest_invoice?.id
  await stripe.invoices.pay(invoiceId, { payment_method: pm.id })
  log("initial-charge", "初回インボイスを確定しました。webhook反映を5秒待ちます")
  await new Promise((r) => setTimeout(r, 5000))

  let fees = await getMembershipFees()
  let tmStatus = await getTeamMemberStatus()
  log("initial-charge", `team_members.subscription_status = ${tmStatus.subscription_status}`)
  log("initial-charge", `membership_fees(直近): ${JSON.stringify(fees[0])}`)

  const subDebug = await stripe.subscriptions.retrieve(subscription.id)
  log("debug", `subscription.metadata = ${JSON.stringify(subDebug.metadata)}`)
  const invoiceDebug = await stripe.invoices.retrieve(invoiceId)
  log("debug", `invoice: status=${invoiceDebug.status} amount_paid=${invoiceDebug.amount_paid} period_start=${invoiceDebug.period_start} (${new Date(invoiceDebug.period_start * 1000).toISOString()})`)

  const subAfterInitial = subDebug
  const renewalAt = subAfterInitial.items.data[0].current_period_end
  log("advance-1", `更新日時(${new Date(renewalAt * 1000).toISOString()})まで時計を進めます`)
  const advanced1 = await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: renewalAt })
  await waitClockReady(advanced1.id)
  log("advance-1", "clock ready")

  log("advance-2", "請求書がdraftからfinalized/paidになるよう、さらに1時間進めます")
  const advanced2 = await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: renewalAt + 3600 })
  await waitClockReady(advanced2.id)
  log("advance-2", "clock ready. webhook反映を5秒待ちます")
  await new Promise((r) => setTimeout(r, 5000))

  fees = await getMembershipFees()
  tmStatus = await getTeamMemberStatus()
  log("result", `team_members.subscription_status = ${tmStatus.subscription_status}`)
  log("result", `membership_fees(直近2件): ${JSON.stringify(fees.slice(0, 2))}`)

  const renewalInvoices = await stripe.invoices.list({ subscription: subscription.id, limit: 5 })
  for (const inv of renewalInvoices.data) {
    log("debug", `invoice ${inv.id}: status=${inv.status} amount_paid=${inv.amount_paid} period_start=${new Date(inv.period_start * 1000).toISOString()}`)
  }

  if (process.env.KEEP_CLOCK === "1") {
    log("cleanup", `KEEP_CLOCK=1のため test clock (${clock.id}) / subscription (${subscription.id}) を削除せず残します`)
  } else {
    await stripe.testHelpers.testClocks.del(clock.id)
    log("cleanup", "test clock削除完了")
  }
}

async function runFailureScenario() {
  log("setup", "テストクロックを作成します(更新時課金失敗シナリオ)")
  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: "annual-renewal-failure",
  })
  log("setup", `test clock: ${clock.id}`)

  const customer = await stripe.customers.create({
    email: "test-annual-renewal-failure@example.com",
    test_clock: clock.id,
  })
  const pm = await stripe.paymentMethods.attach("pm_card_visa", { customer: customer.id })
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } })
  log("setup", `customer: ${customer.id}, payment_method: ${pm.id}`)

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: ANNUAL_PRICE_ID }],
    payment_behavior: "default_incomplete",
    payment_settings: { payment_method_types: ["card"], save_default_payment_method: "on_subscription" },
    metadata: { team_id: TEAM_ID, swimmer_id: SWIMMER_ID, team_member_id: TEAM_MEMBER_ID, fee_type: "annual" },
  })
  log("setup", `subscription: ${subscription.id} (status=${subscription.status})`)

  await linkSubscriptionToTeamMember(subscription.id, subscription.status)

  const invoiceId =
    typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : subscription.latest_invoice?.id
  await stripe.invoices.pay(invoiceId, { payment_method: pm.id })
  log("initial-charge", "初回インボイスを確定しました。webhook反映を5秒待ちます")
  await new Promise((r) => setTimeout(r, 5000))

  let tmStatus = await getTeamMemberStatus()
  log("initial-charge", `team_members.subscription_status = ${tmStatus.subscription_status}`)

  // 更新前にカードを無効化する(退会済みカード・期限切れ等を想定した現実的な失敗シナリオ)
  await stripe.paymentMethods.detach(pm.id)
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: "" } })
  log("detach", "決済手段を無効化しました(カードが使えなくなった状態を再現)")

  const subAfterInitial = await stripe.subscriptions.retrieve(subscription.id)
  const renewalAt = subAfterInitial.items.data[0].current_period_end
  log("advance-1", `更新日時(${new Date(renewalAt * 1000).toISOString()})まで時計を進めます`)
  const advanced1 = await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: renewalAt })
  await waitClockReady(advanced1.id)
  log("advance-1", "clock ready")

  log("advance-2", "請求書の確定・課金試行を待つため、さらに1時間進めます")
  const advanced2 = await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: renewalAt + 3600 })
  await waitClockReady(advanced2.id)
  log("advance-2", "clock ready. webhook反映を5秒待ちます")
  await new Promise((r) => setTimeout(r, 5000))

  tmStatus = await getTeamMemberStatus()
  log("result", `team_members.subscription_status = ${tmStatus.subscription_status} (past_dueになっているはず)`)

  const { data: notifications } = await supabase
    .from("notifications")
    .select("type, title, body, created_at")
    .eq("team_id", TEAM_ID)
    .order("created_at", { ascending: false })
    .limit(5)
  log("result", `直近の通知: ${JSON.stringify(notifications)}`)

  await stripe.testHelpers.testClocks.del(clock.id)
  log("cleanup", "test clock削除完了")
}

const scenario = process.argv[2]
if (scenario === "success") {
  runSuccessScenario().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
} else if (scenario === "failure") {
  runFailureScenario().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
} else {
  console.error('Usage: node scripts/test-annual-renewal-testclock.mjs <success|failure>')
  process.exit(1)
}
