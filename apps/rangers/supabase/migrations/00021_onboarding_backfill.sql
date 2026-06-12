-- 既存ユーザーのオンボーディング完了日時をバックフィル
-- チームメンバーとして既に参加しているユーザーはオンボーディング済みとみなす
UPDATE profiles
SET onboarding_completed_at = created_at
WHERE onboarding_completed_at IS NULL
  AND id IN (SELECT DISTINCT swimmer_id FROM team_members);
