-- close_expired_session_registrations() のレビュー指摘: SELECTで対象を取得してから
-- ループ内で個別UPDATEする実装は、confirmSession()と違い原子的なクレームになっておらず、
-- 万一この関数が重複起動された場合(手動実行と定期実行の重複、pg_cronの遅延起動等)に
-- 同一セッションへ通知INSERTが二重に走るリスクがあった。
-- UPDATE ... RETURNING をループのソースにすることで、状態遷移そのものを
-- 1ステートメントで原子的に行い(該当行はこの1回のUPDATEでしかopenから外れない)、
-- 同じ問題を根本的に解消する。
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
    update practice_sessions
    set session_status = 'closed'
    where session_status = 'open'
      and registration_deadline is not null
      and registration_deadline <= now()
    returning id, team_id, title
  loop
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
