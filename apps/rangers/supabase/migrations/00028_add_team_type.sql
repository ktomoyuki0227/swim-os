-- Migration: 00028_add_team_type
-- Adds team_type column to distinguish between team groups and personal training groups.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS team_type TEXT NOT NULL DEFAULT 'team'
  CHECK (team_type IN ('team', 'personal'));

COMMENT ON COLUMN teams.team_type IS 'Group type: team = multi-member club/team, personal = 1-on-1 or small private lessons';
