-- profiles テーブルに swimmer_type と swim_disciplines を追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS swimmer_type       text,
  ADD COLUMN IF NOT EXISTS swim_disciplines   text[] NOT NULL DEFAULT '{}';
