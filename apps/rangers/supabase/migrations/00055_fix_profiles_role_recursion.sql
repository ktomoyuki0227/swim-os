-- CRITICAL HOTFIX: 00053で追加したprofiles UPDATEポリシーのWITH CHECKが
-- profilesテーブル自身への生サブクエリだったため、
-- 「infinite recursion detected in policy for relation "profiles"」(42P17)を引き起こし、
-- 全ユーザーのプロフィール保存・アバター変更が機能停止していた。
--
-- 00011/00012で team_members の同種の再帰を修正した際と同じパターン
-- (SECURITY DEFINER関数内で row_security を off にしてから参照する)で修正する。

-- set local row_security を本文で使うため、stable/immutableは指定できない
-- (get_my_team_ids/get_my_admin_team_idsが00038で同じ理由でvolatileに修正されたのと同じ制約)
create or replace function get_my_profile_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  set local row_security = off;
  select role into v_role from public.profiles where id = auth.uid();
  return v_role;
end;
$$;

revoke all on function get_my_profile_role() from public;
grant execute on function get_my_profile_role() to authenticated;

drop policy if exists "自分のプロフィールのみ更新可" on profiles;
create policy "自分のプロフィールのみ更新可"
  on profiles for update
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and role = get_my_profile_role()
  );
