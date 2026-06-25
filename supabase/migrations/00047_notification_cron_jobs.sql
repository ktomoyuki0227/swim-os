-- ============================================================
-- 通知クーロンジョブ
-- 1. 月謝リマインダー: 毎月1日 9:00 JST（00:00 UTC）に未払い月謝メンバーへ通知
-- 2. 前日セッションリマインダー: 毎日 18:00 JST（09:00 UTC）に翌日セッション参加者へ通知
-- ============================================================

-- pg_cron 拡張を有効化（Supabase Pro 以上で使用可能）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- 関数: 月謝リマインダーを送信
-- ============================================================
CREATE OR REPLACE FUNCTION send_monthly_fee_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- ============================================================
-- 関数: 翌日セッションリマインダーを送信
-- ============================================================
CREATE OR REPLACE FUNCTION send_session_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reg RECORD;
  v_session RECORD;
  already_notified BOOLEAN;
BEGIN
  -- 翌日（JST）に開催されるセッションに参加登録している人へ通知
  FOR v_reg IN
    SELECT DISTINCT sr.swimmer_id, sr.session_id
    FROM session_registrations sr
    JOIN practice_sessions ps ON ps.id = sr.session_id
    WHERE sr.cancelled_at IS NULL
      AND ps.session_status IN ('open', 'confirmed')
      AND (ps.scheduled_at AT TIME ZONE 'Asia/Tokyo')::date
          = (NOW() AT TIME ZONE 'Asia/Tokyo' + INTERVAL '1 day')::date
  LOOP
    -- 本日すでに同じセッションのリマインダーを送信済みならスキップ
    SELECT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_reg.swimmer_id
        AND type = 'session_reminder'
        AND link = '/sessions/' || v_reg.session_id
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
      v_session.team_id,
      '/sessions/' || v_reg.session_id
    );
  END LOOP;
END;
$$;

-- ============================================================
-- cron ジョブの登録（冪等: 同名ジョブがあれば先に削除してから再登録）
-- ============================================================

-- 月謝リマインダー: 毎月1日 00:00 UTC（= 09:00 JST）
SELECT cron.unschedule('monthly-fee-reminder') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'monthly-fee-reminder'
);
SELECT cron.schedule(
  'monthly-fee-reminder',
  '0 0 1 * *',
  'SELECT send_monthly_fee_reminders()'
);

-- 前日リマインダー: 毎日 09:00 UTC（= 18:00 JST）
SELECT cron.unschedule('session-day-before-reminder') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'session-day-before-reminder'
);
SELECT cron.schedule(
  'session-day-before-reminder',
  '0 9 * * *',
  'SELECT send_session_reminders()'
);
