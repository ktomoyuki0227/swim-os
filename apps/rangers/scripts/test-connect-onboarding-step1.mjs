// Stripe Connectオンボーディングの開始〜最初の画面までを進めるスクリプト。
// マウントリバー水泳クラブ(test1が管理者)で「口座情報を登録する」を押し、
// Stripeのホスト型オンボーディング画面のURLとスクリーンショットを取得する。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const TEAM_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
const SHOT_DIR = "C:/tmp/annual-fee-e2e"

function log(step, msg) {
  console.log(`[${new Date().toISOString()}] [${step}] ${msg}`)
}

async function main() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" })
    await page.locator("#email").fill("test1@example.com")
    await page.locator("#password").fill("Delta-coach8820!")
    await page.getByRole("button", { name: "ログイン", exact: true }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })
    log("login", "logged in as test1")

    await page.goto(`${BASE_URL}/teams/${TEAM_ID}`, { waitUntil: "networkidle" })
    await page.screenshot({ path: `${SHOT_DIR}/connect-01-team-page.png`, fullPage: true })

    const setupButton = page.getByRole("button", { name: /口座情報を登録する|設定を続ける|Stripe設定を完了/ })
    await setupButton.first().waitFor({ timeout: 10000 })

    const [popup] = await Promise.all([
      context.waitForEvent("page", { timeout: 15000 }).catch(() => null),
      setupButton.first().click(),
    ])

    // window.location.href による同タブ遷移かポップアップかを両対応で確認
    await page.waitForTimeout(2000)
    const targetPage = popup ?? page
    await targetPage.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
    log("navigate", `current URL: ${targetPage.url()}`)
    await targetPage.screenshot({ path: `${SHOT_DIR}/connect-02-stripe-onboarding.png`, fullPage: true })

    // ページの主要テキストをダンプして次のステップの設計に使う
    const dump = async (label) => {
      await targetPage.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
      await targetPage.screenshot({ path: `${SHOT_DIR}/connect-${label}.png`, fullPage: true })
      const bodyText = await targetPage.locator("body").innerText().catch(() => "(取得失敗)")
      console.log(`--- PAGE TEXT (${label}) --- url=${targetPage.url()}`)
      console.log(bodyText.slice(0, 2000))
    }

    await dump("02-email")

    // メールアドレス入力→Continue
    await targetPage.getByLabel("Email address").fill("mountriver-connect-test@example.com")
    await targetPage.getByRole("button", { name: "Continue" }).click()
    await targetPage.waitForTimeout(2000)
    await dump("03-after-email")
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
