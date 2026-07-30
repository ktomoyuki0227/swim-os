-- 7回目の全体レビュー(LOW): add_stamp_purchase(00054)は stamp_purchases への INSERT 後に
-- team_members.stamp_remaining を UPDATE しているが、対象行が
-- status='active' で見つからない場合(呼び出し元のSELECTチェック後に
-- メンバーが退会する等の稀なタイミング)でもUPDATEが単に0件ヒットするだけで、
-- INSERT側の購入記録は成立してしまう。結果、購入記録は残るがスタンプ残数には
-- 反映されないという不整合が起こりうる。increment_stamp/decrement_stamp(00040)と
-- 同様に、対象行が見つからない場合は例外を発生させてトランザクション全体を
-- ロールバックする(purchase記録も作られない)ようにする。

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
  update team_members
    set stamp_remaining = stamp_remaining + (p_card_count * p_stamp_count)
  where id = p_team_member_id
    and status = 'active';

  if not found then
    raise exception 'Active team member not found: team_member_id=%', p_team_member_id;
  end if;

  insert into stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, note)
  values (p_team_id, p_swimmer_id, p_card_count, p_stamp_count, p_amount, p_note)
  returning id into v_purchase_id;

  return v_purchase_id;
end;
$$;
