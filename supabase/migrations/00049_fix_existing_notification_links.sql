-- ============================================================
-- 既存通知の古いリンクを修正
-- 修正前に作成された /sessions/{id} 形式のリンクを
-- メンバー向け /teams/{team_id}/sessions/{id} に書き換える
--
-- 対象: link が '/sessions/...' の形式で、かつ受信者が
--       そのチームの管理者でないすべての通知
-- 管理者宛ての通知（/sessions/{id}）はそのまま維持する
-- ============================================================

UPDATE notifications n
SET link = '/teams/' || n.team_id || '/sessions/' || SUBSTRING(n.link FROM '^/sessions/(.+)$')
WHERE n.link LIKE '/sessions/%'
  AND n.team_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.swimmer_id = n.user_id
      AND tm.team_id    = n.team_id
      AND tm.role       = 'admin'
      AND tm.status     = 'active'
  );
