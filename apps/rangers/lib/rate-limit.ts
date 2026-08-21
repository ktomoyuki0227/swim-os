import { headers } from "next/headers"

interface Bucket {
  count: number
  resetAt: number
}

// サーバーインスタンスのメモリ内に保持する簡易レート制限。
// Fluid Compute はインスタンスを再利用するため一定の効果はあるが、
// インスタンスをまたいだ分散カウントにはならない点に注意。
// より強固な保証が必要になった場合はUpstash Ratelimit等への置き換えを検討する。
const buckets = new Map<string, Bucket>()

const MAX_BUCKETS = 5000

function pruneIfNeeded(now: number) {
  if (buckets.size <= MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/**
 * key単位でウィンドウ内の試行回数を制限する。
 * 戻り値 true = 制限超過（リクエストを拒否すべき）
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  pruneIfNeeded(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  bucket.count += 1
  return bucket.count > limit
}

/**
 * Server Action から呼び出し元IPを取得する（Vercel/プロキシ経由を想定）。
 *
 * x-forwarded-for は「各ホップが自分に接続してきたIPを末尾に追記していく」形式
 * (client, proxy1, proxy2, ...)のヘッダーで、先頭の値はクライアントが
 * リクエストヘッダーとして自由に送信できてしまう(=偽装可能)。信頼できるのは
 * 自分たちの直近の信頼できるプロキシ(Vercelのエッジ)が実際の接続元として
 * 追記した末尾の値だけなので、先頭ではなく末尾を採用する。
 * これを怠ると、リクエストごとに異なる x-forwarded-for を送るだけで
 * ログイン試行回数制限等のレート制限キーを無限にリセットできてしまう。
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwardedFor = h.get("x-forwarded-for")
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((v) => v.trim()).filter(Boolean)
    if (ips.length > 0) return ips[ips.length - 1]
  }
  return h.get("x-real-ip") ?? "unknown"
}
