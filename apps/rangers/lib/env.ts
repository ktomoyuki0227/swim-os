function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。.env.local に ${name} を設定してください。`
    )
  }
  return value
}

/** ブラウザ・サーバー双方から参照可能な公開環境変数。起動時に存在を検証する。 */
export const publicEnv = {
  supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
}
