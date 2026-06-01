-- Rangers: 試合対応 + 料金閲覧追跡
-- practice_sessions に competition_fields, session_registrations に competition_entry 追加
-- type CHECK を 5 種別に拡張
-- price_views テーブル追加

-- ============================================================
-- practice_sessions: type CHECK を更新（camp, competition 追加）
-- ============================================================
alter table practice_sessions drop constraint if exists practice_sessions_type_check;
alter table practice_sessions add constraint practice_sessions_type_check
  check (type in ('practice', 'camp', 'competition', 'event', 'meeting'));

-- competition_fields カラム追加（試合エントリー入力フィールド定義）
alter table practice_sessions add column if not exists competition_fields jsonb;

-- ============================================================
-- session_registrations: competition_entry 追加
-- ============================================================
alter table session_registrations add column if not exists competition_entry jsonb;

-- ============================================================
-- 料金閲覧追跡（非チームメンバーの料金確認ログ）
-- ============================================================
create table if not exists price_views (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions(id) on delete cascade,
  viewer_id uuid not null references profiles(id),
  viewed_at timestamptz not null default now()
);

create index if not exists idx_price_views_session on price_views(session_id);
create index if not exists idx_price_views_viewer on price_views(viewer_id);

-- RLS
alter table price_views enable row level security;

-- 本人が INSERT 可能
create policy "price_views_insert_own" on price_views for insert
  with check (viewer_id = auth.uid());

-- アドミンは自チームセッションの閲覧者を SELECT 可能
create policy "price_views_select_admin" on price_views for select
  using (
    session_id in (
      select ps.id from practice_sessions ps
      join team_members tm on tm.team_id = ps.team_id
      where tm.swimmer_id = auth.uid() and tm.role = 'admin'
    )
  );

-- 本人の閲覧記録を SELECT 可能
create policy "price_views_select_own" on price_views for select
  using (viewer_id = auth.uid());
