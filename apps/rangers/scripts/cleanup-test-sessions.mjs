// 今回の決済検証で作成したテスト用セッションの後始末。
// 決済履歴(paid/point_card消費)が残るセッションはdeleteSessionのガードで
// 直接削除できない設計のため、アプリ自身のcancelSession(返金・スタンプ戻し)
// →deleteSessionの順で正しく片付ける。登録が一件も無い空のセッションは
// そのままdeleteSessionでよい。
import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"

// [sessionId, adminEmail, hasRegistrations]
const TARGETS = [
  ["6f2d7eb0-724d-4688-bd95-0b50fb60e694", "test2@example.com", true], // 回数券払いテスト用練習会
  ["767e5a4c-db42-4055-9c61-0eeb74b8214c", "test2@example.com", true], // Connect未完了ブロックテスト用練習会(決済はブロックされ登録は残るが未確定)
  ["092042e6-2bb0-44fd-b270-a6546e1d633c", "test2@example.com", true], // ゲスト決済テスト用練習会(成功)
  ["2ecf2337-67ce-4a1e-baf5-3a2cb8a7772c", "test2@example.com", false], // 回数券払いテスト用練習会(設定ミスで登録0件のまま放棄)
  ["73400a18-00b8-4c33-893b-37edabdaf09a", "test2@example.com", false], // ゲスト決済テスト用練習会(target_members不具合で登録失敗・0件)
  ["f8edc779-51a0-4b5d-a86d-4758f25f6507", "test2@example.com", false], // 同上
]

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

async function cleanupOne(page, sessionId, hasRegistrations) {
  await page.goto(`${BASE_URL}/sessions/${sessionId}`, { waitUntil: "networkidle" })
  const notFound = await page.getByText("見つかりません").isVisible().catch(() => false)
  if (notFound) {
    log(sessionId, "既に存在しません(スキップ)")
    return
  }

  if (hasRegistrations) {
    // 開催中止(未確定ならそのまま中止、確定済みなら返金・スタンプ戻しが走る)
    const cancelBtn = page.getByRole("button", { name: "セッションを中止" })
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelBtn.click()
      await page.waitForTimeout(800)
      const confirmBtn = page.getByRole("button", { name: /^(中止する|セッションを中止する)$/ })
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click()
        await page.waitForTimeout(4000)
        log(sessionId, "中止(返金/スタンプ戻し)を実行しました")
      }
    }
    await page.reload({ waitUntil: "networkidle" })
  }

  const deleteBtn = page.getByRole("button", { name: "セッションを削除" })
  if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.click()
    await page.waitForTimeout(800)
    const confirmDelete = page.getByRole("button", { name: /^(削除する|削除)$/ })
    if (await confirmDelete.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmDelete.click()
      await page.waitForTimeout(2000)
      log(sessionId, "削除しました")
    } else {
      log(sessionId, "削除確認ダイアログが見つかりませんでした")
    }
  } else {
    const bodyText = await page.locator("body").innerText()
    log(sessionId, `削除ボタンが見つかりません(まだガードされている可能性): ${bodyText.slice(0, 300)}`)
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await login(page, "test2@example.com", "Delta-coach8820!")
    for (const [sessionId, , hasRegistrations] of TARGETS) {
      await cleanupOne(page, sessionId, hasRegistrations)
    }
  } finally {
    await browser.close()
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FAILED:", e); process.exit(1) })
