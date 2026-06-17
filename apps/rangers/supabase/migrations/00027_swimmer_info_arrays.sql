-- スイマー情報の複数選択フィールドを追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS prefectures   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS swimming_goals      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS participation_styles text[] NOT NULL DEFAULT '{}';

-- 既存の prefecture 値を prefectures 配列へバックフィル
UPDATE profiles
SET prefectures = ARRAY[prefecture]
WHERE prefecture IS NOT NULL
  AND prefecture <> ''
  AND array_length(prefectures, 1) IS NULL;
