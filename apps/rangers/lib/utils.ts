import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 配列の各要素に対して非同期処理を実行するが、同時実行数を制限する。
 * Stripe APIのように大量の独立した決済リクエストを1件ずつ直列処理すると
 * 参加者数に比例して処理時間が伸びサーバーレス関数のタイムアウトに近づくため、
 * 完全な直列(for-await)と無制限並列(Promise.all)の中間を取る。
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * リダイレクト先として安全なパスのみを許可する。
 * ドメイン部を含む絶対URLや `//evil.com` のようなプロトコル相対URLを弾き、
 * オープンリダイレクトを防ぐ。
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}
