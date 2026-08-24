// セッション中止時の返金処理のテスト。既に開催確定・決済済みのセッションを
// 中止し、Stripe側で返金・Connect送金の巻き戻しが行われることを確認する。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const SESSION_ID = process.argv[2]
const SHOT_DIR = "C:/tmp/annual-fee-e2e"

if (!SESSION_ID) {
  console.error("Usage: node scripts/test-session-cancel-refund.mjs <sessionId>")
  process.exit(1)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" })
    await page.locator("#email").fill("test1@example.com")
    await page.locator("#password").fill("Delta-coach8820!")
    await page.getByRole("button", { name: "ログイン", exact: true }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    await page.goto(`${BASE_URL}/sessions/${SESSION_ID}`, { waitUntil: "networkidle" })
    await page.screenshot({ path: `${SHOT_DIR}/cancel-01-before.png`, fullPage: true })

    await page.getByRole("button", { name: "セッションを中止" }).click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOT_DIR}/cancel-02-dialog.png`, fullPage: true })
    console.log("--- ダイアログ内容 ---")
    console.log((await page.locator("body").innerText()).slice(-1500))

    // 確認ダイアログの実行ボタン(文言はスクリーンショットで確認して調整)
    const confirmBtn = page.getByRole("button", { name: /^(中止する|セッションを中止する)$/ })
    await confirmBtn.click()
    await page.waitForTimeout(6000)
    await page.screenshot({ path: `${SHOT_DIR}/cancel-03-after.png`, fullPage: true })
    console.log("--- 中止後 ---")
    console.log((await page.locator("body").innerText()).slice(0, 1500))
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
