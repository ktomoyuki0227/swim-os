# Rangers ブラウザ操作ガイド

このドキュメントに沿って、外部サービスのセットアップを進めてください。
完了したらチェックを入れていってください。

---

## 1. Supabase プロジェクト作成

### 1-1. プロジェクト作成

1. https://supabase.com/dashboard にログイン
2. "New Project" をクリック
3. 以下の設定で作成:
   - Organization: 既存 or 新規作成
   - Project name: `rangers`
   - Database Password: 強力なパスワードを設定（メモしておく）
   - Region: `Northeast Asia (Tokyo)` を選択
   - Plan: Free
4. プロジェクト作成完了まで数分待つ

### 1-2. API キーの取得

1. Settings > API に移動
2. 以下の3つをメモ:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`（秘密鍵。公開しない）

### 1-3. マイグレーション実行

SQL Editor に移動して、以下の順番で実行する。

順番1: `supabase/migrations/00001_initial_schema.sql` の内容をコピペして "Run"

```sql
-- === 00001_initial_schema.sql の内容 ===

-- ユーザープロフィール（Supabase Auth と連携）
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('swimmer', 'instructor', 'admin')) default 'swimmer',
  name text not null default '',
  avatar_url text,
  stripe_account_id text,
  created_at timestamptz not null default now()
);

-- レッスン
create table lessons (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price integer not null default 0,
  capacity integer not null default 1,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60,
  location text not null default '',
  status text not null check (status in ('draft', 'published', 'cancelled')) default 'draft',
  created_at timestamptz not null default now()
);

-- 予約
create table bookings (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  swimmer_id uuid not null references profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'confirmed', 'cancelled')) default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  unique (lesson_id, swimmer_id)
);

-- インデックス
create index idx_lessons_instructor on lessons(instructor_id);
create index idx_lessons_status_scheduled on lessons(status, scheduled_at);
create index idx_bookings_lesson on bookings(lesson_id);
create index idx_bookings_swimmer on bookings(swimmer_id);

-- Auth トリガー: ユーザー登録時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

順番2: `supabase/migrations/00002_rls_policies.sql` の内容をコピペして "Run"

```sql
-- === 00002_rls_policies.sql の内容 ===

-- profiles
alter table profiles enable row level security;

create policy "プロフィールは誰でも閲覧可"
  on profiles for select using (true);

create policy "自分のプロフィールのみ更新可"
  on profiles for update using (auth.uid() = id);

-- lessons
alter table lessons enable row level security;

create policy "公開レッスンは誰でも閲覧可"
  on lessons for select using (
    status = 'published' or instructor_id = auth.uid()
  );

create policy "指導員のみレッスン作成可"
  on lessons for insert with check (
    instructor_id = auth.uid()
    and exists (
      select 1 from profiles where id = auth.uid() and role = 'instructor'
    )
  );

create policy "自分のレッスンのみ更新可"
  on lessons for update using (instructor_id = auth.uid());

create policy "自分のレッスンのみ削除可"
  on lessons for delete using (instructor_id = auth.uid());

-- bookings
alter table bookings enable row level security;

create policy "自分の予約は閲覧可"
  on bookings for select using (
    swimmer_id = auth.uid()
    or exists (
      select 1 from lessons where lessons.id = bookings.lesson_id and lessons.instructor_id = auth.uid()
    )
  );

create policy "スイマーのみ予約作成可"
  on bookings for insert with check (
    swimmer_id = auth.uid()
    and exists (
      select 1 from profiles where id = auth.uid() and role = 'swimmer'
    )
  );

create policy "自分の予約のみ更新可"
  on bookings for update using (swimmer_id = auth.uid());
```

### 1-4. 認証設定

1. Authentication > Providers に移動
2. Email: 有効になっていることを確認（デフォルトで有効）
3. Google OAuth（任意。後からでもOK）:
   - Google Cloud Console で OAuth 2.0 クライアント ID を作成
   - Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
   - Client ID と Client Secret を Supabase に入力

---

## 2. Stripe アカウント作成

### 2-1. アカウント作成

1. https://dashboard.stripe.com/register にアクセス
2. アカウント作成（メールアドレス + パスワード）
3. ログイン後、左上のトグルが「テストモード」になっていることを確認（オレンジ色のバー）

### 2-2. API キーの取得

1. Developers > API keys に移動
2. 以下の2つをメモ:
   - Publishable key（`pk_test_...`）→ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key（`sk_test_...`）→ `STRIPE_SECRET_KEY`

### 2-3. Webhook 設定（ローカル開発用）

ローカル開発中は Stripe CLI を使う方法が簡単。後でセットアップする。
Vercel デプロイ後に本番 Webhook を設定する。

Vercel デプロイ後の Webhook 設定:
1. Developers > Webhooks > "Add endpoint"
2. Endpoint URL: `https://<your-vercel-domain>/api/webhooks/stripe`
3. Events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. 作成後に表示される Signing secret → `STRIPE_WEBHOOK_SECRET`

---

## 3. 環境変数の設定（.env.local）

Supabase と Stripe の情報が揃ったら、`apps/rangers/.env.local` を作成:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

設定後、`pnpm dev` で起動して動作確認。

---

## 4. Vercel デプロイ

### 4-1. プロジェクト作成

1. https://vercel.com/dashboard にログイン
2. "Add New..." > "Project"
3. GitHub リポジトリ `ktomoyuki0227/swim-os` をインポート
4. Framework Preset: Next.js
5. Root Directory: `apps/rangers` に変更（"Edit" をクリック）
6. Environment Variables に .env.local と同じ値を設定（STRIPE_WEBHOOK_SECRET は後で）
7. "Deploy" をクリック

### 4-2. デプロイ後

1. デプロイ URL をメモ（例: `rangers-xxx.vercel.app`）
2. Stripe Dashboard で Webhook エンドポイントを追加（セクション 2-3 参照）
3. Webhook の Signing secret を Vercel の環境変数に追加

---

## 5. 動作確認チェックリスト

全セットアップ完了後に確認:

- [ ] `pnpm dev` でローカル起動できる
- [ ] 新規登録（スイマー）ができる
- [ ] 新規登録（指導員）ができる
- [ ] ログイン・ログアウトができる
- [ ] 指導員: レッスン作成ができる
- [ ] スイマー: レッスン一覧が見れる
- [ ] スイマー: レッスン詳細が見れる
- [ ] スイマー: 予約（決済）ができる（テストカード: 4242 4242 4242 4242）
- [ ] 指導員: 予約一覧に表示される
- [ ] Vercel にデプロイできている

---

## テストカード情報（Stripe テストモード）

| カード番号 | 結果 |
|-----------|------|
| 4242 4242 4242 4242 | 成功 |
| 4000 0000 0000 0002 | カード拒否 |
| 4000 0000 0000 3220 | 3Dセキュア認証 |

有効期限: 未来の任意の日付（例: 12/34）
CVC: 任意の3桁（例: 123）
