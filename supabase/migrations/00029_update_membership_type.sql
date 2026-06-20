-- membership_type を "regular" | "point_card" から "annual" | "monthly" | "point_card" に変更
-- 既存の "regular" レコードをチームフラグに基づいて変換

-- 1. 既存 "regular" を変換
--    チームが has_annual_fee のみ → "annual"
--    それ以外（has_monthly_fee あり、または両方なし）→ "monthly"
UPDATE team_members tm
SET membership_type = CASE
  WHEN t.has_annual_fee = true AND t.has_monthly_fee = false THEN 'annual'
  ELSE 'monthly'
END
FROM teams t
WHERE tm.team_id = t.id
  AND tm.membership_type = 'regular';

-- 2. チェック制約を更新
ALTER TABLE team_members
  DROP CONSTRAINT IF EXISTS team_members_membership_type_check;

ALTER TABLE team_members
  ADD CONSTRAINT team_members_membership_type_check
  CHECK (membership_type IN ('annual', 'monthly', 'point_card'));

-- 3. tags カラムを削除（プロフィールタグに移行済み）
ALTER TABLE team_members DROP COLUMN IF EXISTS tags;
