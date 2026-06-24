-- Stripe Connect サポート（指導員への売上送金）
-- teams に Connected Account ID を追加
-- platform_settings テーブル（手数料率など）
-- transfer_records テーブル（送金監査証跡）

-- teams に Stripe Connect 関連カラム追加
alter table teams
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_completed boolean not null default false;

-- プラットフォーム設定テーブル（手数料率など DB 管理で柔軟に変更可能）
create table if not exists platform_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

-- 初期値: 手数料率（関係者と確定するまでは placeholder）
insert into platform_settings (key, value, description)
values ('platform_fee_percent', '10', 'プラットフォーム手数料率（%） — 関係者と要確認')
on conflict (key) do nothing;

-- 送金記録テーブル（監査証跡）
create table if not exists transfer_records (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id),
  session_id uuid references practice_sessions(id),
  registration_id uuid references session_registrations(id),
  stripe_payment_intent_id text not null,
  stripe_transfer_id text,                       -- 確認後に Webhook で更新
  amount integer not null,                        -- 課金総額（円）
  platform_fee integer not null,                  -- プラットフォーム取得額（円）
  net_amount integer not null,                    -- 指導員受取額（円）
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed', 'reversed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transfer_records_team on transfer_records(team_id);
create index if not exists idx_transfer_records_session on transfer_records(session_id);
create index if not exists idx_transfer_records_pi on transfer_records(stripe_payment_intent_id);

-- RLS: transfer_records は service_role のみ書き込み可
-- 読み取りはチームの admin のみ（set-returning 関数は policy 式で使えないため EXISTS で記述）
alter table transfer_records enable row level security;

create policy "transfer_records_admin_select" on transfer_records for select
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = transfer_records.team_id
        and tm.swimmer_id = auth.uid()
        and tm.role = 'admin'
        and tm.status = 'active'
    )
  );

create policy "transfer_records_service_insert" on transfer_records for insert
  with check (true);  -- service_role のみが RLS をバイパスして INSERT

create policy "transfer_records_service_update" on transfer_records for update
  using (true);

-- platform_settings は認証ユーザーが読み取り可（手数料率表示のため）
alter table platform_settings enable row level security;

create policy "platform_settings_read" on platform_settings for select
  using (true);

comment on table transfer_records is 'Stripe Connect の送金監査証跡';
comment on table platform_settings is 'プラットフォーム設定（手数料率など）';
comment on column teams.stripe_account_id is 'Stripe Connected Account ID (acct_xxx)';
comment on column teams.stripe_onboarding_completed is 'Stripe Connect のオンボーディング完了フラグ（charges_enabled = true）';
