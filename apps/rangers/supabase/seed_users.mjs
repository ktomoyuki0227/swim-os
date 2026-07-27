/**
 * Rangers テストユーザー作成スクリプト
 *
 * 実行方法:
 *   node supabase/seed_users.mjs
 *
 * 必要な環境変数 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * GoTrue v2 以降は auth.users への直接 INSERT が動作しないため、
 * Admin API 経由でユーザーを作成する必要があります。
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf8")
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()
const svcKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()

if (!url || !svcKey) {
  console.error("環境変数が見つかりません (.env.local を確認)")
  process.exit(1)
}

const admin = createClient(url, svcKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  { email: "test1@example.com", name: "山田 健太", role: "チーム管理者" },
  { email: "test2@example.com", name: "鈴木 太郎", role: "レギュラー会員" },
  { email: "test3@example.com", name: "佐藤 花子", role: "回数券会員" },
  { email: "test4@example.com", name: "田中 新太郎", role: "新規ユーザー" },
]

for (const u of USERS) {
  // 既存ユーザーを確認
  const { data: list } = await admin.auth.admin.listUsers()
  const existing = list?.users?.find((x) => x.email === u.email)

  if (existing) {
    // パスワードをリセット
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: "Delta-coach8820!",
    })
    if (error) console.error(`${u.email} update error:`, error.message)
    else console.log(`${u.email} パスワードリセット OK (id: ${existing.id})`)
  } else {
    // 新規作成
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: "Delta-coach8820!",
      email_confirm: true,
      user_metadata: { name: u.name },
    })
    if (error) console.error(`${u.email} create error:`, error.message)
    else console.log(`${u.email} 作成 OK (id: ${data.user.id}) — ${u.role}`)
  }
}

console.log("\n次のステップ:")
console.log("  npx supabase db query --linked --file supabase/seed_data.sql")
