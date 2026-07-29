# Rangers

スイミングチーム/スクール運営者向けの管理プラットフォーム。チーム・セッション（練習/大会/イベント）管理、メンバー管理、年会費・月謝・回数券の決済（Stripe）、メッセージ、通知などを提供する。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router, Turbopack) / React 19 / TypeScript
- **DB / Auth / Storage**: Supabase (Postgres + Row Level Security)
- **決済**: Stripe（Card決済・Subscription・Stripe Connect）
- **バリデーション**: Zod
- **スタイリング**: Tailwind CSS 4 + shadcn/ui（詳細は [DESIGN.md](./DESIGN.md)）

> ⚠️ このプロジェクトは Next.js 16 を使用しており、学習データにある古いNext.jsの知識と挙動が異なる場合がある。
> 不明な点は `node_modules/next/dist/docs/` の同梱ドキュメントを参照すること（詳細は [AGENTS.md](./AGENTS.md)）。

## セットアップ

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) で起動する。

### 必須環境変数（`.env.local`）

| 変数名 | 用途 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key（クライアント用） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key（**サーバー専用**。ブラウザに露出させない） |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key（本番では必須。ローカル開発では未設定でも起動可） |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 署名検証用シークレット（本番では必須） |
| `NEXT_PUBLIC_APP_URL` | Stripe Connect のリダイレクト先等に使うアプリのベースURL |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | デモログインボタンの表示切り替え |

`SUPABASE_SERVICE_ROLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` は本番環境では必須で、
`instrumentation.ts` が起動時にチェックし、未設定なら起動を失敗させる（`NODE_ENV=production` 時のみ）。
ローカル開発では Stripe 未設定でも動作するが、決済系の機能はソフトエラーを返す。

### Stripe Webhook のローカルテスト

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## データアクセスの重要な規約

`teams` / `practice_sessions` / `team_members` は互いを参照し合う RLS ポリシーになっており、
通常の `createClient()`（RLS適用あり）で操作すると自己参照ループでブロックされる
（エラーを返さず0件更新のまま成功扱いになることもあり、原因の切り分けが難しい）。

→ これら3テーブルに触れる Server Action は必ず `createAdminClient()`（service role, RLSバイパス）を使い、
認可は `lib/auth/require-team-admin.ts` の `isTeamAdmin()` / `isTeamMember()` で手動チェックする。
詳細は `lib/supabase/server.ts` のコメントを参照。

決済状態（`payment_status` / `charged_amount` 等）を書き換える処理も同様に、RLSに認可ロジックを
委ねず `createAdminClient()` + 明示的な認可チェックで統一している（Server Action を経由せず
DBを直接叩かれても決済フローをバイパスできないようにするため）。

## マイグレーション

`supabase/migrations/` に連番のSQLファイルとして管理する。適用状況は
`npx supabase migration list --linked` で確認できる。

```bash
npx supabase db push --linked
```

適用後は `npx supabase db query --linked "SELECT ..."` で実際にスキーマへ反映されたか確認すること
（`migration repair` は履歴テーブルの記録を更新するだけで実SQLを実行しない点に注意）。

## ドキュメント

- [AGENTS.md](./AGENTS.md) — このNext.jsバージョン固有の注意点
- [DESIGN.md](./DESIGN.md) — デザイントークン・UIルール
- [CLAUDE.md](./CLAUDE.md) — AI開発アシスタント向けの指示
- [docs/status.md](../../docs/status.md) — 開発ステータス・直近の作業履歴（プロジェクト横断）
