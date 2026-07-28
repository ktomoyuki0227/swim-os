-- CRITICAL: session_registrations に参加費の金額スナップショットが無く、
-- 開催確定前に管理者が member_price/guest_price を変更すると、登録時に
-- 提示した金額と異なる金額で参加者に課金されてしまう。
-- charged_amount カラムを追加し、register_for_session 内で登録時点の
-- 金額を確定・保存する。confirmSession/retryPayment/markCashPaint は
-- この保存値を参照するようアプリ側もあわせて変更する。
--
-- あわせて HIGH-1: registerForSession が session_status を確認しておらず、
-- 開催確定(confirmed)後も新規登録が成立してしまい、課金する手段が無いまま
-- 無料参加が残り続ける問題も同じ関数内で修正する。

alter table session_registrations
  add column if not exists charged_amount integer;

comment on column session_registrations.charged_amount is
  '登録時点でスナップショットした参加費（is_memberに応じてmember_price/guest_priceのどちらかを保存）。confirmSession/retryPayment/markCashPaidはこの値を課金・表示に使用し、登録後の料金変更の影響を受けない。';

-- 既存の登録済みレコードは金額スナップショットが取れないため、現在のセッション価格を
-- 暫定値として補完する（従来の「都度re-read」の挙動と同じ値になるため、後退にはならない）。
update session_registrations sr
set charged_amount = case when sr.is_member then ps.member_price else ps.guest_price end
from practice_sessions ps
where ps.id = sr.session_id
  and sr.charged_amount is null;

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
  v_session_status text;
  v_max_participants integer;
  v_member_price integer;
  v_guest_price integer;
  v_charged_amount integer;
  v_current_count integer;
  v_cancelled_id uuid;
  v_new_id uuid;
begin
  -- セッション行をロックし、定員チェックと書き込みの間に他リクエストが
  -- 割り込めないようにする
  select session_status, max_participants, member_price, guest_price
    into v_session_status, v_max_participants, v_member_price, v_guest_price
  from practice_sessions
  where id = p_session_id
  for update;

  if v_session_status is distinct from 'open' then
    raise exception 'session_not_open';
  end if;

  if v_max_participants is not null then
    select count(*) into v_current_count
    from session_registrations
    where session_id = p_session_id and cancelled_at is null;

    if v_current_count >= v_max_participants then
      raise exception 'capacity_exceeded';
    end if;
  end if;

  v_charged_amount := case when p_is_member then v_member_price else v_guest_price end;

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
          competition_entry = p_competition_entry,
          charged_amount = v_charged_amount
    where id = v_cancelled_id;
    return query select v_cancelled_id, false;
  else
    insert into session_registrations (
      session_id, swimmer_id, is_member, payment_method, payment_status, competition_entry, charged_amount
    ) values (
      p_session_id, p_swimmer_id, p_is_member, p_payment_method, p_payment_status, p_competition_entry, v_charged_amount
    )
    returning id into v_new_id;
    return query select v_new_id, true;
  end if;
end;
$$;

revoke all on function register_for_session(uuid, uuid, boolean, text, text, jsonb) from public;
revoke all on function register_for_session(uuid, uuid, boolean, text, text, jsonb) from anon;
revoke all on function register_for_session(uuid, uuid, boolean, text, text, jsonb) from authenticated;
grant execute on function register_for_session(uuid, uuid, boolean, text, text, jsonb) to service_role;
