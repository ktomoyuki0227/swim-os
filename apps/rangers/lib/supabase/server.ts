import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database-generated"
import { publicEnv } from "@/lib/env"
import { serverEnv } from "@/lib/env.server"

/**
 * Service role クライアント — RLS をバイパスしてサーバー内部処理に使用。
 *
 * ## いつ createClient() ではなくこちらを使うか
 *
 * `teams` / `practice_sessions` / `team_members` は互いを参照し合うRLSポリシー
 * (例: teams のポリシーが team_members を、team_members のポリシーが teams を
 * 参照する)になっており、通常の createClient()（RLS適用あり）で操作すると
 * 自己参照ループでブロックされる。エラーを返さずに0件更新のまま "success" が
 * 返ることもあり、原因の切り分けが難しい。
 *
 * → これら3テーブルに触れる Server Action は必ず createAdminClient() を使い、
 *   認可は `lib/auth/require-team-admin.ts` の isTeamAdmin() / isTeamMember() で
 *   手動チェックすること（RLSではなくこのチェックが実質的なセキュリティ境界になる）。
 *
 * 上記以外の大半のテーブル（profiles, membership_fees, notifications 等）は
 * RLSポリシーが自己参照しないため、通常は createClient() で問題ない。
 * ただし決済状態(payment_status/charged_amount等)を書き換える処理は、
 * RLSに認可ロジックを委ねず createAdminClient() + 明示的な認可チェックで
 * 統一している（Stripe連携のビジネスロジックをRLS経由でバイパスされないようにするため）。
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    publicEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey
  )
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component からの呼び出し時は set できないため無視
          }
        },
      },
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    }
  )
}
