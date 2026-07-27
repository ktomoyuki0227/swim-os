-- CRIT-3: session_registrations の INSERT/UPDATE ポリシーが payment_status 等を
-- 一切検証しておらず、本人が直接 PostgREST 経由で決済せずに payment_status="paid" を
-- 自己申告できる問題を修正する。DELETEポリシーも支払い済みレコードの自己削除
-- （監査証跡の破壊）を許容していた。
--
-- 事前調査（actions/sessions.ts, app/api/stripe/webhook/route.ts の全アクセスを確認）:
--   session_registrations への INSERT/UPDATE は例外なく adminClient(service role) 経由で
--   行われている（registerForSession, confirmSession, cancelSession, cancelRegistration,
--   retryPayment, updateFeeStatus, webhookハンドラ全て）。通常クライアントでの自己書き込みは
--   アプリのどの機能からも使われていない。DELETEに至ってはアプリ内に呼び出し箇所が
--   一件も存在しない。よって通常クライアントからの書き込みはチーム管理者のみに限定する。

drop policy if exists "registrations_insert" on session_registrations;
create policy "registrations_insert" on session_registrations for insert
  with check (
    session_id in (select id from practice_sessions where team_id in (select get_my_admin_team_ids()))
  );

drop policy if exists "registrations_update" on session_registrations;
create policy "registrations_update" on session_registrations for update
  using (
    session_id in (select id from practice_sessions where team_id in (select get_my_admin_team_ids()))
  )
  with check (
    session_id in (select id from practice_sessions where team_id in (select get_my_admin_team_ids()))
  );

drop policy if exists "registrations_delete" on session_registrations;
create policy "registrations_delete" on session_registrations for delete
  using (
    session_id in (select id from practice_sessions where team_id in (select get_my_admin_team_ids()))
  );
