-- 本番Supabaseのセキュリティアドバイザーで発覚: send_monthly_fee_reminders /
-- send_session_reminders はマイグレーション履歴に存在しないまま本番で稼働していた
-- (pg_cronで postgres ロールとして毎月/毎日スケジュール実行される正規の機能と確認済み)。
--
-- 両関数とも SECURITY DEFINER でありながら search_path 未固定、かつ EXECUTE 権限が
-- PUBLIC(=anon/authenticated含む)に付与されており、認証不要で誰でも
-- /rest/v1/rpc/send_monthly_fee_reminders 等を直接呼び出し、全チーム分の
-- リマインダー通知バッチ処理を任意のタイミングで実行できる状態だった。
-- pg_cronの実行は postgres ロール(スーパーユーザー、GRANT/REVOKEの影響を受けない)
-- のため、PUBLIC/anon/authenticatedへの権限は不要と判断しREVOKEする。
--
-- update_join_requests_updated_at (updated_at自動更新トリガー) も同様に
-- search_path が未固定だったため併せて固定する。

create or replace function send_monthly_fee_reminders()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
DECLARE
  current_period TEXT;
  v_team RECORD;
  v_member RECORD;
  already_notified BOOLEAN;
BEGIN
  -- 今月の期間文字列（例: "2026-07"）
  current_period := TO_CHAR(NOW() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM');

  -- 月謝制チームを対象に処理
  FOR v_team IN
    SELECT id, name
    FROM teams
    WHERE has_monthly_fee = TRUE AND status = 'active'
  LOOP
    -- そのチームの月謝会員（admin除く）を取得
    FOR v_member IN
      SELECT tm.swimmer_id
      FROM team_members tm
      WHERE tm.team_id = v_team.id
        AND tm.status = 'active'
        AND tm.role = 'member'
        AND tm.membership_type = 'monthly'
    LOOP
      -- 今月の月謝が支払済みの場合はスキップ
      CONTINUE WHEN EXISTS (
        SELECT 1 FROM membership_fees
        WHERE team_id = v_team.id
          AND swimmer_id = v_member.swimmer_id
          AND type = 'monthly'
          AND period = current_period
          AND status = 'paid'
      );

      -- 今月すでに同じ fee_reminder を送信済みならスキップ（重複防止）
      SELECT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = v_member.swimmer_id
          AND type = 'fee_reminder'
          AND team_id = v_team.id
          AND created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'Asia/Tokyo')
      ) INTO already_notified;

      CONTINUE WHEN already_notified;

      -- 未払いまたは未作成の場合に通知
      INSERT INTO notifications (user_id, type, title, body, team_id, link)
      VALUES (
        v_member.swimmer_id,
        'fee_reminder',
        '月謝のお支払いをお忘れなく',
        '「' || v_team.name || '」の今月の月謝が未払いです',
        v_team.id,
        '/payments'
      );
    END LOOP;
  END LOOP;
END;
$function$;

create or replace function send_session_reminders()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
DECLARE
  v_reg RECORD;
  v_session RECORD;
  already_notified BOOLEAN;
  correct_link TEXT;
BEGIN
  -- 翌日（JST）に開催されるセッションに参加登録している人へ通知
  -- team_id も一緒に取得してメンバービューのリンクを構築する
  FOR v_reg IN
    SELECT DISTINCT sr.swimmer_id, sr.session_id, ps.team_id
    FROM session_registrations sr
    JOIN practice_sessions ps ON ps.id = sr.session_id
    WHERE sr.cancelled_at IS NULL
      AND ps.session_status IN ('open', 'confirmed')
      AND (ps.scheduled_at AT TIME ZONE 'Asia/Tokyo')::date
          = (NOW() AT TIME ZONE 'Asia/Tokyo' + INTERVAL '1 day')::date
  LOOP
    correct_link := '/teams/' || v_reg.team_id || '/sessions/' || v_reg.session_id;

    -- 本日すでに同じセッションのリマインダーを送信済みならスキップ
    -- 旧形式（/sessions/{id}）と新形式（/teams/{id}/sessions/{id}）の両方を考慮
    SELECT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_reg.swimmer_id
        AND type = 'session_reminder'
        AND link LIKE '%/sessions/' || v_reg.session_id
        AND created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Tokyo')
    ) INTO already_notified;

    CONTINUE WHEN already_notified;

    SELECT * INTO v_session
    FROM practice_sessions
    WHERE id = v_reg.session_id;

    INSERT INTO notifications (user_id, type, title, body, team_id, link)
    VALUES (
      v_reg.swimmer_id,
      'session_reminder',
      '明日のセッションのリマインダー',
      '「' || v_session.title || '」が明日開催されます',
      v_reg.team_id,
      correct_link
    );
  END LOOP;
END;
$function$;

revoke all on function send_monthly_fee_reminders() from public;
revoke all on function send_monthly_fee_reminders() from anon;
revoke all on function send_monthly_fee_reminders() from authenticated;
grant execute on function send_monthly_fee_reminders() to postgres, service_role;

revoke all on function send_session_reminders() from public;
revoke all on function send_session_reminders() from anon;
revoke all on function send_session_reminders() from authenticated;
grant execute on function send_session_reminders() to postgres, service_role;

create or replace function update_join_requests_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
