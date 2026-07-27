-- HIGH-7: registerForSession の定員チェックが「現在の登録数をCOUNT →
-- 上限未満ならINSERT」の2段階になっており、間に排他制御がないためTOCTOU
-- 競合状態がある。残り枠1に対して複数人が同時に参加登録すると、両方が
-- COUNTチェックを通過してから両方ともINSERTし、定員を超過して登録される。
--
-- practice_sessions 行を SELECT ... FOR UPDATE でロックしてから定員チェックと
-- 書き込み（新規登録 or キャンセル済みレコードの再利用）を単一トランザクション内
-- で行うRPCに置き換え、定員チェックと書き込みを原子化する。

create or replace function register_for_session(
  p_session_id uuid,
  p_swimmer_id uuid,
  p_is_member boolean,
  p_payment_method text,
  p_payment_status text,
  p_competition_entry jsonb
)
returns table(registration_id uuid, is_new boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_max_participants integer;
  v_current_count integer;
  v_cancelled_id uuid;
  v_new_id uuid;
begin
  -- セッション行をロックし、定員チェックと書き込みの間に他リクエストが
  -- 割り込めないようにする
  select max_participants into v_max_participants
  from practice_sessions
  where id = p_session_id
  for update;

  if v_max_participants is not null then
    select count(*) into v_current_count
    from session_registrations
    where session_id = p_session_id and cancelled_at is null;

    if v_current_count >= v_max_participants then
      raise exception 'capacity_exceeded';
    end if;
  end if;

  select id into v_cancelled_id
  from session_registrations
  where session_id = p_session_id
    and swimmer_id = p_swimmer_id
    and cancelled_at is not null
  limit 1;

  if v_cancelled_id is not null then
    update session_registrations
      set cancelled_at = null,
          payment_method = p_payment_method,
          payment_status = p_payment_status,
          stripe_payment_intent_id = null,
          is_member = p_is_member,
          competition_entry = p_competition_entry
    where id = v_cancelled_id;
    return query select v_cancelled_id, false;
  else
    insert into session_registrations (
      session_id, swimmer_id, is_member, payment_method, payment_status, competition_entry
    ) values (
      p_session_id, p_swimmer_id, p_is_member, p_payment_method, p_payment_status, p_competition_entry
    )
    returning id into v_new_id;
    return query select v_new_id, true;
  end if;
end;
$$;

-- payment_status / is_member を検証なしに直接指定できるRPCのため、
-- authenticated には公開しない（CRIT-3で塞いだ決済ステータス自己申告と
-- 同型の穴になるため）。呼び出しは常に adminClient(service_role) 経由に限定する。
revoke all on function register_for_session(uuid, uuid, boolean, text, text, jsonb) from public;
revoke all on function register_for_session(uuid, uuid, boolean, text, text, jsonb) from anon;
revoke all on function register_for_session(uuid, uuid, boolean, text, text, jsonb) from authenticated;
grant execute on function register_for_session(uuid, uuid, boolean, text, text, jsonb) to service_role;
