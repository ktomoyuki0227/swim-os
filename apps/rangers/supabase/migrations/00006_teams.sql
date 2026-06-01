-- Rangers マスターズチーム管理 マイグレーション
-- teams / team_members / practice_sessions / session_registrations
-- membership_fees / notifications / session_templates
-- announcements / announcement_reads / system_tags

-- ============================================================
-- profiles に追加カラム
-- ============================================================
alter table profiles add column if not exists line_user_id text;
alter table profiles add column if not exists stripe_customer_id text;

-- ============================================================
-- チーム
-- ============================================================
create table teams (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles(id),
  name text not null,
  description text,
  avatar_url text,
  invite_code uuid not null default gen_random_uuid(),
  default_member_price integer default 0,
  default_guest_price integer default 0,
  annual_fee_amount integer,
  monthly_fee_amount integer,
  cancellation_days integer default 3,
  point_card_count integer default 10,
  point_card_price integer,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create unique index idx_teams_invite_code on teams(invite_code);
create index idx_teams_coach on teams(coach_id);

-- ============================================================
-- チームメンバー
-- ============================================================
create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  swimmer_id uuid not null references profiles(id),
  role text not null default 'member' check (role in ('admin', 'member')),
  membership_type text not null default 'regular' check (membership_type in ('regular', 'point_card')),
  stamp_remaining integer default 0,
  tags jsonb default '[]',
  status text not null default 'active' check (status in ('active', 'inactive')),
  joined_at timestamptz not null default now(),
  unique (team_id, swimmer_id)
);

create index idx_team_members_team on team_members(team_id);
create index idx_team_members_swimmer on team_members(swimmer_id);

-- ============================================================
-- セッション（練習・イベント・ミーティング）
-- ============================================================
create table practice_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  coach_id uuid not null references profiles(id),
  title text not null,
  description text,
  content text,
  type text not null default 'practice' check (type in ('practice', 'event', 'meeting')),
  scheduled_at timestamptz not null,
  location text,
  member_price integer not null default 0,
  guest_price integer not null default 0,
  registration_deadline timestamptz,
  min_participants integer,
  max_participants integer,
  course_rules jsonb,
  target_tags jsonb default '[]',
  target_members uuid[],
  cancellation_days integer,
  allow_point_card boolean default true,
  is_external boolean default false,
  is_lp_featured boolean default false,
  session_status text not null default 'open' check (session_status in ('open', 'confirmed', 'cancelled')),
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now()
);

create index idx_sessions_team on practice_sessions(team_id);
create index idx_sessions_coach on practice_sessions(coach_id);
create index idx_sessions_scheduled on practice_sessions(scheduled_at);
create index idx_sessions_status on practice_sessions(status, session_status);
create index idx_sessions_external on practice_sessions(is_external) where is_external = true;

-- ============================================================
-- 参加登録
-- ============================================================
create table session_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions(id) on delete cascade,
  swimmer_id uuid not null references profiles(id),
  is_member boolean not null default true,
  payment_method text not null default 'stripe' check (payment_method in ('stripe', 'cash', 'point_card')),
  stripe_payment_intent_id text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'free')),
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (session_id, swimmer_id)
);

create index idx_registrations_session on session_registrations(session_id);
create index idx_registrations_swimmer on session_registrations(swimmer_id);

-- ============================================================
-- 会費管理（年会費・月謝）
-- ============================================================
create table membership_fees (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id),
  swimmer_id uuid not null references profiles(id),
  type text not null check (type in ('annual', 'monthly')),
  period text not null,
  amount integer not null,
  payment_method text default 'cash' check (payment_method in ('stripe', 'cash')),
  stripe_payment_intent_id text,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'failed')),
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (team_id, swimmer_id, type, period)
);

create index idx_fees_team on membership_fees(team_id);
create index idx_fees_swimmer on membership_fees(swimmer_id);
create index idx_fees_status on membership_fees(status);

-- ============================================================
-- 個人向け通知（システム自動生成）
-- ============================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id);
create index idx_notifications_unread on notifications(user_id, is_read) where is_read = false;

-- ============================================================
-- セッションテンプレート
-- ============================================================
create table session_templates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  title text not null,
  description text,
  content text,
  type text not null default 'practice',
  location text,
  member_price integer default 0,
  guest_price integer default 0,
  deadline_days integer,
  min_participants integer,
  max_participants integer,
  course_rules jsonb,
  target_tags jsonb default '[]',
  allow_point_card boolean default true,
  cancellation_days integer,
  is_external boolean default false,
  created_at timestamptz not null default now()
);

create index idx_templates_team on session_templates(team_id);

-- ============================================================
-- お知らせ（チーム向けアナウンス）
-- ============================================================
create table announcements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  author_id uuid not null references profiles(id),
  title text not null,
  body text,
  image_url text,
  link_url text,
  target_tags jsonb default '[]',
  created_at timestamptz not null default now()
);

create index idx_announcements_team on announcements(team_id);
create index idx_announcements_created on announcements(created_at desc);

-- ============================================================
-- お知らせ既読管理
-- ============================================================
create table announcement_reads (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  user_id uuid not null references profiles(id),
  read_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);

create index idx_reads_announcement on announcement_reads(announcement_id);
create index idx_reads_user on announcement_reads(user_id);

-- ============================================================
-- タグマスター（システム定義）
-- ============================================================
create table system_tags (
  id text primary key,
  category text not null,
  label text not null,
  sort_order integer not null default 0
);

-- 初期タグデータ
insert into system_tags (id, category, label, sort_order) values
  -- レベル（単一選択）
  ('level_beginner', 'level', '初級', 1),
  ('level_intermediate', 'level', '中級', 2),
  ('level_advanced', 'level', '上級', 3),
  -- 種目（複数選択）
  ('stroke_freestyle', 'stroke', 'クロール', 1),
  ('stroke_backstroke', 'stroke', '背泳ぎ', 2),
  ('stroke_breaststroke', 'stroke', '平泳ぎ', 3),
  ('stroke_butterfly', 'stroke', 'バタフライ', 4),
  ('stroke_medley', 'stroke', '個人メドレー', 5),
  -- 目的（複数選択）
  ('purpose_health', 'purpose', '健康・趣味', 1),
  ('purpose_competitive', 'purpose', '競技', 2);

-- ============================================================
-- RLS（Row Level Security）
-- ============================================================

-- teams
alter table teams enable row level security;

create policy "teams_select_own" on teams for select
  using (
    id in (select team_id from team_members where swimmer_id = auth.uid())
    or coach_id = auth.uid()
  );

create policy "teams_select_external" on teams for select
  using (
    exists (
      select 1 from practice_sessions ps
      where ps.team_id = teams.id and ps.is_external = true and ps.status = 'published'
    )
  );

create policy "teams_insert" on teams for insert
  with check (coach_id = auth.uid());

create policy "teams_update" on teams for update
  using (coach_id = auth.uid());

create policy "teams_delete" on teams for delete
  using (coach_id = auth.uid());

-- team_members
alter table team_members enable row level security;

create policy "team_members_select" on team_members for select
  using (
    team_id in (select team_id from team_members tm where tm.swimmer_id = auth.uid())
  );

create policy "team_members_insert" on team_members for insert
  with check (
    swimmer_id = auth.uid()
    or team_id in (
      select tm.team_id from team_members tm
      where tm.swimmer_id = auth.uid() and tm.role = 'admin'
    )
  );

create policy "team_members_delete" on team_members for delete
  using (
    team_id in (
      select tm.team_id from team_members tm
      where tm.swimmer_id = auth.uid() and tm.role = 'admin'
    )
  );

create policy "team_members_update" on team_members for update
  using (
    swimmer_id = auth.uid()
    or team_id in (
      select tm.team_id from team_members tm
      where tm.swimmer_id = auth.uid() and tm.role = 'admin'
    )
  );

-- practice_sessions
alter table practice_sessions enable row level security;

create policy "sessions_select_member" on practice_sessions for select
  using (
    team_id in (select team_id from team_members where swimmer_id = auth.uid())
  );

create policy "sessions_select_external" on practice_sessions for select
  using (is_external = true and status = 'published');

create policy "sessions_insert" on practice_sessions for insert
  with check (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "sessions_update" on practice_sessions for update
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "sessions_delete" on practice_sessions for delete
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

-- session_registrations
alter table session_registrations enable row level security;

create policy "registrations_select_own" on session_registrations for select
  using (swimmer_id = auth.uid());

create policy "registrations_select_admin" on session_registrations for select
  using (
    session_id in (
      select ps.id from practice_sessions ps
      join team_members tm on tm.team_id = ps.team_id
      where tm.swimmer_id = auth.uid() and tm.role = 'admin'
    )
  );

create policy "registrations_insert" on session_registrations for insert
  with check (swimmer_id = auth.uid());

create policy "registrations_update" on session_registrations for update
  using (
    swimmer_id = auth.uid()
    or session_id in (
      select ps.id from practice_sessions ps
      join team_members tm on tm.team_id = ps.team_id
      where tm.swimmer_id = auth.uid() and tm.role = 'admin'
    )
  );

create policy "registrations_delete" on session_registrations for delete
  using (swimmer_id = auth.uid());

-- membership_fees
alter table membership_fees enable row level security;

create policy "fees_select_own" on membership_fees for select
  using (swimmer_id = auth.uid());

create policy "fees_select_admin" on membership_fees for select
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "fees_insert_admin" on membership_fees for insert
  with check (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "fees_update_admin" on membership_fees for update
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

-- session_templates
alter table session_templates enable row level security;

create policy "templates_select_admin" on session_templates for select
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "templates_insert_admin" on session_templates for insert
  with check (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "templates_update_admin" on session_templates for update
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "templates_delete_admin" on session_templates for delete
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

-- announcements
alter table announcements enable row level security;

create policy "announcements_select_member" on announcements for select
  using (
    team_id in (select team_id from team_members where swimmer_id = auth.uid())
  );

create policy "announcements_insert_admin" on announcements for insert
  with check (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "announcements_update_admin" on announcements for update
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

create policy "announcements_delete_admin" on announcements for delete
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = auth.uid() and role = 'admin'
    )
  );

-- announcement_reads
alter table announcement_reads enable row level security;

create policy "reads_select_own" on announcement_reads for select
  using (user_id = auth.uid());

create policy "reads_select_admin" on announcement_reads for select
  using (
    announcement_id in (
      select a.id from announcements a
      join team_members tm on tm.team_id = a.team_id
      where tm.swimmer_id = auth.uid() and tm.role = 'admin'
    )
  );

create policy "reads_insert" on announcement_reads for insert
  with check (user_id = auth.uid());

-- notifications
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own" on notifications for update
  using (user_id = auth.uid());

-- system_tags
alter table system_tags enable row level security;

create policy "tags_select_all" on system_tags for select
  using (true);
