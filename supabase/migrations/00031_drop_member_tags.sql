-- team_members.tags カラムを削除
-- タグはユーザー個別のプロフィール設定（profiles.specialties / level / swimming_goals）を使用するため不要
ALTER TABLE team_members
  DROP COLUMN IF EXISTS tags;
