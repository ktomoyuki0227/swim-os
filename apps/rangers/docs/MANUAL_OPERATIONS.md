# Rangers 手動作業チェックリスト

ともくんが自分でやらないといけない作業をまとめた。
上から順番にやれば OK。

---

## 1. Supabase マイグレーション実行（必須・最優先）

ローカルで書いたマイグレーションをまだ Supabase 本番に適用していない場合は必ず実行する。

### やり方（Supabase ダッシュボード）

1. https://supabase.com/dashboard → `jeosqnkeyiwapeeujrml` プロジェクトを開く
2. 左メニュー「SQL Editor」を開く
3. 以下のファイルを順番に貼り付けて「Run」

| 順番 | ファイル | 内容 |
|------|---------|------|
| 1 | `supabase/migrations/00006_teams.sql` | チーム・メンバー・セッション等、Rangers の全テーブル |
| 2 | `supabase/migrations/00007_competition_and_price_views.sql` | 競技フィールド・価格ビュー |
| 3 | `supabase/migrations/00008_performance_indexes.sql` | パフォーマンス用インデックス |
| 4 | `supabase/migrations/00009_security_fixes.sql` | セキュリティ修正（RLS 強化） |
| 5 | `supabase/migrations/00010_increment_stamp_by.sql` | アトミックなスタンプ加算 RPC + teams_update RLS with check |

> すでに適用済みのマイグレーションを再実行しても `if not exists` / `create or replace` で冪等に動く設計なので、重複実行しても壊れない。

### CLI で一括適用する場合（Supabase CLI が入っていれば）

```bash
cd apps/rangers
npx supabase db push --linked
```

---

## 2. シードデータ投入（開発・デモ用。本番は不要）

デモ環境やローカルで動作確認したい場合のみ。

```
supabase/seed.sql        ← ユーザー・プロフィール等の基本データ
supabase/seed_teams.sql  ← チーム・メンバー・セッション等のサンプルデータ
```

SQL Editor で `seed.sql` → `seed_teams.sql` の順に実行。

---

## 3. Stripe ウェブフック設定（Stripe 決済を使う前に必須）

現在コードは TODO コメントアウト状態だが、Stripe 連携を有効化するときに必要。

1. https://dashboard.stripe.com → 「Webhooks」を開く
2. 「Add endpoint」でデプロイ先 URL を登録
   - エンドポイント: `https://あなたのドメイン/api/webhooks/stripe`
   - イベント: `payment_intent.succeeded`, `payment_intent.payment_failed`
3. 発行された `whsec_xxx` を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定

> 現時点では Stripe 決済はすべてコメントアウトされているので、マイグレーションとアプリ起動には影響しない。

---

## 4. LINE ログイン設定（LINE 連携を使う場合）

LINE でのソーシャルログインを有効にしたい場合：

1. https://developers.line.biz → チャネルを作成
2. Supabase ダッシュボード → Authentication → Providers → LINE を有効化
3. Channel ID / Channel Secret を入力
4. コールバック URL を LINE 側に登録: `https://jeosqnkeyiwapeeujrml.supabase.co/auth/v1/callback`

> 現状はメール認証のみで動作するので、LINE 連携は後回しでも OK。

---

## 5. 動作確認フロー（ブラウザでの手動テスト）

実装完了後、以下の順番で画面を触って確認する。

### コーチ（インストラクター）側

- [ ] メール登録 → ログイン
- [ ] チーム作成（`/instructor/teams/new`）→ チームが一覧に出る
- [ ] 招待コードをコピー（`/instructor/teams/[id]?tab=invite`）
- [ ] セッション作成（`/instructor/sessions/new`）
- [ ] お知らせ作成（チーム詳細の「お知らせ」タブ）
- [ ] 会費一括生成（`/instructor/fees`）

### スイマー側

- [ ] 別アカウントでメール登録 → ログイン
- [ ] 招待コードで参加（`/teams` の「コードで参加」）
- [ ] セッション一覧を確認（`/teams/[id]`）
- [ ] セッション登録
- [ ] お知らせ既読

### 確認ポイント

- Supabase ダッシュボードの「Table Editor」でレコードが正しく入っているか確認
- notifications テーブルに通知レコードが生成されているか確認

---

## 6. デプロイ（Vercel）

```bash
# リポジトリを GitHub に push 済みであること前提
# Vercel プロジェクトの環境変数に以下を設定

NEXT_PUBLIC_SUPABASE_URL=https://jeosqnkeyiwapeeujrml.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（.env.local から）
SUPABASE_SERVICE_ROLE_KEY=（.env.local から）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=（.env.local から）
STRIPE_SECRET_KEY=（.env.local から）
STRIPE_WEBHOOK_SECRET=（.env.local から）
```

> `SUPABASE_SERVICE_ROLE_KEY` は必須。これがないと通知の書き込みがすべて失敗する。

---

## 優先順位まとめ

| 優先度 | 作業 | 理由 |
|--------|------|------|
| 今すぐ | マイグレーション 00006〜00010 の適用 | これがないとアプリが動かない |
| 今すぐ | 動作確認フロー | バグ発見のため |
| デプロイ前 | Vercel 環境変数の設定 | 特に SERVICE_ROLE_KEY |
| 後回し OK | Stripe ウェブフック | 決済はまだコメントアウト |
| 後回し OK | LINE ログイン | メール認証で代替可能 |
