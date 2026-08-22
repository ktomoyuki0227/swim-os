// 月謝Subscriptionの「翌月自動更新課金」をStripe Test Clock APIで検証する。
// 年会費側で発見した「2回目以降のインボイスのperiod計算が誤っていて記録が
// 消える」不具合の修正が月謝側にも正しく効いているかを確認する回帰テスト。
//
// 実行方法: node scripts/test-monthly-renewal-testclock.mjs
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

const TEAM_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" // 東京マスターズ水泳クラブ
const SWIMMER_ID = "8e538fba-2637-4abf-aa9f-5b784cb2f561" // test4@example.com
const TEAM_MEMBER_ID = "3a0ffe00-44b7-4bf8-8f56-f2b5f3b7b4b0"
const MONTHLY_PRICE_ID = "price_1U76bcD6E87vdNswBTHgkUXA"

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

async function main() {
  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: "monthly-renewal-regression",
  })
  log("setup", `test clock: ${clock.id}`)

  const customer = await stripe.customers.create({
    email: "test-monthly-renewal-regression@example.com",
    test_clock: clock.id,
  })
  const pm = await stripe.paymentMethods.attach("pm_card_visa", { customer: customer.id })
  await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } })

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: MONTHLY_PRICE_ID }],
    payment_behavior: "default_incomplete",
    payment_settings: { payment_method_types: ["card"], save_default_payment_method: "on_subscription" },
    metadata: { team_id: TEAM_ID, swimmer_id: SWIMMER_ID, team_member_id: TEAM_MEMBER_ID, fee_type: "monthly" },
  })
  log("setup", `subscription: ${subscription.id}`)

  await supabase.from("team_members").update({
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
  }).eq("id", TEAM_MEMBER_ID)

  const invoiceId =
    typeof subscription.latest_invoice === "string" ? subscription.latest_invoice : subscription.latest_invoice?.id
  await stripe.invoices.pay(invoiceId, { payment_method: pm.id })
  log("initial-charge", "初回課金完了。5秒待機")
  await new Promise((r) => setTimeout(r, 5000))

  // 月次サブスクは一度に最大2ヶ月分しか進められないため、2回に分けて2ヶ月先まで進める
  const sub1 = await stripe.subscriptions.retrieve(subscription.id)
  const month2Start = sub1.items.data[0].current_period_end
  log("advance", `1ヶ月後(${new Date(month2Start * 1000).toISOString()})まで進めます`)
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: month2Start })
  await waitClockReady(clock.id)
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: month2Start + 3600 })
  await waitClockReady(clock.id)
  await new Promise((r) => setTimeout(r, 5000))

  const sub2 = await stripe.subscriptions.retrieve(subscription.id)
  const month3Start = sub2.items.data[0].current_period_end
  log("advance", `さらに1ヶ月後(${new Date(month3Start * 1000).toISOString()})まで進めます`)
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: month3Start })
  await waitClockReady(clock.id)
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: month3Start + 3600 })
  await waitClockReady(clock.id)
  await new Promise((r) => setTimeout(r, 5000))

  const { data: fees } = await supabase
    .from("membership_fees")
    .select("period, amount, status, stripe_invoice_id")
    .eq("stripe_subscription_id", subscription.id)
    .order("period", { ascending: true })
  log("result", `記録されたmembership_fees(period昇順): ${JSON.stringify(fees)}`)
  log("result", fees && fees.length === 3 ? "OK: 3ヶ月分すべて異なるperiodで記録された" : `NG: 期待した3件が記録されていない(${fees?.length ?? 0}件)`)

  await stripe.testHelpers.testClocks.del(clock.id)
  log("cleanup", "test clock削除完了")
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
