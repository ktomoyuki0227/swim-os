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

/** Server Action から呼び出し元IPを取得する（Vercel/プロキシ経由を想定） */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwardedFor = h.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()
  return h.get("x-real-ip") ?? "unknown"
}
