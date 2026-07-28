-- MEDIUM: addStampPurchase が stamp_purchases への INSERT と
-- increment_stamp_by による team_members.stamp_remaining 加算を2回の独立した
-- Supabase呼び出しで行っており、後者が失敗すると購入記録(金額)だけが残り
-- スタンプ残数と不整合になる。register_for_session と同じ設計で、両方の書き込みを
-- 単一のPostgreSQL関数(1トランザクション)にまとめて原子化する。
--
-- 呼び出し元(actions/stamps.ts の addStampPurchase)は既に isTeamAdmin() で
-- 認可済みの上でadminClient(service_role)経由でのみ呼ぶため、
-- register_for_session と同様にservice_role限定にする。

create or replace function add_stamp_purchase(
  p_team_id uuid,
  p_swimmer_id uuid,
  p_team_member_id uuid,
  p_card_count integer,
  p_stamp_count integer,
  p_amount integer,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_purchase_id uuid;
begin
  insert into stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, note)
  values (p_team_id, p_swimmer_id, p_card_count, p_stamp_count, p_amount, p_note)
  returning id into v_purchase_id;

  update team_members
    set stamp_remaining = stamp_remaining + (p_card_count * p_stamp_count)
  where id = p_team_member_id
    and status = 'active';

  return v_purchase_id;
end;
$$;

revoke all on function add_stamp_purchase(uuid, uuid, uuid, integer, integer, integer, text) from public;
revoke all on function add_stamp_purchase(uuid, uuid, uuid, integer, integer, integer, text) from anon;
revoke all on function add_stamp_purchase(uuid, uuid, uuid, integer, integer, integer, text) from authenticated;
grant execute on function add_stamp_purchase(uuid, uuid, uuid, integer, integer, integer, text) to service_role;
