-- Migration: 00073_add_show_participant_count
-- Adds show_participant_count column to control whether the current
-- registration count (in addition to max_participants) is displayed on the
-- session detail page for swimmers.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS show_participant_count BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN teams.show_participant_count IS 'Whether to display the current registration count (vs. only max_participants) on the session detail page for swimmers';
