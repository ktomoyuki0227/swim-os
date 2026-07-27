-- HIGH-3 + CRIT-6: join_requests / transfer_records / platform_settings は
-- コード（actions/join-requests.ts, actions/sessions.ts, lib/stripe-connect.ts）から
-- 参照されているが、マイグレーション履歴に一度も CREATE TABLE が存在しなかった
-- （Supabase Studio等からの直接作成と推測される）。本番DBの実スキーマに合わせて
-- 正式なマイグレーションとして補完する。
--
-- 併せて本番DB調査で発覚した CRIT-6 を修正する: transfer_records の
-- "transfer_records_service_insert" / "transfer_records_service_update" という
-- 名前のポリシーが、実際には roles={public} かつ qual/with_check が無条件 true で
-- 定義されており、名前に反して anon/authenticated からも任意の送金記録を
-- INSERT/UPDATEできてしまっていた（偽の送金記録・手数料の捏造が可能）。
-- 本マイグレーションでは service_role 専用の正しいポリシーとして定義する。

-- ============================================================
-- join_requests（チーム参加申請）
-- ============================================================
create table if not exists join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  swimmer_id uuid not null references profiles(id) on delete cascade,
  membership_type text not null check (membership_type in ('annual', 'monthly', 'point_card')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists join_requests_pending_unique
  on join_requests(team_id, swimmer_id) where (status = 'pending');

alter table join_requests enable row level security;

drop policy if exists "ログインユーザーは申請を作成できる" on join_requests;
create policy "ログインユーザーは申請を作成できる" on join_requests for insert
  with check (swimmer_id = auth.uid());

drop policy if exists "申請者は自分の申請を参照できる" on join_requests;
create policy "申請者は自分の申請を参照できる" on join_requests for select
  using (swimmer_id = auth.uid());

drop policy if exists "管理者は自チームへの申請を参照できる" on join_requests;
create policy "管理者は自チームへの申請を参照できる" on join_requests for select
  using (team_id in (select get_my_admin_team_ids()));

drop policy if exists "管理者は自チームへの申請を更新できる" on join_requests;
create policy "管理者は自チームへの申請を更新できる" on join_requests for update
  using (team_id in (select get_my_admin_team_ids()))
  with check (team_id in (select get_my_admin_team_ids()));

-- ============================================================
-- platform_settings（プラットフォーム手数料率等の設定値）
-- ============================================================
create table if not exists platform_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

alter table platform_settings enable row level security;

drop policy if exists "platform_settings_read" on platform_settings;
create policy "platform_settings_read" on platform_settings for select
  using (true);
-- INSERT/UPDATE/DELETE のポリシーは意図的に定義しない
-- （service_role のみが変更可能。authenticated/anon からの書き込みは常に拒否される）

-- ============================================================
-- transfer_records（Stripe Connect 送金記録）
-- ============================================================
create table if not exists transfer_records (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id),
  session_id uuid references practice_sessions(id),
  registration_id uuid references session_registrations(id),
  stripe_payment_intent_id text not null,
  stripe_transfer_id text,
  amount integer not null,
  platform_fee integer not null,
  net_amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'reversed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transfer_records_team on transfer_records(team_id);
create index if not exists idx_transfer_records_session on transfer_records(session_id);
create index if not exists idx_transfer_records_pi on transfer_records(stripe_payment_intent_id);

alter table transfer_records enable row level security;

drop policy if exists "transfer_records_service_insert" on transfer_records;
drop policy if exists "transfer_records_service_update" on transfer_records;
drop policy if exists "transfer_records_admin_select" on transfer_records;

create policy "transfer_records_admin_select" on transfer_records for select
  using (team_id in (select get_my_admin_team_ids()));

create policy "transfer_records_service_insert" on transfer_records for insert
  to service_role
  with check (true);

create policy "transfer_records_service_update" on transfer_records for update
  to service_role
  using (true)
  with check (true);
