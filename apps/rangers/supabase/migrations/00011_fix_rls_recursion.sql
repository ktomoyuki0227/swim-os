-- RLS 無限再帰バグ修正
-- team_members_select ポリシーが team_members を自己参照していたため
-- teams INSERT の .select() 時に infinite recursion が発生していた

-- ============================================================
-- security definer 関数でループを断ち切る
-- ============================================================
create or replace function get_my_team_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from public.team_members where swimmer_id = auth.uid()
$$;

-- ============================================================
-- team_members_select: 自己参照ポリシーを関数呼び出しに置き換え
-- ============================================================
drop policy if exists "team_members_select" on team_members;

create policy "team_members_select" on team_members for select
  using (
    team_id in (select get_my_team_ids())
  );

-- ============================================================
-- teams_select_own: 同じく team_members 直接参照を関数に置き換え
-- ============================================================
drop policy if exists "teams_select_own" on teams;

create policy "teams_select_own" on teams for select
  using (
    coach_id = auth.uid()
    or id in (select get_my_team_ids())
  );
