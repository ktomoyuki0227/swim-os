// 年会費の「初回課金失敗」シナリオの検証。カード決済方法を一時的に無効化した
// 状態で会員種別をannualに切り替え、Subscription作成→初回課金失敗→
// 自動キャンセル→通知が正しく行われることを確認する。
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
const TEAM_MEMBER_ID = "8d294cea-c00b-4d7d-b950-cb49eff37f3c" // test3 @ マウントリバー
const SWIMMER_ID = "3e281812-1e3d-4522-91ca-690aa7d9d14a"
const REAL_PM_ID = "pm_1TllvkD6E87vdNswF35n3gff"

function log(step, msg) {
  console.log(`[${new Date().toISOString()}] [${step}] ${msg}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await supabase.from("profiles").update({ stripe_payment_method_id: "pm_invalid_for_test" }).eq("id", SWIMMER_ID)
    log("setup", "test3の決済方法を一時的に無効化しました")

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" })
    await page.locator("#email").fill("test1@example.com")
    await page.locator("#password").fill("Delta-coach8820!")
    await page.getByRole("button", { name: "ログイン", exact: true }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    await page.goto(`${BASE_URL}/fees?team=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`, { waitUntil: "networkidle" })

    // 「•••」メニューから佐藤花子(test3)の詳細・編集を開く
    // 「回数券会員」セクション内の佐藤花子の行を、テキストで直接絞り込んで
    // その中のメニューボタンをクリックする(depth探索だと会員数が多い場合に
    // 別の会員の行を誤検出することがあるため、より確実な方法に変更)
    const row = page.locator("div", { hasText: "佐藤 花子" }).filter({ has: page.locator('button[aria-label="メニューを開く"]') }).last()
    const menuBtn = row.locator('button[aria-label="メニューを開く"]')
    await menuBtn.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await menuBtn.click({ force: true })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: "C:/tmp/annual-fee-e2e/initfail-01-menu.png", fullPage: true })
    const detailEdit = page.getByRole("button", { name: "詳細・編集" })
    await detailEdit.click({ timeout: 10000 })
    await page.getByRole("button", { name: "編集" }).click()
    await page.getByRole("button", { name: "年会費", exact: true }).click()
    await page.getByRole("button", { name: /保存する/ }).click()
    // Stripe Customer/Product/Price作成 + Subscription作成 + 初回課金確定試行 +
    // (失敗時)キャンセル・通知までサーバー側で複数のAPI呼び出しが直列に走るため、
    // 十分な時間を空けてから結果を確認する(短すぎるとまだ処理中の状態を見てしまう)
    await page.waitForTimeout(12000)
    log("toggle", "point_card -> annual に変更しました(初回課金失敗が想定される)")

    const { data: tm } = await supabase
      .from("team_members")
      .select("stripe_subscription_id, subscription_status, membership_type")
      .eq("id", TEAM_MEMBER_ID)
      .single()
    log("result", `team_members: ${JSON.stringify(tm)}`)

    const { data: notifications } = await supabase
      .from("notifications")
      .select("type, title, body, created_at")
      .eq("team_id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
      .order("created_at", { ascending: false })
      .limit(3)
    log("result", `直近の通知: ${JSON.stringify(notifications)}`)

    // 決済方法を正しい値に戻す
    await supabase.from("profiles").update({ stripe_payment_method_id: REAL_PM_ID }).eq("id", SWIMMER_ID)
    log("cleanup", "test3の決済方法を復元しました")
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
