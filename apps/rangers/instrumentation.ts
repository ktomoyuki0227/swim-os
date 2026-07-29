// サーバー起動時に一度だけ呼ばれる（Next.js 15+で安定化）。
// 本番環境で必須の環境変数が欠けている場合、リクエストの奥深くで
// 分かりにくい失敗をする代わりに、起動時点で明確に失敗させる。
// 開発環境では Stripe 未設定でも動作させたいため対象外とする
// （lib/stripe.ts の遅延初期化・各Server Actionの
// `if (!process.env.STRIPE_SECRET_KEY)` ガードと役割分担）。
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NODE_ENV !== "production") return

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ]
  const missing = required.filter((name) => !process.env[name])

  if (missing.length > 0) {
    throw new Error(
      `[instrumentation] 本番環境で必須の環境変数が未設定です: ${missing.join(", ")}`
    )
  }
}
