-- RLS 無限再帰バグ 完全修正版
-- security definer 関数内で row_security = off を明示セットし
-- team_members への再帰参照を完全に断ち切る

-- ============================================================
-- 1. 再帰を起こさない security definer 関数（v2）
-- ============================================================

-- 自分が所属するチームの team_id 一覧
create or replace function get_my_team_ids()
returns setof uuid
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  set local row_security = off;
  return query
    select team_id from public.team_members where swimmer_id = auth.uid();
end;
$$;

-- 自分が admin のチームの team_id 一覧
create or replace function get_my_admin_team_ids()
returns setof uuid
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  set local row_security = off;
  return query
    select team_id from public.team_members
    where swimmer_id = auth.uid() and role = 'admin';
end;
$$;

-- ============================================================
-- 2. team_members ポリシーを全て関数呼び出しに統一
-- ============================================================

drop policy if exists "team_members_insert" on team_members;
create policy "team_members_insert" on team_members for insert
  with check (
    swimmer_id = auth.uid()
    or team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "team_members_update" on team_members;
create policy "team_members_update" on team_members for update
  using (
    swimmer_id = auth.uid()
    or team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "team_members_delete" on team_members;
create policy "team_members_delete" on team_members for delete
  using (
    team_id in (select get_my_admin_team_ids())
  );

-- ============================================================
-- 3. teams_select_own も関数呼び出しに統一（念のため再作成）
-- ============================================================

drop policy if exists "teams_select_own" on teams;
create policy "teams_select_own" on teams for select
  using (
    coach_id = auth.uid()
    or id in (select get_my_team_ids())
  );
