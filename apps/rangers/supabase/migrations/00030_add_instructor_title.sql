-- Migration: 00030_add_instructor_title
-- Adds instructor_title column, used for personal-type teams to show the instructor's title (e.g. job title, qualification).

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS instructor_title TEXT;

COMMENT ON COLUMN teams.instructor_title IS 'Instructor title shown for personal-type teams (e.g. "水泳コーチ"). Not used for team-type groups.';
