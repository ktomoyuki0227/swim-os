-- profiles に本人の電話番号カラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
