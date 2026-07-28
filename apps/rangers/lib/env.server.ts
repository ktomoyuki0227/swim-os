// サーバー専用の必須環境変数。クライアントコンポーネントからimportしないこと
// (Service Roleキーはブラウザに露出させてはならない)。

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。.env.local に ${name} を設定してください。`
    )
  }
  return value
}

export const serverEnv = {
  supabaseServiceRoleKey: requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ),
}
