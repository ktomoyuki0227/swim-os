-- Rangers 初期スキーマ
-- profiles, lessons, bookings テーブル

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
