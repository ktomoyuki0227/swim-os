-- SchoolBoost AI - Initial Schema
-- マルチテナント対応スイミングスクール管理システム

-- =========================================
-- Extensions
-- =========================================
create extension if not exists "uuid-ossp";

-- =========================================
-- Schools（マルチテナント）
-- =========================================
create table public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  email text,
  logo_url text,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Profiles（ユーザー）
-- =========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  role text not null check (role in ('admin', 'coach', 'parent')),
  name text not null,
  name_kana text,
  email text,
  phone text,
  line_user_id text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Members（会員・子ども）
-- =========================================
create table public.members (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid references public.profiles(id) on delete set null,
  name text not null,
  name_kana text,
  birth_date date,
  gender text check (gender in ('male', 'female', 'other')),
  emergency_contact text,
  health_notes text,
  current_level integer default 0,
  status text not null default 'active' check (status in ('active', 'suspended', 'withdrawn')),
  qr_code text unique default uuid_generate_v4()::text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Classes（クラス定義）
-- =========================================
create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  description text,
  level_min integer default 0,
  level_max integer default 99,
  coach_id uuid references public.profiles(id) on delete set null,
  capacity integer not null default 20,
  color text default '#3B82F6',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Schedules（定期スケジュール）
-- =========================================
create table public.schedules (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=日〜6=土
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================
-- Enrollments（在籍）
-- =========================================
create table public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references public.members(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'suspended')),
  unique(member_id, class_id)
);

-- =========================================
-- Attendance Records（出席記録）
-- =========================================
create table public.attendance_records (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references public.members(id) on delete cascade,
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  lesson_date date not null,
  status text not null check (status in ('present', 'absent', 'makeup')),
  makeup_from_record_id uuid references public.attendance_records(id),
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(member_id, schedule_id, lesson_date)
);

-- =========================================
-- Monthly Fees（月謝）
-- =========================================
create table public.monthly_fees (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references public.members(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  amount integer not null,
  target_month date not null, -- その月の1日
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'overdue')),
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(member_id, target_month)
);

-- =========================================
-- Grade Levels（育成級定義）
-- =========================================
create table public.grade_levels (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  level integer not null,
  name text not null,
  description text,
  badge_color text default '#3B82F6',
  criteria jsonb default '[]',
  created_at timestamptz not null default now(),
  unique(school_id, level)
);

-- =========================================
-- Grade Histories（昇級記録）
-- =========================================
create table public.grade_histories (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references public.members(id) on delete cascade,
  from_level integer not null,
  to_level integer not null,
  evaluated_by uuid references public.profiles(id),
  comment text,
  evaluated_at timestamptz not null default now()
);

-- =========================================
-- Announcements（お知らせ）
-- =========================================
create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body text not null,
  target_type text not null default 'all' check (target_type in ('all', 'class', 'parent')),
  target_class_id uuid references public.classes(id),
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- Applications（入会申し込み）
-- =========================================
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references public.schools(id) on delete cascade,
  child_name text not null,
  child_birth_date date,
  parent_name text not null,
  parent_email text not null,
  parent_phone text,
  preferred_class text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'enrolled', 'declined')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- RLS（Row Level Security）
-- =========================================

-- Schools
alter table public.schools enable row level security;
create policy "school_member_select" on public.schools
  for select using (
    id in (select school_id from public.profiles where id = auth.uid())
  );
create policy "school_admin_all" on public.schools
  for all using (
    id in (select school_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Profiles
alter table public.profiles enable row level security;
create policy "profiles_own_select" on public.profiles
  for select using (
    id = auth.uid()
    or school_id in (select school_id from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );
create policy "profiles_own_update" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());

-- Members
alter table public.members enable row level security;
create policy "members_school_access" on public.members
  for select using (
    school_id in (select school_id from public.profiles where id = auth.uid())
    and (
      -- adminとcoachは同スクール全会員
      (select role from public.profiles where id = auth.uid()) in ('admin', 'coach')
      -- parentは自分の子どものみ
      or parent_id = auth.uid()
    )
  );
create policy "members_admin_coach_write" on public.members
  for all using (
    school_id in (select school_id from public.profiles where id = auth.uid() and role in ('admin', 'coach'))
  );

-- Classes
alter table public.classes enable row level security;
create policy "classes_school_select" on public.classes
  for select using (
    school_id in (select school_id from public.profiles where id = auth.uid())
  );
create policy "classes_admin_write" on public.classes
  for all using (
    school_id in (select school_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Schedules
alter table public.schedules enable row level security;
create policy "schedules_school_select" on public.schedules
  for select using (
    class_id in (
      select c.id from public.classes c
      join public.profiles p on p.school_id = c.school_id
      where p.id = auth.uid()
    )
  );
create policy "schedules_admin_write" on public.schedules
  for all using (
    class_id in (
      select c.id from public.classes c
      join public.profiles p on p.school_id = c.school_id
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Enrollments
alter table public.enrollments enable row level security;
create policy "enrollments_school_select" on public.enrollments
  for select using (
    member_id in (select id from public.members where school_id in (
      select school_id from public.profiles where id = auth.uid()
    ))
  );
create policy "enrollments_admin_coach_write" on public.enrollments
  for all using (
    member_id in (select id from public.members where school_id in (
      select school_id from public.profiles where id = auth.uid() and role in ('admin', 'coach')
    ))
  );

-- Attendance Records
alter table public.attendance_records enable row level security;
create policy "attendance_school_select" on public.attendance_records
  for select using (
    member_id in (select id from public.members where school_id in (
      select school_id from public.profiles where id = auth.uid()
    ))
    and (
      (select role from public.profiles where id = auth.uid()) in ('admin', 'coach')
      or member_id in (select id from public.members where parent_id = auth.uid())
    )
  );
create policy "attendance_admin_coach_write" on public.attendance_records
  for all using (
    member_id in (select id from public.members where school_id in (
      select school_id from public.profiles where id = auth.uid() and role in ('admin', 'coach')
    ))
  );

-- Monthly Fees
alter table public.monthly_fees enable row level security;
create policy "fees_school_select" on public.monthly_fees
  for select using (
    school_id in (select school_id from public.profiles where id = auth.uid())
    and (
      (select role from public.profiles where id = auth.uid()) in ('admin', 'coach')
      or member_id in (select id from public.members where parent_id = auth.uid())
    )
  );
create policy "fees_admin_write" on public.monthly_fees
  for all using (
    school_id in (select school_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Grade Levels
alter table public.grade_levels enable row level security;
create policy "grade_levels_school_select" on public.grade_levels
  for select using (
    school_id in (select school_id from public.profiles where id = auth.uid())
  );
create policy "grade_levels_admin_write" on public.grade_levels
  for all using (
    school_id in (select school_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Grade Histories
alter table public.grade_histories enable row level security;
create policy "grade_histories_school_select" on public.grade_histories
  for select using (
    member_id in (select id from public.members where school_id in (
      select school_id from public.profiles where id = auth.uid()
    ))
    and (
      (select role from public.profiles where id = auth.uid()) in ('admin', 'coach')
      or member_id in (select id from public.members where parent_id = auth.uid())
    )
  );
create policy "grade_histories_admin_coach_write" on public.grade_histories
  for all using (
    member_id in (select id from public.members where school_id in (
      select school_id from public.profiles where id = auth.uid() and role in ('admin', 'coach')
    ))
  );

-- Announcements
alter table public.announcements enable row level security;
create policy "announcements_school_select" on public.announcements
  for select using (
    school_id in (select school_id from public.profiles where id = auth.uid())
    and is_published = true
    or (select role from public.profiles where id = auth.uid()) in ('admin', 'coach')
  );
create policy "announcements_admin_write" on public.announcements
  for all using (
    school_id in (select school_id from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Applications: adminのみ
alter table public.applications enable row level security;
create policy "applications_admin_all" on public.applications
  for all using (
    school_id in (select school_id from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "applications_public_insert" on public.applications
  for insert with check (true); -- 外部フォームから誰でも申し込み可

-- =========================================
-- Functions & Triggers
-- =========================================

-- updated_at 自動更新
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger schools_updated_at before update on public.schools
  for each row execute function public.update_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger members_updated_at before update on public.members
  for each row execute function public.update_updated_at();
create trigger classes_updated_at before update on public.classes
  for each row execute function public.update_updated_at();
create trigger monthly_fees_updated_at before update on public.monthly_fees
  for each row execute function public.update_updated_at();
create trigger announcements_updated_at before update on public.announcements
  for each row execute function public.update_updated_at();
create trigger applications_updated_at before update on public.applications
  for each row execute function public.update_updated_at();

-- auth.users 作成時に profiles を自動生成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'parent'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================
-- Demo Data（PoC用テストデータ）
-- =========================================

-- デモスクール
insert into public.schools (id, name, address, phone, invite_code)
values (
  '00000000-0000-0000-0000-000000000001',
  'スイミングスクール HYDOOR',
  '京都府京都市左京区',
  '075-000-0000',
  'HYDOOR01'
);

-- 育成級定義（スイミング標準）
insert into public.grade_levels (school_id, level, name, description, badge_color)
values
  ('00000000-0000-0000-0000-000000000001', 1, '水慣れ', '水に顔をつけられる', '#94A3B8'),
  ('00000000-0000-0000-0000-000000000001', 2, 'バタ足', '壁をけってバタ足25m', '#60A5FA'),
  ('00000000-0000-0000-0000-000000000001', 3, 'クロール25m', 'クロールで25m泳げる', '#34D399'),
  ('00000000-0000-0000-0000-000000000001', 4, '背泳ぎ25m', '背泳ぎで25m泳げる', '#FBBF24'),
  ('00000000-0000-0000-0000-000000000001', 5, '平泳ぎ25m', '平泳ぎで25m泳げる', '#F97316'),
  ('00000000-0000-0000-0000-000000000001', 6, 'バタフライ25m', 'バタフライで25m泳げる', '#EC4899'),
  ('00000000-0000-0000-0000-000000000001', 7, '4泳法50m', '4泳法それぞれ50m泳げる', '#8B5CF6'),
  ('00000000-0000-0000-0000-000000000001', 8, '4泳法100m', '4泳法それぞれ100m泳げる', '#EF4444');
