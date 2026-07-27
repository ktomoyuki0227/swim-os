-- CRIT-4: increment_stamp_by は SECURITY DEFINER 関数でありながら呼び出し元の
-- 認可チェックが一切なく、REVOKEも行われていない（デフォルトで EXECUTE 権限が PUBLIC に
-- 付与される）ため、認証済みユーザーなら誰でも任意メンバーの回数券残数を無制限に
-- 増やせてしまう問題を修正する。
--
-- addStampPurchase（唯一の呼び出し元、actions/stamps.ts）は adminClient(service_role)
-- 経由で呼び出しており、呼び出し前に isTeamAdmin() で認可済み。service_role からの呼び出しは
-- auth.role() = 'service_role' として区別できるため、それ以外（authenticated 経由の
-- 直接呼び出し）の場合のみ「対象メンバーが所属するチームの管理者か」をチェックする。
-- 合わせて SECURITY DEFINER 関数の search_path hijacking 対策として search_path も固定する。

create or replace function increment_stamp_by(
  p_team_member_id uuid,
  p_count integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() <> 'service_role' then
    if not exists (
      select 1 from team_members tm
      where tm.id = p_team_member_id
        and tm.team_id in (select get_my_admin_team_ids())
    ) then
      raise exception 'not authorized';
    end if;
  end if;

  update team_members
    set stamp_remaining = stamp_remaining + p_count
  where id = p_team_member_id
    and status = 'active';
end;
$$;

revoke all on function increment_stamp_by(uuid, integer) from public;
revoke all on function increment_stamp_by(uuid, integer) from anon;
grant execute on function increment_stamp_by(uuid, integer) to authenticated, service_role;
