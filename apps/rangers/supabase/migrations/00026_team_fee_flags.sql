-- Migration: 00026_team_fee_flags
-- Adds boolean flags to teams table to control which fee types are enabled.
-- This allows teams to opt-in only to the fee structures they actually use.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS has_session_fee BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_annual_fee  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_monthly_fee BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_point_card  BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN teams.has_session_fee IS 'Team charges per-session participation fees';
COMMENT ON COLUMN teams.has_annual_fee  IS 'Team collects annual membership fees';
COMMENT ON COLUMN teams.has_monthly_fee IS 'Team collects monthly dues';
COMMENT ON COLUMN teams.has_point_card  IS 'Team uses a point card (stamp card) system';

-- マウントリバー水泳クラブ: 全料金体系を有効化
UPDATE teams
SET
  has_session_fee = true,
  has_annual_fee  = true,
  has_monthly_fee = true,
  has_point_card  = true
WHERE name = 'マウントリバー水泳クラブ';

-- 東京マスターズ水泳クラブ: セッション参加費 + 年会費のみ（月謝・回数券なし）
UPDATE teams
SET
  has_session_fee = true,
  has_annual_fee  = true,
  has_monthly_fee = false,
  has_point_card  = false
WHERE name = '東京マスターズ水泳クラブ';
