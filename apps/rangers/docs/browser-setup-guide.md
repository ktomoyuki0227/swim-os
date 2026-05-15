# Rangers ブラウザ操作ガイド

## 現在の状況

- [x] Supabase プロジェクト作成済み
- [x] Stripe アカウント作成・APIキー取得済み
- [x] Vercel デプロイ済み（Rangers 稼働中）
- [ ] Supabase マイグレーション実行（テーブル作成）
- [ ] Vercel に Stripe 環境変数を追加
- [ ] Stripe Webhook 設定
- [ ] 動作確認

---

## STEP 1: Supabase マイグレーション実行

テーブルとRLSポリシーを作成します。

1. [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. Rangers プロジェクトを選択
3. 左メニュー → **SQL Editor** → 「New query」

### 1-1: スキーマ作成

以下を貼り付けて「Run」:

```sql
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

### 1-2: RLSポリシー設定

新しいクエリを開いて以下を貼り付けて「Run」:

```sql
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

create policy "自分の予約のみ更新可（スイマー）"
  on bookings for update using (swimmer_id = auth.uid());

create policy "自分のレッスンの予約を更新可（指導員）"
  on bookings for update using (
    exists (
      select 1 from lessons
      where lessons.id = bookings.lesson_id
      and lessons.instructor_id = auth.uid()
    )
  );
```

### 1-3: 既存ユーザーのロール設定（登録済みの場合）

すでにアカウント登録している場合、profilesテーブルのroleが `swimmer`（デフォルト）になっています。
指導員アカウントにしたい場合は以下を実行:

```sql
-- メールアドレスから該当ユーザーのIDを調べて更新
-- Authentication > Users でUIDを確認し、以下のUUIDを書き換えて実行
update profiles set role = 'instructor' where id = 'ここにUID';
```

---

## STEP 2: Vercel に Stripe 環境変数を追加

1. [Vercel Dashboard](https://vercel.com/dashboard) を開く
2. Rangers プロジェクトを選択
3. **Settings** → **Environment Variables**
4. 以下の2つを追加（`STRIPE_WEBHOOK_SECRET` は STEP 3 後に追加）:

| 変数名 | 値の取得場所 |
|--------|------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |

5. 追加後 **Redeploy** を実行（Deployments → 最新のデプロイ → Redeploy）

---

## STEP 3: Stripe Webhook 設定

支払い完了後に予約ステータスを自動で `confirmed` に更新するために必要です。

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. 「**Add endpoint**」をクリック
3. 以下を入力:

| 項目 | 値 |
|------|-----|
| Endpoint URL | `https://あなたのVercelドメイン/api/webhooks/stripe` |
| Events | `payment_intent.succeeded` と `payment_intent.payment_failed` |

4. 作成後に表示される **Signing secret**（`whsec_xxxxx`）をコピー
5. Vercel → Settings → Environment Variables に `STRIPE_WEBHOOK_SECRET` を追加
6. Vercelで再デプロイ

---

## STEP 4: 動作確認チェックリスト

- [ ] 指導員アカウントでログイン → ダッシュボードが表示される
- [ ] レッスン作成 → スイマー側の一覧に表示される
- [ ] スイマーアカウントで予約 → 予約履歴に表示される
- [ ] Stripe設定後: 決済完了 → 予約ステータスが `confirmed` になる

---

## テストカード（Stripe テストモード）

| カード番号 | 結果 |
|-----------|------|
| 4242 4242 4242 4242 | 成功 |
| 4000 0000 0000 0002 | カード拒否 |

有効期限: 未来の日付（例: 12/34）/ CVC: 任意の3桁（例: 123）
