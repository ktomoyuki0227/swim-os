-- ============================================================
-- セッションリマインダー通知のリンクを修正
-- メンバー向けビュー: /sessions/{id} → /teams/{team_id}/sessions/{id}
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
$$;
