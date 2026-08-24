// セッション参加費の「回数券(point_card)払い」のテスト。
// team aaaaaaaa(マウントリバー水泳クラブ)で、point_card会員のtest3が
// 回数券払いで参加登録し、開催確定でスタンプが1枚消費されることを確認する。
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
const TEAM_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" // マウントリバー水泳クラブ
const TEST3_MEMBER_ID = "8d294cea-c00b-4d7d-b950-cb49eff37f3c"
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
    const { data: before } = await supabase
      .from("team_members")
      .select("stamp_remaining")
      .eq("id", TEST3_MEMBER_ID)
      .single()
    log("setup", `test3のスタンプ残数(開始前): ${before.stamp_remaining}`)

    await login(page1, "test2@example.com", "Delta-coach8820!") // team aaaaaaaaの管理者
    await login(page3, "test3@example.com", "Delta-coach8820!")

    // セッション作成(回数券での参加を許可する、をONにする)
    await page1.goto(`${BASE_URL}/sessions/new?team=${TEAM_ID}`, { waitUntil: "networkidle" })
    await page1.getByLabel("タイトル").fill("回数券払いテスト用練習会")
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const isoLocal = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}T13:00`
    await page1.locator('input[type="datetime-local"]').fill(isoLocal)
    await page1.locator("#location").fill("市民プール")
    await page1.getByRole("button", { name: "次へ →" }).click()
    await page1.waitForTimeout(500)
    await page1.getByLabel("メンバー参加費").fill("800")
    // 「回数券での参加を許可する」はデフォルトでON(allow_point_card: true)のため、
    // ここではクリックしない(クリックするとOFFに反転してしまう)
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

    // test3が回数券払いで参加登録
    await page3.goto(`${BASE_URL}/teams/${TEAM_ID}/sessions/${sessionId}`, { waitUntil: "networkidle" })
    await page3.getByRole("button", { name: /参加登録|申し込む|参加する/ }).first().click()
    await page3.waitForTimeout(1000)
    await page3.screenshot({ path: `${SHOT_DIR}/pointcard-01-payment-choice.png`, fullPage: true })
    const pointCardOption = page3.getByRole("button", { name: /回数券を使う/ })
    await pointCardOption.first().click({ timeout: 5000 })
    await page3.waitForTimeout(1500)
    log("register", "test3が回数券払いで参加登録しました")

    // 開催確定
    await page1.reload({ waitUntil: "networkidle" })
    await page1.getByRole("button", { name: "開催確定・決済" }).click()
    await page1.waitForTimeout(1000)
    await page1.getByRole("button", { name: "開催確定する" }).click()
    await page1.waitForTimeout(4000)
    await page1.screenshot({ path: `${SHOT_DIR}/pointcard-02-after-confirm.png`, fullPage: true })
    log("confirm", "開催確定を実行しました")

    const { data: after } = await supabase
      .from("team_members")
      .select("stamp_remaining")
      .eq("id", TEST3_MEMBER_ID)
      .single()
    log("result", `test3のスタンプ残数(確定後): ${after.stamp_remaining}`)

    const { data: reg } = await supabase
      .from("session_registrations")
      .select("payment_method, payment_status")
      .eq("session_id", sessionId)
      .eq("swimmer_id", "3e281812-1e3d-4522-91ca-690aa7d9d14a")
      .single()
    log("result", `session_registrations: ${JSON.stringify(reg)}`)

    const { data: notifications } = await supabase
      .from("notifications")
      .select("type, title, created_at")
      .eq("team_id", TEAM_ID)
      .order("created_at", { ascending: false })
      .limit(3)
    log("result", `直近の通知: ${JSON.stringify(notifications)}`)

    console.log(`SESSION_ID=${sessionId}`)
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
