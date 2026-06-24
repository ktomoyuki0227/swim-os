-- セッション決済/キャンセル時にスタンプを増減する RPC 関数
-- p_session_id から team_id を解決し、team_members.stamp_remaining を更新する
-- SECURITY DEFINER: RLS をバイパスして team_members を直接更新

create or replace function decrement_stamp(
  p_session_id uuid,
  p_swimmer_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_team_id uuid;
begin
  -- セッションから所属チームを取得
  select team_id into v_team_id
  from practice_sessions
  where id = p_session_id;

  if v_team_id is null then
    raise exception 'Session not found: %', p_session_id;
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
$$;

create or replace function increment_stamp(
  p_session_id uuid,
  p_swimmer_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_team_id uuid;
begin
  -- セッションから所属チームを取得
  select team_id into v_team_id
  from practice_sessions
  where id = p_session_id;

  if v_team_id is null then
    raise exception 'Session not found: %', p_session_id;
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
$$;
