-- 申込み締切とキャンセル期限を統合する。
-- 従来: registration_deadline(申込み締切) と cancellation_days(開催確定後の返金可否を
-- 開催日からの日数で判定) という基準点の異なる2つの設定が併存していた。
-- 開催確定前は誰も課金されない(Stripe請求/回数券消費はconfirmSession実行時のみ発生)ため、
-- 「締切を境に申込み・自己都合キャンセルの両方を同時に止める」設計に統合し、
-- cancellation_daysという概念自体を廃止する。

-- session_status に 'closed'(締切通過・開催確定/中止の判断待ち) を追加
alter table practice_sessions drop constraint practice_sessions_session_status_check;
alter table practice_sessions add constraint practice_sessions_session_status_check
  check (session_status in ('open', 'closed', 'confirmed', 'cancelled'));

-- cancellation_days を廃止(申込み締切に統合したため不要)
alter table practice_sessions drop column cancellation_days;
alter table session_templates drop column cancellation_days;
alter table teams drop column cancellation_days;

-- 締切到達バッチ: open→closed遷移 + 参加者/管理者への通知。
-- send_session_reminders()/send_monthly_fee_reminders()と同じ命名・権限パターンに揃える
-- (SECURITY DEFINER, search_path固定、PUBLIC/anon/authenticatedからはREVOKEしpostgres/service_roleのみ実行可)。
-- ステータス遷移そのものが「通知済みか」を兼ねるため、別途通知済みフラグは持たない。
create or replace function close_expired_session_registrations()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_session record;
begin
  for v_session in
    select id, team_id, title
    from practice_sessions
    where session_status = 'open'
      and registration_deadline is not null
      and registration_deadline <= now()
  loop
    update practice_sessions set session_status = 'closed' where id = v_session.id;

    insert into notifications (user_id, type, title, body, team_id, link)
    select sr.swimmer_id, 'session_registration_closed',
      '申込みを締め切りました',
      '「' || v_session.title || '」の申込みを締め切りました。開催者が確定/中止を決定次第お知らせします',
      v_session.team_id, '/teams/' || v_session.team_id || '/sessions/' || v_session.id
    from session_registrations sr
    where sr.session_id = v_session.id and sr.cancelled_at is null;

    insert into notifications (user_id, type, title, body, team_id, link)
    select tm.swimmer_id, 'session_registration_closed_admin',
      '申込みを締め切りました。確定/中止を決めてください',
      '「' || v_session.title || '」の申込みが締め切られました。開催確定または中止を選択してください',
      v_session.team_id, '/sessions/' || v_session.id
    from team_members tm
    where tm.team_id = v_session.team_id and tm.role = 'admin' and tm.status = 'active';
  end loop;
end;
$function$;

revoke all on function close_expired_session_registrations() from public;
revoke all on function close_expired_session_registrations() from anon;
revoke all on function close_expired_session_registrations() from authenticated;
grant execute on function close_expired_session_registrations() to postgres, service_role;
