import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

type ApiAuthResult =
  | { user: User; supabase: Awaited<ReturnType<typeof createClient>>; response?: undefined }
  | { user?: undefined; supabase?: undefined; response: NextResponse }

/**
 * app/api/** 配下の認証チェック用共通ヘルパー。middleware.ts はAPIルートを
 * 認証エラー時のリダイレクト処理から除外している(APIはHTMLリダイレクトではなく
 * JSONを返す必要があるため)ため、各APIルートハンドラが個別に auth.getUser() を
 * 呼ぶ設計になっている。新しいAPIルートを追加する際にこのチェックを呼び忘れると
 * 無防備なエンドポイントになるため、共通ヘルパーとして切り出し呼び忘れを防ぐ。
 * JSONレスポンスを返すAPIルート向け。
 */
export async function requireApiUser(): Promise<ApiAuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { user, supabase }
}

/**
 * requireApiUser のリダイレクト版。ブラウザが直接遷移してくるルート
 * (Stripeオンボーディング/コールバックのリダイレクト等)向けに、JSONではなく
 * 指定URLへのリダイレクトを返す。
 */
export async function requireRedirectUser(
  unauthorizedRedirectUrl: string | URL
): Promise<ApiAuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { response: NextResponse.redirect(unauthorizedRedirectUrl) }
  }
  return { user, supabase }
}
