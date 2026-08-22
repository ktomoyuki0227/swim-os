// 年会費課金失敗シナリオ(M)のテスト: test4のカードを「残高不足で失敗する」
// テストカードに変更し、年会費を再度annualへ切り替えて課金失敗を確認する。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
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

    await page.goto(`${BASE_URL}/payments`, { waitUntil: "networkidle" })
    await page.screenshot({ path: `${SHOT_DIR}/fail-01-payments-page.png`, fullPage: true })

    // カード管理モーダルを開く
    await page.getByRole("button", { name: "クレジットカード管理" }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${SHOT_DIR}/fail-02-modal.png`, fullPage: true })

    await page.getByRole("button", { name: "カードを変更する" }).click()
    await page.waitForTimeout(6000)
    await page.screenshot({ path: `${SHOT_DIR}/fail-03-form.png`, fullPage: true })

    const iframeTitles = await page.evaluate(() =>
      Array.from(document.querySelectorAll("iframe")).map((f) => f.title)
    )
    log("debug", `iframe titles: ${JSON.stringify(iframeTitles)}`)

    // Stripe Elements iframe に残高不足カードを入力(localeがjaのためタイトルは日本語)
    const numberFrame = page.frameLocator("iframe").first()
    await numberFrame.locator('input[name="cardnumber"]').fill("4000000000009995", { timeout: 15000 })
    const expiryFrame = page.frameLocator("iframe").nth(1)
    await expiryFrame.locator('input[name="exp-date"]').fill("12/34")
    const cvcFrame = page.frameLocator("iframe").nth(2)
    await cvcFrame.locator('input[name="cvc"]').fill("123")
    await page.screenshot({ path: `${SHOT_DIR}/fail-04-filled.png`, fullPage: true })

    await page.getByRole("button", { name: "このカードで登録する" }).click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: `${SHOT_DIR}/fail-05-submitted.png`, fullPage: true })
    log("card-update", "残高不足カードへの変更完了(想定)")
  } catch (err) {
    log("ERROR", String(err))
    await page.screenshot({ path: `${SHOT_DIR}/fail-error.png`, fullPage: true }).catch(() => {})
    throw err
  } finally {
    await browser.close()
  }
}

main().then(() => { console.log("DONE"); process.exit(0) })
  .catch((err) => { console.error("FAILED:", err); process.exit(1) })
