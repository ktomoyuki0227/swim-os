// 「ゲスト(非会員)参加費」×「Stripe Connect未設定チーム」の決済フローのテスト。
// team 0001(大阪スイミングクラブ, stripe_account_id=null)は一度もConnectを
// 設定していないチーム。この場合 connectAccountId=null で決済され、
// transfer_dataなし・feePercent=0(全額プラットフォーム残高)で正常に課金される
// ことを確認する(hasBrokenStripeConnectとは異なり、これは正常系)。
// test3はteam 0001のメンバーではないため、is_external session への
// ゲスト参加(guest_price課金)としてカード払いを行う。
import { chromium } from "@playwright/test"
import { readFileSync } from "fs"
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const BASE_URL = "http://localhost:3000"
const TEAM_ID = "dddddddd-dddd-dddd-dddd-000000000001" // 大阪スイミングクラブ(Connect未設定)
const TEST3_ID = "3e281812-1e3d-4522-91ca-690aa7d9d14a"
const SHOT_DIR = "C:/tmp/annual-fee-e2e"

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

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context1 = await browser.newContext()
  const context3 = await browser.newContext()
  const page1 = await context1.newPage()
  const page3 = await context3.newPage()

  try {
    const { data: team } = await supabase
      .from("teams")
      .select("stripe_account_id, stripe_onboarding_completed")
      .eq("id", TEAM_ID)
      .single()
    log("precheck", `team状態: ${JSON.stringify(team)} (Connect未設定であることを確認)`)
    if (team.stripe_account_id) {
      throw new Error("前提条件が崩れています(このチームは既にConnect設定済みです)。テストを中止します")
    }
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", TEAM_ID)
      .eq("swimmer_id", TEST3_ID)
      .maybeSingle()
    if (membership) {
      throw new Error("前提条件が崩れています(test3が既にこのチームのメンバーです)。テストを中止します")
    }

    await login(page1, "test2@example.com", "Delta-coach8820!") // team 0001の管理者
    await login(page3, "test3@example.com", "Delta-coach8820!")

    // セッション作成(外部公開ON + ゲスト参加費を設定)
    await page1.goto(`${BASE_URL}/sessions/new?team=${TEAM_ID}`, { waitUntil: "networkidle" })
    await page1.getByLabel("タイトル").fill("ゲスト決済テスト用練習会")
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const isoLocal = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}T15:00`
    await page1.locator('input[type="datetime-local"]').fill(isoLocal)
    await page1.locator("#location").fill("市民プール")
    await page1.getByRole("button", { name: "次へ →" }).click()
    await page1.waitForTimeout(500)
    await page1.getByLabel("メンバー参加費").fill("1000")
    await page1.getByRole("button", { name: "外部公開する（メンバー以外も参加可能）" }).click()
    await page1.waitForTimeout(300)
    await page1.getByLabel("ゲスト参加費").fill("1800")
    await page1.getByRole("button", { name: "次へ →" }).click() // → 詳細設定
    await page1.waitForTimeout(500)
    // 配信対象はデフォルトで「全メンバー選択」(target_membersに現メンバー全員のIDが
    // 入る)のまま、あえて操作せず進める。ゲストは絶対にtarget_membersに含まれない
    // ため、registerForSessionのisMember判定なしにこの状態でゲストが登録できるかが
    // まさに検証したいポイント(修正前は必ず「対象外のため参加登録できません」で失敗した)。
    await page1.getByRole("button", { name: "次へ →" }).click() // → 配信対象
    await page1.waitForTimeout(500)
    await page1.getByRole("button", { name: "次へ →" }).click() // → 確認
    await page1.waitForTimeout(500)
    await page1.getByRole("button", { name: "セッションを作成" }).click()
    await page1.waitForURL(/\/sessions\/[0-9a-f-]+/, { timeout: 15000 })
    const sessionId = page1.url().match(/\/sessions\/([0-9a-f-]+)/)?.[1]
    log("create", `セッション作成: ${sessionId}`)

    // test3(非メンバー)がゲストとしてカード払いで参加登録
    await page3.goto(`${BASE_URL}/teams/${TEAM_ID}/sessions/${sessionId}`, { waitUntil: "networkidle" })
    await page3.screenshot({ path: `${SHOT_DIR}/guest-01-detail-page.png`, fullPage: true })
    console.log("--- 参加者側セッション詳細ページ ---")
    console.log((await page3.locator("body").innerText()).slice(0, 1500))
    await page3.getByRole("button", { name: /参加登録|申し込む|参加する/ }).first().click()
    await page3.waitForTimeout(1000)
    await page3.screenshot({ path: `${SHOT_DIR}/guest-01b-after-register-click.png`, fullPage: true })
    console.log("--- 参加登録クリック後 ---")
    console.log((await page3.locator("body").innerText()).slice(0, 1500))
    const cardOption = page3.getByRole("button", { name: /カード|Stripe/ })
    await cardOption.first().click({ timeout: 5000 })
    await page3.waitForTimeout(1500)
    await page3.screenshot({ path: `${SHOT_DIR}/guest-01c-after-card-click.png`, fullPage: true })
    console.log("--- カード選択後 ---")
    console.log((await page3.locator("body").innerText()).slice(0, 1500))
    log("register", "test3がゲスト(非会員)としてカード払いで参加登録しました")

    // 開催確定(guest_priceで正常に課金されるはず)
    await page1.reload({ waitUntil: "networkidle" })
    await page1.getByRole("button", { name: "開催確定・決済" }).click()
    await page1.waitForTimeout(1000)
    await page1.getByRole("button", { name: "開催確定する" }).click()
    await page1.waitForTimeout(5000)
    await page1.screenshot({ path: `${SHOT_DIR}/guest-02-after-confirm.png`, fullPage: true })
    log("confirm", "開催確定を実行しました")

    const { data: reg } = await supabase
      .from("session_registrations")
      .select("is_member, payment_method, payment_status, charged_amount, stripe_payment_intent_id")
      .eq("session_id", sessionId)
      .eq("swimmer_id", TEST3_ID)
      .single()
    log("result", `session_registrations: ${JSON.stringify(reg)} (期待値: is_member=false, payment_status=paid, charged_amount=1800)`)

    const { data: transferRecord } = await supabase
      .from("transfer_records")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle()
    log("result", `transfer_records: ${JSON.stringify(transferRecord)} (期待値: null=Connect送金記録なし)`)

    if (reg.stripe_payment_intent_id) {
      const Stripe = (await import("stripe")).default
      const stripe = new Stripe(env.STRIPE_SECRET_KEY)
      const pi = await stripe.paymentIntents.retrieve(reg.stripe_payment_intent_id)
      log("result", `Stripe PaymentIntent: status=${pi.status}, amount=${pi.amount}, transfer_data=${JSON.stringify(pi.transfer_data)}`)
    }

    console.log(`SESSION_ID=${sessionId}`)
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
