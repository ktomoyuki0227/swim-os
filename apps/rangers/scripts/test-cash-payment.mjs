// 現金払いの記録・取り消しのテスト。test2が現金払いでセッションに参加登録し、
// 管理者が「集金済みにする」→「元に戻す」の両方を実行できることを確認する。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const TEAM_ID = "3cba2eb6-4ec2-4b5b-9bc2-0bd766a5982c"
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
  const context2 = await browser.newContext()
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  try {
    await login(page1, "test1@example.com", "Delta-coach8820!")
    await login(page2, "test2@example.com", "Delta-coach8820!")

    // セッション作成
    await page1.goto(`${BASE_URL}/sessions/new?team=${TEAM_ID}`, { waitUntil: "networkidle" })
    await page1.getByLabel("タイトル").fill("現金払いテスト用練習会")
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const isoLocal = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}T12:00`
    await page1.locator('input[type="datetime-local"]').fill(isoLocal)
    await page1.locator("#location").fill("市民プール")
    await page1.getByRole("button", { name: "次へ →" }).click()
    await page1.waitForTimeout(500)
    await page1.getByLabel("メンバー参加費").fill("500")
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

    // test2が現金払いで参加登録
    await page2.goto(`${BASE_URL}/teams/${TEAM_ID}/sessions/${sessionId}`, { waitUntil: "networkidle" })
    await page2.getByRole("button", { name: /参加登録|申し込む|参加する/ }).first().click()
    await page2.waitForTimeout(1000)
    await page2.screenshot({ path: `${SHOT_DIR}/cash-01-payment-choice.png`, fullPage: true })
    console.log("--- 支払い方法選択 ---")
    console.log((await page2.locator("body").innerText()).slice(-1000))

    const cashOption = page2.getByRole("button", { name: /現金/ })
    if (await cashOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await cashOption.first().click()
      await page2.waitForTimeout(1500)
    }
    log("register", "test2が現金払いで参加登録しました")

    // 管理者が現金管理画面を開く
    await page1.goto(`${BASE_URL}/sessions/${sessionId}?filter=cash`, { waitUntil: "networkidle" })
    await page1.screenshot({ path: `${SHOT_DIR}/cash-02-admin-panel.png`, fullPage: true })
    console.log("--- 管理者側 現金管理パネル(集金前) ---")
    console.log((await page1.locator("body").innerText()).slice(0, 1500))

    await page1.getByRole("button", { name: "集金済みにする" }).click()
    await page1.waitForTimeout(2000)
    await page1.screenshot({ path: `${SHOT_DIR}/cash-03-after-mark-paid.png`, fullPage: true })
    console.log("--- 集金済みにした後 ---")
    console.log((await page1.locator("body").innerText()).slice(0, 1500))

    // 取り消し
    await page1.getByLabel("集金済みを取り消す").click()
    await page1.waitForTimeout(1000)
    await page1.screenshot({ path: `${SHOT_DIR}/cash-04-undo-dialog.png`, fullPage: true })
    await page1.getByRole("button", { name: "元に戻す" }).click()
    await page1.waitForTimeout(2000)
    await page1.screenshot({ path: `${SHOT_DIR}/cash-05-after-undo.png`, fullPage: true })
    console.log("--- 取り消した後 ---")
    console.log((await page1.locator("body").innerText()).slice(0, 1500))

    console.log(`SESSION_ID=${sessionId}`)
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
