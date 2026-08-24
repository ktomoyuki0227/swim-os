// セッション参加費決済の失敗と再試行のテスト。
// test2の決済方法を一時的に無効な値にして開催確定→決済失敗させ、
// 正しい決済方法に戻してから「再試行」ボタンで成功することを確認する。
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
const TEAM_ID = "3cba2eb6-4ec2-4b5b-9bc2-0bd766a5982c"
const REAL_PM_ID = "pm_1TllvlD6E87vdNswz9iybQ0R"
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

const TEST2_ID = "9d30728f-96e9-4415-9823-97040111ad22"

async function setTest2PaymentMethod(pmId) {
  const { error } = await supabase.from("profiles").update({ stripe_payment_method_id: pmId }).eq("id", TEST2_ID)
  if (error) throw new Error(`failed to update profile: ${error.message}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  try {
    // 決済方法を一時的に無効化(存在しないPM ID)
    await setTest2PaymentMethod("pm_invalid_for_test")
    log("setup", "test2の決済方法を一時的に無効化しました")

    await login(page2, "test2@example.com", "Delta-coach8820!")
    await login(page1, "test1@example.com", "Delta-coach8820!")

    // セッション作成
    await page1.goto(`${BASE_URL}/sessions/new?team=${TEAM_ID}`, { waitUntil: "networkidle" })
    await page1.getByLabel("タイトル").fill("決済再試行テスト用練習会")
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const isoLocal = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}T11:00`
    await page1.locator('input[type="datetime-local"]').fill(isoLocal)
    await page1.locator("#location").fill("市民プール")
    await page1.getByRole("button", { name: "次へ →" }).click()
    await page1.waitForTimeout(500)
    await page1.getByLabel("メンバー参加費").fill("1000")
    await page1.getByRole("button", { name: "次へ →" }).click()
    await page1.waitForTimeout(500)
    await page1.getByRole("button", { name: "次へ →" }).click()
    await page1.waitForTimeout(500)
    await page1.getByRole("button", { name: "次へ →" }).click()
    await page1.waitForTimeout(500)
    await page1.getByRole("button", { name: "セッションを作成" }).click()
    await page1.waitForURL(/\/sessions\/[0-9a-f-]+/, { timeout: 15000 })
    const sessionId = page1.url().match(/\/sessions\/([0-9a-f-]+)/)?.[1]
    log("create", `セッション作成: ${sessionId}`)

    // test2が参加登録
    await page2.goto(`${BASE_URL}/teams/${TEAM_ID}/sessions/${sessionId}`, { waitUntil: "networkidle" })
    await page2.getByRole("button", { name: /参加登録|申し込む|参加する/ }).first().click()
    await page2.waitForTimeout(1000)
    const cardOption = page2.getByRole("button", { name: /カード|Stripe/ })
    if (await cardOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardOption.first().click()
      await page2.waitForTimeout(1000)
    }
    log("register", "test2が参加登録しました")

    // 開催確定(決済失敗するはず)
    await page1.reload({ waitUntil: "networkidle" })
    await page1.getByRole("button", { name: "開催確定・決済" }).click()
    await page1.waitForTimeout(1000)
    await page1.getByRole("button", { name: "開催確定する" }).click()
    await page1.waitForTimeout(5000)
    await page1.screenshot({ path: `${SHOT_DIR}/retry-01-after-confirm-fail.png`, fullPage: true })
    console.log("--- 決済失敗後(想定) ---")
    console.log((await page1.locator("body").innerText()).slice(0, 1500))

    // 決済方法を正しい値に戻す
    await setTest2PaymentMethod(REAL_PM_ID)
    log("fix-pm", "test2の決済方法を正しい値に戻しました")

    // 再試行(確認ダイアログを経由)
    const retryBtn = page1.getByRole("button", { name: /再試行/ })
    await retryBtn.first().click()
    await page1.waitForTimeout(1000)
    await page1.getByRole("button", { name: "再試行する" }).click()
    await page1.waitForTimeout(5000)
    await page1.screenshot({ path: `${SHOT_DIR}/retry-02-after-retry.png`, fullPage: true })
    console.log("--- 再試行後 ---")
    console.log((await page1.locator("body").innerText()).slice(0, 1500))

    console.log(`SESSION_ID=${sessionId}`)
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
