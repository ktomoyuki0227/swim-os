-- team_members に tags カラムを再追加
-- セッション target_tags と照合するための管理者設定タグ（プロフィールタグとは別）
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]';
