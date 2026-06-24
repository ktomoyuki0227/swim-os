-- ============================================================
-- get_my_team_ids / get_my_admin_team_ids を STABLE → VOLATILE に変更
-- ============================================================
-- 問題: PostgreSQL では STABLE 関数内の SET LOCAL は特定の
-- 呼び出しコンテキスト（RLS policy 評価など）で実行を拒否される場合がある。
-- VOLATILE に変更することで毎回確実に関数本体を実行させる。
-- ============================================================

create or replace function get_my_team_ids()
returns setof uuid
language plpgsql
security definer
volatile
set search_path = public
as $$
begin
  set local row_security = off;
  return query
    select team_id from public.team_members where swimmer_id = auth.uid();
end;
$$;

create or replace function get_my_admin_team_ids()
returns setof uuid
language plpgsql
security definer
volatile
set search_path = public
as $$
begin
  set local row_security = off;
  return query
    select team_id from public.team_members
    where swimmer_id = auth.uid() and role = 'admin';
end;
$$;
