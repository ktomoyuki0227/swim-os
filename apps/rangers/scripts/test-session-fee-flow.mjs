// セッション参加費決済(申込〜開催確定〜Connect送金)のE2Eテスト。
// team "a"(Stripe Connectオンボーディング完了済み)を使い、
// test1(管理者)がセッションを作成、test2(カード登録済み)が参加登録、
// 開催確定で実際にカード課金されることを確認する。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const TEAM_ID = "3cba2eb6-4ec2-4b5b-9bc2-0bd766a5982c" // team "a" (Connect設定済み)
const INVITE_CODE = "9364216a-28b5-4d2c-890d-811627cec2e6"
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

  // Step 0: test2をteam "a"に参加させる(まだ未参加の場合)
  const page2 = await context2.newPage()
  await login(page2, "test2@example.com", "Delta-coach8820!")
  await page2.goto(`${BASE_URL}/teams/join/${INVITE_CODE}`, { waitUntil: "networkidle" })
  const alreadyMember = await page2.getByText("既にこのグループに参加しています").isVisible().catch(() => false)
  if (!alreadyMember) {
    const joinBtn = page2.getByRole("button", { name: /に参加する/ })
    if (await joinBtn.isVisible().catch(() => false)) {
      await joinBtn.click()
      await page2.waitForTimeout(2000)
      log("join", "test2がteam aに参加しました")
    }
  } else {
    log("join", "test2は既にteam aのメンバーです")
  }

  // Step 1: test1(管理者)でセッションを作成
  const page1 = await context1.newPage()
  await login(page1, "test1@example.com", "Delta-coach8820!")
  await page1.goto(`${BASE_URL}/sessions/new?team=${TEAM_ID}`, { waitUntil: "networkidle" })
  await page1.screenshot({ path: `${SHOT_DIR}/session-01-new-form.png`, fullPage: true })

  // 基本情報(必須: タイトル・日時・場所)
  await page1.getByLabel("タイトル").fill("決済テスト用練習会")
  const dateInput = page1.locator('input[type="datetime-local"]')
  const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const isoLocal = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}T10:00`
  await dateInput.fill(isoLocal)
  await page1.locator("#location").fill("市民プール")
  await page1.screenshot({ path: `${SHOT_DIR}/session-02-step1-filled.png`, fullPage: true })
  await page1.getByRole("button", { name: "次へ →" }).click()
  await page1.waitForTimeout(1000)
  await page1.screenshot({ path: `${SHOT_DIR}/session-03-step2.png`, fullPage: true })

  const step2Text = await page1.locator("body").innerText()
  console.log("--- STEP2 (参加費) PAGE TEXT ---")
  console.log(step2Text.slice(0, 1500))

  // 参加費(メンバー参加費のみ設定。¥1,000)
  await page1.getByLabel("メンバー参加費").fill("1000")
  await page1.screenshot({ path: `${SHOT_DIR}/session-04-step2-filled.png`, fullPage: true })
  await page1.getByRole("button", { name: "次へ →" }).click()
  await page1.waitForTimeout(1000)
  await page1.screenshot({ path: `${SHOT_DIR}/session-05-step3.png`, fullPage: true })
  console.log("--- STEP3 PAGE TEXT ---")
  console.log((await page1.locator("body").innerText()).slice(0, 1500))

  await page1.getByRole("button", { name: "次へ →" }).click()
  await page1.waitForTimeout(1000)
  await page1.screenshot({ path: `${SHOT_DIR}/session-06-step4.png`, fullPage: true })
  console.log("--- STEP4 PAGE TEXT ---")
  console.log((await page1.locator("body").innerText()).slice(0, 1500))

  await page1.getByRole("button", { name: "次へ →" }).click()
  await page1.waitForTimeout(1000)
  await page1.screenshot({ path: `${SHOT_DIR}/session-07-step5-confirm.png`, fullPage: true })
  console.log("--- STEP5 (確認) PAGE TEXT ---")
  console.log((await page1.locator("body").innerText()).slice(0, 2000))

  await page1.getByRole("button", { name: "セッションを作成" }).click()
  await page1.waitForURL(/\/sessions\/[0-9a-f-]+/, { timeout: 15000 })
  const sessionUrl = page1.url()
  const sessionId = sessionUrl.match(/\/sessions\/([0-9a-f-]+)/)?.[1]
  log("create", `セッション作成完了: ${sessionUrl} (id=${sessionId})`)
  await page1.screenshot({ path: `${SHOT_DIR}/session-08-created.png`, fullPage: true })

  console.log(`SESSION_ID=${sessionId}`)

  // Step 2: test2(参加者)がセッションに申し込む(会員向けページは
  // /teams/[id]/sessions/[sid]。/sessions/[id]は管理者の運営ページ)
  await page2.goto(`${BASE_URL}/teams/${TEAM_ID}/sessions/${sessionId}`, { waitUntil: "networkidle" })
  await page2.screenshot({ path: `${SHOT_DIR}/session-09-register-page.png`, fullPage: true })
  console.log("--- 参加者側セッション詳細ページ ---")
  console.log((await page2.locator("body").innerText()).slice(0, 1500))

  const registerBtn = page2.getByRole("button", { name: /参加登録|申し込む|参加する/ })
  await registerBtn.first().click()
  await page2.waitForTimeout(1000)
  await page2.screenshot({ path: `${SHOT_DIR}/session-10-after-register-click.png`, fullPage: true })
  console.log("--- 参加登録クリック後 ---")
  console.log((await page2.locator("body").innerText()).slice(0, 1500))

  // 支払い方法の選択肢が出る場合は「カード」を選ぶ
  const cardOption = page2.getByRole("button", { name: /カード|Stripe/ })
  if (await cardOption.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await cardOption.first().click()
    await page2.waitForTimeout(1500)
    await page2.screenshot({ path: `${SHOT_DIR}/session-11-after-payment-choice.png`, fullPage: true })
    console.log("--- 支払い方法選択後 ---")
    console.log((await page2.locator("body").innerText()).slice(0, 1500))
  }

  // Step 3: test1(管理者)が開催確定・決済を実行
  await page1.reload({ waitUntil: "networkidle" })
  await page1.screenshot({ path: `${SHOT_DIR}/session-12-admin-before-confirm.png`, fullPage: true })
  console.log("--- 管理者側(確定前) ---")
  console.log((await page1.locator("body").innerText()).slice(0, 1500))

  await page1.getByRole("button", { name: "開催確定・決済" }).click()
  await page1.waitForTimeout(1000)
  await page1.screenshot({ path: `${SHOT_DIR}/session-13a-confirm-dialog.png`, fullPage: true })
  await page1.getByRole("button", { name: "開催確定する" }).click()
  await page1.waitForTimeout(5000)
  await page1.screenshot({ path: `${SHOT_DIR}/session-13-admin-after-confirm.png`, fullPage: true })
  console.log("--- 管理者側(確定後) ---")
  console.log((await page1.locator("body").innerText()).slice(0, 1500))

  console.log(`SESSION_ID=${sessionId}`)

  await browser.close()
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
