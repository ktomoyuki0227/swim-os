-- グループ練習情報を teams テーブルに追加
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS practice_frequency text,
  ADD COLUMN IF NOT EXISTS practice_days text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS main_pool text;
