-- スキーマドリフト補完: profiles.level / swimmer_type / swim_disciplines は
-- actions/profile.ts (getPublicProfile), actions/teams.ts (getTeamMembers) から
-- 参照されているが、本番DBには存在するにもかかわらずマイグレーション履歴には
-- 一度も追加処理が記録されていなかった（Supabase Studio等からの直接追加と推測される）。
-- 本番DBの実カラム定義に合わせてマイグレーションとして補完する。

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS swimmer_type text,
  ADD COLUMN IF NOT EXISTS swim_disciplines text[] NOT NULL DEFAULT '{}';
