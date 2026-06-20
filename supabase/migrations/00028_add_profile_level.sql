-- profiles.level: スイマーの水泳レベル（初級/中級/上級）
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS level text CHECK (level IN ('初級', '中級', '上級'));
