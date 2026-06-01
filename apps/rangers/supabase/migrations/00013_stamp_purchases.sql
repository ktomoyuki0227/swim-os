-- 回数券購入履歴テーブル
create table stamp_purchases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  swimmer_id uuid not null references profiles(id),
  card_count integer not null default 1,
  stamp_count integer not null,
  amount integer not null,
  note text,
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_stamp_purchases_team on stamp_purchases(team_id);
create index idx_stamp_purchases_swimmer on stamp_purchases(swimmer_id);

alter table stamp_purchases enable row level security;

create policy "stamp_purchases_select_admin" on stamp_purchases for select
  using (
    team_id in (select get_my_admin_team_ids())
  );

create policy "stamp_purchases_insert_admin" on stamp_purchases for insert
  with check (
    team_id in (select get_my_admin_team_ids())
  );

create policy "stamp_purchases_delete_admin" on stamp_purchases for delete
  using (
    team_id in (select get_my_admin_team_ids())
  );
