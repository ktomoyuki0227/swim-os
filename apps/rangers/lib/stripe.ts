import "server-only"
import Stripe from "stripe"

// Stripeクライアントの生成をモジュール読み込み時ではなく初回アクセス時まで遅延させる。
// `new Stripe(undefined)` はコンストラクタ内で同期的にthrowするため、
// STRIPE_SECRET_KEY未設定環境（ローカル開発等）でimportした瞬間にアプリ全体が
// クラッシュしてしまう問題があった。呼び出し側の `if (!process.env.STRIPE_SECRET_KEY) ...`
// というガードが機能するよう、実際の初期化はガードを通過した後の初回プロパティアクセス時に行う。
let cachedClient: Stripe | null = null

function getStripeClient(): Stripe {
  if (!cachedClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    })
  }
  return cachedClient
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeClient(), prop, receiver)
  },
})
