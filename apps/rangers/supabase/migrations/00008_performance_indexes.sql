-- パフォーマンス改善: 頻繁に使われるクエリ用インデックス追加

-- team_members: admin権限チェック（Server Actionsで多用）
CREATE INDEX IF NOT EXISTS idx_team_members_admin
  ON team_members (team_id, swimmer_id)
  WHERE role = 'admin';

-- session_registrations: 決済ステータス別フィルタ（確定・返金処理で使用）
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status
  ON session_registrations (session_id, payment_status)
  WHERE cancelled_at IS NULL;

-- membership_fees: チーム × ステータス検索（会費管理ページ）
CREATE INDEX IF NOT EXISTS idx_fees_team_status
  ON membership_fees (team_id, status);

-- announcements: チーム × 作成日（お知らせ一覧）
CREATE INDEX IF NOT EXISTS idx_announcements_team
  ON announcements (team_id, created_at DESC);

-- notifications: ユーザー × 未読フィルタ（ベルアイコン未読数）
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id, is_read)
  WHERE is_read = false;
