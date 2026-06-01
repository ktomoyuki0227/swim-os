-- ポイントカード購入用: アトミックなスタンプ加算 RPC
-- purchasePointCard から使用。read-modify-write レースコンディションを防ぐ

create or replace function increment_stamp_by(
  p_team_member_id uuid,
  p_count integer
)
returns void
language plpgsql
security definer
as $$
begin
  update team_members
    set stamp_remaining = stamp_remaining + p_count
  where id = p_team_member_id
    and status = 'active';
end;
$$;

-- ============================================================
-- teams_update RLS に with check を追加して coach_id 書き換えを防ぐ
-- ============================================================
drop policy if exists "teams_update" on teams;

create policy "teams_update" on teams for update
  using (
    coach_id = auth.uid()
    or exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.swimmer_id = auth.uid()
        and team_members.role = 'admin'
        and team_members.status = 'active'
    )
  )
  with check (
    -- coach_id の書き換えを禁止: 更新後も元の coach_id を維持しなければならない
    coach_id = (select coach_id from teams where id = teams.id)
  );
