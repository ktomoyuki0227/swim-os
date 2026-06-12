-- オンボーディング完了日時 + Stripe 支払い方法ID をプロフィールに追加

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;

-- オンボーディング未完了ユーザーの検索用インデックス
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding
  ON profiles(onboarding_completed_at)
  WHERE onboarding_completed_at IS NULL;
