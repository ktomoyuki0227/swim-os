-- テストユーザーの整理
-- 1. 田中 太郎・田中 次郎を削除（auth.usersからのカスケード削除）
-- 2. 田中 新太郎のダミーデータを正しい値に修正
-- 3. 田中 小太郎を新規作成（test5@example.com）
-- 4. 佐藤 花子のアバター設定

-- ── 1. 削除 ─────────────────────────────────────────────
DELETE FROM auth.users
WHERE id IN (
  'ac1a7baf-e478-4090-9011-01bfdf9aee89', -- 田中 太郎 (test5@example.com)
  '7c015ab8-89a3-49e4-8a3d-19e0f0731bdd'  -- 田中 次郎 (ktomoyuki0227@gmail.com)
);

-- ── 2. 田中 新太郎のプロフィール修正 ────────────────────
UPDATE profiles
SET
  name                       = '田中 新太郎',
  furigana                   = 'タナカ シンタロウ',
  gender                     = 'male',
  birthday                   = '1998-03-22',
  phone                      = '080-1234-5678',
  address                    = '〒160-0022 東京都新宿区新宿3丁目1番地',
  emergency_contact          = '03-5678-1234',
  emergency_contact_name     = '田中 義雄',
  emergency_contact_relation = '父',
  swimwear_size              = 'M',
  masters_registered         = false,
  jsa_registered             = false
WHERE id = '8e538fba-2637-4abf-aa9f-5b784cb2f561';

-- ── 3. 田中 小太郎を新規作成 ────────────────────────────
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'authenticated',
  'authenticated',
  'test5@example.com',
  crypt('Rangers2024!', gen_salt('bf', 10)),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "田中 小太郎"}',
  false,
  false,
  false,
  NOW(),
  NOW()
);

INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'test5@example.com',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc", "email": "test5@example.com", "email_verified": true}',
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- プロフィール更新（handle_new_user トリガーが name を設定するが上書きして完全な値にする）
UPDATE profiles
SET
  name                       = '田中 小太郎',
  furigana                   = 'タナカ コタロウ',
  gender                     = 'male',
  birthday                   = '2001-09-10',
  phone                      = '090-8765-4321',
  address                    = '〒530-0001 大阪府大阪市北区梅田1丁目1番地',
  emergency_contact          = '06-1234-5678',
  emergency_contact_name     = '田中 裕子',
  emergency_contact_relation = '母',
  swimwear_size              = 'L',
  masters_registered         = false,
  jsa_registered             = false,
  onboarding_completed_at    = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- ── 4. 佐藤 花子のアバター設定 ───────────────────────────
UPDATE profiles
SET avatar_url = '/avatars/sato-hanako.jpg'
WHERE id = '3e281812-1e3d-4522-91ca-690aa7d9d14a';
