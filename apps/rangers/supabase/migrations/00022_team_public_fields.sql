-- Migration: 00022_team_public_fields
-- Adds public-facing display fields to the teams table.
-- NOTE: A "teams" bucket must be created in Supabase Storage (public bucket)
--       to support cover image and icon uploads via uploadTeamImage action.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_recruiting   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS activity_area   TEXT;

COMMENT ON COLUMN teams.cover_image_url IS 'Hero banner image URL (shown at top of public team page)';
COMMENT ON COLUMN teams.is_recruiting    IS 'Whether the team is currently accepting new members';
COMMENT ON COLUMN teams.activity_area    IS 'Text description of the area where the team is active (e.g. prefecture or city)';
