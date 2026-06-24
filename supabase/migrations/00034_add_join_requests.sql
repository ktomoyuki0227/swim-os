-- join_requests: グループへの参加申請テーブル
-- 公開ページからの参加は管理者の承認が必要なため、承認前の申請を管理する

create table join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  swimmer_id uuid not null references profiles(id) on delete cascade,
  membership_type text not null check (membership_type in ('annual', 'monthly', 'point_card')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 同一チームへのpending申請は1件のみ許可（部分ユニークインデックス）
create unique index join_requests_pending_unique
  on join_requests(team_id, swimmer_id)
  where status = 'pending';

-- updated_at 自動更新トリガー
create or replace function update_join_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger join_requests_updated_at
  before update on join_requests
  for each row execute function update_join_requests_updated_at();

-- RLS
alter table join_requests enable row level security;

-- 申請者: 自分の申請を参照できる
create policy "申請者は自分の申請を参照できる"
  on join_requests for select
  using (swimmer_id = auth.uid());

-- 管理者: 自分のチームへの申請を参照できる
create policy "管理者は自チームへの申請を参照できる"
  on join_requests for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = join_requests.team_id
        and team_members.swimmer_id = auth.uid()
        and team_members.role = 'admin'
        and team_members.status = 'active'
    )
  );

-- 申請者: 自分の申請を作成できる
create policy "ログインユーザーは申請を作成できる"
  on join_requests for insert
  with check (swimmer_id = auth.uid());

-- 管理者: 自分のチームへの申請を更新（承認/拒否）できる
create policy "管理者は自チームへの申請を更新できる"
  on join_requests for update
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = join_requests.team_id
        and team_members.swimmer_id = auth.uid()
        and team_members.role = 'admin'
        and team_members.status = 'active'
    )
  );
