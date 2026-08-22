// 年会費Stripe自動課金: 新規会員(招待コード参加)経由のクリーンなE2Eテスト
// test2の使い回しでは過去のテストデータの影響が残るため、まだこのチームに未参加の
// test4を新規に「年会費」会員として参加させ、joinTeamByCode -> tryStartAnnualSubscription
// の経路を検証する。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const INVITE_CODE = "f374bbd0-f465-4e3e-b406-48517fdedc15" // マウントリバー水泳クラブ
const MEMBER_EMAIL = "test4@example.com"
const PASSWORD = "Delta-coach8820!"
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
  log("login", `logged in as ${email}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await login(page, MEMBER_EMAIL, PASSWORD)

    await page.goto(`${BASE_URL}/teams/join/${INVITE_CODE}`, { waitUntil: "networkidle" })
    await page.screenshot({ path: `${SHOT_DIR}/join-01-before.png`, fullPage: true })

    // 「年会費」を明示的に選択
    await page.getByText("年会費", { exact: true }).click()
    await page.screenshot({ path: `${SHOT_DIR}/join-02-selected-annual.png`, fullPage: true })

    // 参加する
    await page.getByRole("button", { name: /に参加する/ }).click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: `${SHOT_DIR}/join-03-after.png`, fullPage: true })
    log("join", "参加処理完了 (tryStartAnnualSubscription発火想定)")
  } catch (err) {
    log("ERROR", String(err))
    await page.screenshot({ path: `${SHOT_DIR}/join-error.png`, fullPage: true }).catch(() => {})
    throw err
  } finally {
    await browser.close()
  }
}

main().then(() => { console.log("DONE"); process.exit(0) })
  .catch((err) => { console.error("FAILED:", err); process.exit(1) })
