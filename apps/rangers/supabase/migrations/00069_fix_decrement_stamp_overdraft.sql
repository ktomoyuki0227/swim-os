-- HIGH-1（2026-08-03 独立レビュー）: decrement_stamp は消費前残高が0以下でも
-- greatest(0, stamp_remaining - 1) でクランプするだけで例外を出さず成功していた。
-- registerForSession は登録時に stamp_remaining > 0 を確認するだけで、実際の
-- 消費(decrement)は各セッションのconfirmSession実行時に個別に発生するため、
-- 残高1枚の会員が回数券制セッションA・Bの両方に(確定前に)登録すると、
-- Aの確定で残高1→0になった後、Bの確定でもdecrement_stampが0のままクランプして
-- 成功してしまい、実際には1枚しか消費していないのに両方ともpayment_status="paid"
-- になれてしまっていた（回数券の二重消費）。
--
-- 修正: 残高チェックをUPDATEのWHERE句に組み込み、チェックと減算を単一の原子的な
-- UPDATEにする。これにより「残高確認 → 減算」の間にウィンドウが生まれず、
-- 同一メンバーに対して複数のconfirmSessionが同時に実行された場合でも、
-- 行ロックにより後続の呼び出しは先に更新済みの残高を見てから判定されるため、
-- レースコンディションなしに二重消費を防げる。残高不足の場合はUPDATEが0件のまま
-- RAISEし、呼び出し元のconfirmSessionは既存のエラーハンドリング（payment_statusを
-- "failed"にして本人に通知）にフォールバックする（アプリ側コードの変更は不要）。

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

  -- スタンプを1枚消費。stamp_remaining >= 1 をWHERE句に含めることで
  -- 残高チェックと減算を単一のアトミックな操作にする（TOCTOUなし）。
  update team_members
    set stamp_remaining = stamp_remaining - 1
  where team_id = v_team_id
    and swimmer_id = p_swimmer_id
    and status = 'active'
    and stamp_remaining >= 1;

  if not found then
    raise exception 'Insufficient stamp balance or active team member not found: team_id=%, swimmer_id=%', v_team_id, p_swimmer_id;
  end if;
end;
$function$;
