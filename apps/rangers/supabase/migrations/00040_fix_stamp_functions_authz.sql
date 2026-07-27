-- HIGH-4 + CRIT-7: decrement_stamp / increment_stamp は actions/sessions.ts
-- (confirmSession, cancelSession, cancelRegistration, retryPayment) から
-- adminClient経由で呼び出されているが、マイグレーション履歴に一度も定義されて
-- いなかった（Supabase Studio等からの直接作成と推測される）。
--
-- 本番DB調査の結果、両関数ともEXECUTE権限がPUBLIC/anon/authenticatedに付与されており、
-- 関数内にも呼び出し元チェックが一切ないことが判明した（increment_stamp_byと同型の
-- 脆弱性、CRIT-4参照）。誰でも任意セッション×任意メンバーの回数券残数を増減できる
-- 状態だったため、認可チェックを追加した上で正式にマイグレーションとして記録する。

create or replace function decrement_stamp(p_session_id uuid, p_swimmer_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id
  from practice_sessions
  where id = p_session_id;

  if v_team_id is null then
    raise exception 'Session not found: %', p_session_id;
  end if;

  if auth.role() <> 'service_role' and v_team_id not in (select get_my_admin_team_ids()) then
    raise exception 'not authorized';
  end if;

  -- スタンプを1枚消費（greatest で 0 未満にならないよう保護）
  update team_members
    set stamp_remaining = greatest(0, stamp_remaining - 1)
  where team_id = v_team_id
    and swimmer_id = p_swimmer_id
    and status = 'active';

  if not found then
    raise exception 'Active team member not found: team_id=%, swimmer_id=%', v_team_id, p_swimmer_id;
  end if;
end;
$function$;

create or replace function increment_stamp(p_session_id uuid, p_swimmer_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id
  from practice_sessions
  where id = p_session_id;

  if v_team_id is null then
    raise exception 'Session not found: %', p_session_id;
  end if;

  if auth.role() <> 'service_role' and v_team_id not in (select get_my_admin_team_ids()) then
    raise exception 'not authorized';
  end if;

  -- スタンプを1枚返却
  update team_members
    set stamp_remaining = stamp_remaining + 1
  where team_id = v_team_id
    and swimmer_id = p_swimmer_id
    and status = 'active';

  if not found then
    raise exception 'Active team member not found: team_id=%, swimmer_id=%', v_team_id, p_swimmer_id;
  end if;
end;
$function$;

revoke all on function decrement_stamp(uuid, uuid) from public;
revoke all on function decrement_stamp(uuid, uuid) from anon;
grant execute on function decrement_stamp(uuid, uuid) to authenticated, service_role;

revoke all on function increment_stamp(uuid, uuid) from public;
revoke all on function increment_stamp(uuid, uuid) from anon;
grant execute on function increment_stamp(uuid, uuid) to authenticated, service_role;
