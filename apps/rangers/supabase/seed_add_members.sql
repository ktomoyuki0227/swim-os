-- テストユーザー追加（swimmer3, swimmer4）
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'swimmer3@example.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"山田次郎"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'swimmer4@example.com',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"伊藤美咲"}',
    'authenticated', 'authenticated', now(), now()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, role) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', '山田次郎', 'swimmer'),
  ('a1b2c3d4-0002-0002-0002-000000000002', '伊藤美咲', 'swimmer')
ON CONFLICT (id) DO NOTHING;

-- 既存チーム（8d791273: 田中コーチのチーム）にメンバーとして追加
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, status) VALUES
  ('8d791273-8c2f-493e-b78d-e5b31ba0327d', 'a1b2c3d4-0001-0001-0001-000000000001', 'member', 'regular', 'active'),
  ('8d791273-8c2f-493e-b78d-e5b31ba0327d', 'a1b2c3d4-0002-0002-0002-000000000002', 'member', 'point_card', 'active')
ON CONFLICT (team_id, swimmer_id) DO NOTHING;
