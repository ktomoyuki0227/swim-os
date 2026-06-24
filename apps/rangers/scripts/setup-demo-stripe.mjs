/**
 * デモユーザー向け Stripe テストカード登録スクリプト
 *
 * 実行方法:
 *   node scripts/setup-demo-stripe.mjs
 *
 * 前提:
 *   - .env.local に STRIPE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定済み
 *   - Stripe がテストモード（sk_test_... で始まる）であること
 */

import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// .env.local を手動で読み込む
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, "../.env.local")

const env = {}
try {
  const content = readFileSync(envPath, "utf8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "")
    env[key] = val
  }
} catch {
  console.error(".env.local が見つかりません。環境変数を直接設定してください。")
}

const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("必要な環境変数が不足しています: STRIPE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

if (!STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  console.error("STRIPE_SECRET_KEY がテストモードではありません。本番キーには実行しないでください。")
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY)
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_EMAILS = [
  "test1@example.com",
  "test2@example.com",
  "test3@example.com",
  "test4@example.com",
]

// Stripe テストモード用の事前定義 PaymentMethod フィクスチャ
// https://stripe.com/docs/testing#payment-methods
const TEST_PM_FIXTURE = "pm_card_visa"

async function run() {
  console.log("🚀 デモユーザーへの Stripe テストカード登録を開始します\n")

  // auth.users からデモユーザーを取得
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
  if (listError) {
    console.error("auth.admin.listUsers() 失敗:", listError.message)
    process.exit(1)
  }

  const demoUsers = users.filter((u) => DEMO_EMAILS.includes(u.email ?? ""))
  if (demoUsers.length === 0) {
    console.error("デモユーザーが見つかりません。seed を先に実行してください。")
    process.exit(1)
  }

  // profiles を取得
  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select("id, name, stripe_customer_id, stripe_payment_method_id")
    .in("id", demoUsers.map((u) => u.id))

  if (profileError) {
    console.error("profiles 取得失敗:", profileError.message)
    process.exit(1)
  }

  for (const authUser of demoUsers) {
    const profile = profiles?.find((p) => p.id === authUser.id)
    if (!profile) {
      console.log(`⚠️  ${authUser.email}: profile なし（スキップ）`)
      continue
    }

    const label = `${authUser.email}（${profile.name}）`

    // すでにカード登録済みならスキップ
    if (profile.stripe_payment_method_id) {
      console.log(`✅ ${label}: カード登録済み（スキップ）`)
      continue
    }

    try {
      // 1. Stripe Customer を取得 or 作成
      let customerId = profile.stripe_customer_id
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: authUser.email,
          name: profile.name,
          metadata: { supabase_user_id: profile.id },
        })
        customerId = customer.id
        console.log(`   Customer 作成: ${customerId}`)
      } else {
        console.log(`   Customer 既存: ${customerId}`)
      }

      // 2. テスト用 PM フィクスチャを Customer にアタッチ
      //    pm_card_visa はテストモード専用のプリセット PM（Stripe が内部でコピーを作成する）
      const pm = await stripe.paymentMethods.attach(TEST_PM_FIXTURE, { customer: customerId })
      console.log(`   PaymentMethod アタッチ: ${pm.id}`)

      // 4. デフォルト支払い方法に設定
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: pm.id },
      })

      // 5. Supabase profiles を更新
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          stripe_customer_id: customerId,
          stripe_payment_method_id: pm.id,
        })
        .eq("id", profile.id)

      if (updateError) {
        console.error(`❌ ${label}: DB 更新失敗 — ${updateError.message}`)
        continue
      }

      console.log(`✅ ${label}: テストカード登録完了`)
    } catch (err) {
      console.error(`❌ ${label}: エラー — ${err.message}`)
    }

    console.log("")
  }

  console.log("🎉 完了")
}

run()
