// チームの会費金額(月謝)を後から変更した際、既にアクティブなStripe
// Subscriptionの価格が正しく追従するか(syncActiveSubscriptionsToNewPrice)の検証。
// team 0001(大阪スイミングクラブ)で、月謝額を1回目に変更してtest2の新規
// Subscriptionを開始させ(既存の未加入会員への遡及開始パス)、2回目の変更で
// 既にアクティブなSubscriptionの価格が正しく切り替わることを確認する。
import { chromium } from "@playwright/test"
import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const stripe = new Stripe(env.STRIPE_SECRET_KEY)

const BASE_URL = "http://localhost:3000"
const TEAM_ID = "dddddddd-dddd-dddd-dddd-000000000001" // 大阪スイミングクラブ
const TEST2_MEMBER_ID = "c1bf2383-61aa-4ae8-b204-4793245bddba"
const ORIGINAL_AMOUNT = 4000
const STEP1_AMOUNT = 4100 // 新規Subscription開始トリガー用
const STEP2_AMOUNT = 4500 // 既存Subscriptionの価格同期の確認用

function log(step, msg) {
  console.log(`[${new Date().toISOString()}] [${step}] ${msg}`)
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" })
  await page.locator("#email").fill(email)
  await page.locator("#password").fill(password)
  await page.getByRole("button", { name: "ログイン", exact: true }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

async function getMemberState() {
  const { data } = await supabase
    .from("team_members")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", TEST2_MEMBER_ID)
    .single()
  return data
}

async function setMonthlyFeeAmount(page, amount) {
  await page.goto(`${BASE_URL}/teams/${TEAM_ID}/edit`, { waitUntil: "networkidle" })
  const monthlyInput = page.locator("#monthly_fee_amount")
  await monthlyInput.fill(String(amount))
  await page.getByRole("button", { name: "変更を保存" }).click()
  await page.waitForTimeout(6000)
}

async function logCurrentPrice(subscriptionId, label) {
  if (!subscriptionId) return
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const price = sub.items.data[0]?.price
  log("result", `${label}: Stripe Subscription unit_amount=${price?.unit_amount}, status=${sub.status}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await login(page, "test2@example.com", "Delta-coach8820!")

    // Step 1: 月謝額を変更 → まだSubscriptionが無いtest2について
    // tryStartMonthlySubscriptionsForTeam(遡及開始)が走るはず
    await setMonthlyFeeAmount(page, STEP1_AMOUNT)
    log("step1", `月謝額を¥${ORIGINAL_AMOUNT} → ¥${STEP1_AMOUNT}に変更(新規Subscription開始を狙う)`)

    const afterStep1 = await getMemberState()
    log("result", `Step1後の会員状態: ${JSON.stringify(afterStep1)}`)
    if (!afterStep1.stripe_subscription_id) {
      throw new Error("Step1でSubscriptionが開始されませんでした。前提条件が崩れています")
    }
    await logCurrentPrice(afterStep1.stripe_subscription_id, "Step1直後")

    // Step 2: 既にアクティブ(または処理中)なSubscriptionがある状態で、
    // さらに月謝額を変更 → syncActiveSubscriptionsToNewPriceが走るはず
    await setMonthlyFeeAmount(page, STEP2_AMOUNT)
    log("step2", `月謝額を¥${STEP1_AMOUNT} → ¥${STEP2_AMOUNT}に変更(既存Subscriptionの価格同期を狙う)`)

    const afterStep2 = await getMemberState()
    log("result", `Step2後の会員状態: ${JSON.stringify(afterStep2)}`)
    await logCurrentPrice(afterStep2.stripe_subscription_id, "Step2直後(期待値: unit_amount=4500)")

    const { data: notifications } = await supabase
      .from("notifications")
      .select("type, title, body, created_at")
      .eq("team_id", TEAM_ID)
      .order("created_at", { ascending: false })
      .limit(3)
    log("result", `直近の通知: ${JSON.stringify(notifications)}`)

    // 後始末: 月謝額を元に戻す(逆方向の同期も併せて確認)
    await setMonthlyFeeAmount(page, ORIGINAL_AMOUNT)
    const afterRevert = await getMemberState()
    await logCurrentPrice(afterRevert.stripe_subscription_id, "元の金額に戻した後(期待値: unit_amount=4000)")

    // test2のSubscriptionをキャンセルして元の状態(null)に戻す
    if (afterRevert.stripe_subscription_id) {
      await stripe.subscriptions.cancel(afterRevert.stripe_subscription_id).catch((e) => log("cleanup", `cancel失敗(無視): ${e.message}`))
      await supabase.from("team_members").update({ stripe_subscription_id: null, subscription_status: null }).eq("id", TEST2_MEMBER_ID)
      log("cleanup", "test2のテスト用Subscriptionをキャンセルし、会員状態を元に戻しました")
    }
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
