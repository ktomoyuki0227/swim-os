// 年会費Stripe自動課金機能の自動E2Eテスト(一時スクリプト、テスト後に削除予定)
// 実行: node scripts/test-annual-fee-e2e.mjs
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const TEAM_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" // マウントリバー水泳クラブ
const COACH_EMAIL = "test1@example.com"
const MEMBER_EMAIL = "test2@example.com"
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

async function openMemberEditor(page, memberName) {
  // 会員行(月謝/年会費はtr、回数券はdivカード)の「•••」メニューを開く。
  // 構造がtype依存で変わるため、ブラウザ内でDOMを直接たどり、各メニュー
  // ボタンについて祖先を1階層ずつ遡って最初にmemberNameを含む要素が見つかった
  // ところで停止し、そのメニューボタンのindexを返す
  // 各メニューボタンについて「祖先を何階層遡ればmemberNameを含むか」を求め、
  // その階層数が最小のボタン(=最も近い、つまり本来の所有者)を選ぶ。
  // 単純に「最初に見つかったボタン」を採用すると、無関係なボタンの遠い祖先
  // (テーブル全体など)に偶然名前が含まれるケースで誤選択してしまうため。
  const index = await page.evaluate((name) => {
    const buttons = Array.from(document.querySelectorAll('button[aria-label="メニューを開く"]'))
    let bestIndex = -1
    let bestDepth = Infinity
    for (let i = 0; i < buttons.length; i++) {
      let el = buttons[i].parentElement
      for (let depth = 0; depth < 8 && el; depth++) {
        if (el.textContent?.includes(name)) {
          if (depth < bestDepth) { bestDepth = depth; bestIndex = i }
          break
        }
        el = el.parentElement
      }
    }
    return bestIndex
  }, memberName)

  if (index === -1) throw new Error(`メンバー「${memberName}」のメニューボタンが見つかりませんでした`)
  const target = page.locator('button[aria-label="メニューを開く"]').nth(index)
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  log("debug", `selected menu button index=${index}, box=${JSON.stringify(box)}`)
  await target.click({ force: true })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${SHOT_DIR}/debug-after-menu-click.png`, fullPage: true })
  await page.getByRole("button", { name: "詳細・編集" }).click()
  // モーダルの「編集」タブへ
  await page.getByRole("button", { name: "編集" }).click()
}

async function setMembershipType(page, label) {
  await page.getByRole("button", { name: label, exact: true }).click()
  await page.getByRole("button", { name: /保存する/ }).click()
  await page.waitForTimeout(1500) // トースト表示・revalidatePath待ち
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.on("console", (msg) => {
    if (msg.type() === "error") log("browser-console-error", msg.text())
  })

  try {
    await login(page, COACH_EMAIL, PASSWORD)

    await page.goto(`${BASE_URL}/fees?team=${TEAM_ID}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${SHOT_DIR}/01-fees-page.png`, fullPage: true })
    const bodyText = (await page.locator("body").textContent()) ?? ""
    const menuBtnCount = await page.locator('button[aria-label="メニューを開く"]').count()
    log("fees-page", `opened fees page. contains 鈴木=${bodyText.includes("鈴木")}, contains 回数券=${bodyText.includes("回数券")}, menuButtons=${menuBtnCount}`)

    // Step 1: 鈴木太郎(test2, 現在annual・Subscription無し)を一旦「回数券」に変更
    await openMemberEditor(page, "鈴木")
    await page.screenshot({ path: `${SHOT_DIR}/02-edit-modal-open.png`, fullPage: true })
    await setMembershipType(page, "回数券")
    await page.screenshot({ path: `${SHOT_DIR}/03-changed-to-point-card.png`, fullPage: true })
    log("step1", "membership_type: annual -> point_card 完了")

    // ページを再読込してモーダル状態をリセット
    await page.goto(`${BASE_URL}/fees?team=${TEAM_ID}`, { waitUntil: "networkidle" })

    // Step 2: 「回数券」から「年会費」に戻す → tryStartAnnualSubscription が発火するはず
    await openMemberEditor(page, "鈴木")
    await setMembershipType(page, "年会費")
    await page.screenshot({ path: `${SHOT_DIR}/04-changed-to-annual.png`, fullPage: true })
    log("step2", "membership_type: point_card -> annual 完了 (tryStartAnnualSubscription発火想定)")
  } catch (err) {
    log("ERROR", String(err))
    await page.screenshot({ path: `${SHOT_DIR}/error.png`, fullPage: true }).catch(() => {})
    throw err
  } finally {
    await browser.close()
  }
}

main().then(() => {
  console.log("DONE")
  process.exit(0)
}).catch((err) => {
  console.error("FAILED:", err)
  process.exit(1)
})
