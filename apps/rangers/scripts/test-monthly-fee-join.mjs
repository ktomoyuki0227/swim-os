// 月謝Stripe自動課金の回帰テスト(payInitialInvoiceOffSessionの修正が月謝側にも
// 正しく効くか確認する)。test4をまだ未参加の東京マスターズ水泳クラブに
// 月謝会員として新規参加させる。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const INVITE_CODE = "2ea6d9ac-eeb8-4020-b2e8-6e5ca71ce14d" // 東京マスターズ水泳クラブ
const MEMBER_EMAIL = "test4@example.com"
const PASSWORD = "Delta-coach8820!"
const SHOT_DIR = "C:/tmp/annual-fee-e2e"

function log(step, msg) {
  console.log(`[${new Date().toISOString()}] [${step}] ${msg}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" })
    await page.locator("#email").fill(MEMBER_EMAIL)
    await page.locator("#password").fill(PASSWORD)
    await page.getByRole("button", { name: "ログイン", exact: true }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    log("login", `logged in as ${MEMBER_EMAIL}`)

    await page.goto(`${BASE_URL}/teams/join/${INVITE_CODE}`, { waitUntil: "networkidle" })
    await page.screenshot({ path: `${SHOT_DIR}/monthly-01-before.png`, fullPage: true })

    await page.getByText("月謝", { exact: true }).click()
    await page.getByRole("button", { name: /に参加する/ }).click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: `${SHOT_DIR}/monthly-02-after.png`, fullPage: true })
    log("join", "参加処理完了 (tryStartMonthlySubscription発火想定)")
  } catch (err) {
    log("ERROR", String(err))
    await page.screenshot({ path: `${SHOT_DIR}/monthly-error.png`, fullPage: true }).catch(() => {})
    throw err
  } finally {
    await browser.close()
  }
}

main().then(() => { console.log("DONE"); process.exit(0) })
  .catch((err) => { console.error("FAILED:", err); process.exit(1) })
