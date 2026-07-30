# Rangers

スイミングチーム/スクール運営者向けの管理プラットフォーム。チーム・セッション（練習/大会/イベント）管理、メンバー管理、年会費・月謝・回数券・都度参加費の決済（Stripe）、Stripe Connectによる送金分配、メッセージ、通知などを提供する。

## 主な機能

- **チーム管理**: 作成・招待コード・参加申請・メンバー管理・タグ・お知らせ
- **セッション管理**: 練習/大会/イベントの作成・参加登録・出欠・定員/コース代ルール・キャンセル待ち
- **決済（Stripe）**:
  - 都度参加費（Stripe Elements / PaymentIntent）
  - 月謝（Stripe Subscription）
  - 年会費
  - 回数券（アプリ内DB残高管理、管理者が購入記録を手動登録）
  - Stripe Connect によるコーチ/チームへの送金分配
- **メッセージ・通知**: DM、お知らせ既読管理、通知一覧
- **公開ページ**: チーム紹介・コーチプロフィール・問い合わせフォーム

全39ページ実装済み（LP / 認証・オンボーディング / メイン機能 / 公開ページ）。詳細な機能一覧・過去の実装履歴は [docs/status.md](../../docs/status.md) を参照。

## 技術スタック

- **フレームワーク**: Next.js 16（App Router, Turbopack）/ React 19 / TypeScript
- **DB / Auth / Storage**: Supabase（Postgres + Row Level Security）
- **決済**: Stripe（Card決済・Subscription・Stripe Connect）
- **バリデーション**: Zod
- **スタイリング**: Tailwind CSS 4 + shadcn/ui（詳細は [DESIGN.md](./DESIGN.md)）
- **ホスティング**: Vercel

正確なバージョンは [package.json](./package.json) を参照。

> ⚠️ このプロジェクトは Next.js 16 を使用しており、学習データにある古いNext.jsの知識と挙動が異なる場合がある。
> 不明な点は `node_modules/next/dist/docs/` の同梱ドキュメントを参照すること（詳細は [AGENTS.md](./AGENTS.md)）。

## ディレクトリ構成（概要）

```
app/
├── (public)/   # 未ログインでも見れる公開ページ
├── (auth)/     # ログイン・登録・オンボーディング
├── (app)/      # ログイン必須のメインアプリ
└── api/stripe/ # Webhook / Connect callback / setup-intent

actions/        # Server Actions（DB書き込みの実体はほぼ全てここ）
lib/            # Supabaseクライアント・Stripeヘルパー・認可・バリデーション
types/          # database-generated.ts（Supabase CLI自動生成）+ database.ts（独自型）
supabase/migrations/ # 連番SQL（現在 00001〜00064）
components/     # UIコンポーネント（shadcn/ui ベース）
```

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
DBを直接叩かれても決済フローをバイパスできないようにするため）。`session_registrations` /
`membership_fees` / `stamp_purchases` は通常ロールからの書き込み経路自体をRLSで閉じている
（migration `00059`）。

## マイグレーション

`supabase/migrations/` に連番のSQLファイルとして管理する。適用状況は
`npx supabase migration list --linked` で確認できる。

```bash
npx supabase db push --linked
```

適用後は `npx supabase db query --linked "SELECT ..."` で実際にスキーマへ反映されたか確認すること
（`migration repair` は履歴テーブルの記録を更新するだけで実SQLを実行しない点に注意）。

## テスト・品質チェック

自動テスト（unit / integration / E2E）は現時点で存在しない。CI（GitHub Actions等）も未設定。
品質担保は以下に依存している。

- `pnpm tsc --noEmit`（型チェック）
- `pnpm lint`（ESLint）
- `pnpm build`（本番ビルド）
- Supabase advisors（`security` / `performance`）の定期確認
- 変更のたびにAIエージェント（security-reviewer / database-reviewer / typescript-reviewer 等）による
  コードレビューを実施し、指摘を実コードで裏取りした上で修正するサイクルを回している

新規実装時は上記チェックを通すこと。テストコードが存在しない前提でのリグレッションリスクには
特に注意する。

## 開発状況・既知の制限

- DB: 21テーブル（うち `lessons` / `bookings` / `reviews` / `schedule_requests` は初期設計の名残で
  実コードから未参照のレガシーテーブル）。RLS全設定済み
- 認証: メール/パスワード + Google OAuth（LINEはスタブのみ・未実装）
- 本番 Supabase プロジェクト（`jeosqnkeyiwapeeujrml`）には実データ・実利用者が存在する
- 未着手のバックログ（詳細は [docs/status.md](../../docs/status.md) 参照）:
  - Supabase Dashboardでの Leaked Password Protection 有効化
  - Sentry等の構造化エラー監視の導入要否
  - WCAGコントラスト比の一部未達、見出し構造（h1）欠如ページ、`loading.tsx` 欠如ルート
  - 通知文言のカタログ化、Zodバリデーション適用基準の明文化
  - 特定商取引法ページのプレースホルダーTODO（事業者情報待ち）

## ドキュメント

- [AGENTS.md](./AGENTS.md) — このNext.jsバージョン固有の注意点
- [DESIGN.md](./DESIGN.md) — デザイントークン・UIルール
- [CLAUDE.md](./CLAUDE.md) — AI開発アシスタント向けの指示
- [docs/status.md](../../docs/status.md) — 開発ステータス・直近の作業履歴（プロジェクト横断）
- [docs/for-reviewer/INDEX.md](./docs/for-reviewer/INDEX.md) — 社外エンジニアへのレビュー依頼用にまとめた資料一式（渡すべきドキュメントの案内込み）
