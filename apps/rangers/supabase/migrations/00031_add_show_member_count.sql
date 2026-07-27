-- Migration: 00031_add_show_member_count
-- Adds show_member_count column to control whether the member count is displayed
-- on the public team/personal detail page (reached from search).

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS show_member_count BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN teams.show_member_count IS 'Whether to display the member count on the public team/personal detail page';
