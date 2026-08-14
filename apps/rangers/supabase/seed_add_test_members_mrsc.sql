-- マウントリバー水泳クラブ(aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)にテスト会員10名を追加。
-- レンジャーズ機能検証用(月謝マトリクス・現金会費自動生成・セッション過去タブの
-- 現金未回収バッジ)に、会員種別・支払い状況にバリエーションを持たせている。
-- 実行方法: Supabase SQL Editor または `supabase db execute` 等でこのファイルを実行する。

-- ── 認証ユーザー + プロフィール ──────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'mrsc01@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"田中一郎"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'mrsc02@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"高橋美咲"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'mrsc03@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"伊藤健二"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'mrsc04@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"渡辺さくら"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'mrsc05@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"中村大輔"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'mrsc06@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"小林愛"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'mrsc07@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"加藤直樹"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'mrsc08@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"山本恵美"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'mrsc09@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"岡田翔太"}', 'authenticated', 'authenticated', now(), now()),
  ('e0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'mrsc10@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"松本結衣"}', 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- profiles.role は 'member' | 'super_admin' のみ許可（アプリ内の権限ロール。チームの
-- 会員種別とは別軸のため、通常会員は全員デフォルトの 'member'）。
-- onboarding_completed_at はオンボーディング済みの既存会員として扱うため設定する。
INSERT INTO profiles (id, name, role, onboarding_completed_at) VALUES
  ('e0000000-0000-0000-0000-000000000001', '田中一郎', 'member', now()),
  ('e0000000-0000-0000-0000-000000000002', '高橋美咲', 'member', now()),
  ('e0000000-0000-0000-0000-000000000003', '伊藤健二', 'member', now()),
  ('e0000000-0000-0000-0000-000000000004', '渡辺さくら', 'member', now()),
  ('e0000000-0000-0000-0000-000000000005', '中村大輔', 'member', now()),
  ('e0000000-0000-0000-0000-000000000006', '小林愛', 'member', now()),
  ('e0000000-0000-0000-0000-000000000007', '加藤直樹', 'member', now()),
  ('e0000000-0000-0000-0000-000000000008', '山本恵美', 'member', now()),
  ('e0000000-0000-0000-0000-000000000009', '岡田翔太', 'member', now()),
  ('e0000000-0000-0000-0000-000000000010', '松本結衣', 'member', now())
ON CONFLICT (id) DO NOTHING;

-- ── チームメンバー登録(会員種別のバリエーション) ────────────────────────
-- 1:annual(支払済) 2:annual(未払い) 3:monthly(7ヶ月済+1ヶ月未払い) 4:monthly(全額済)
-- 5:monthly(2ヶ月延滞) 6:point_card(残3) 7:point_card(残0=要再購入) 8:annual(年度中入会・未払い)
-- 9:monthly(今月入会・初月未払い) 10:monthly(1ヶ月未払い、かつ過去セッションで現金未回収あり)
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, status, stamp_remaining, joined_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000001', 'member', 'annual', 'active', 0, '2026-01-20 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000002', 'member', 'annual', 'active', 0, '2026-02-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'member', 'monthly', 'active', 0, '2026-01-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'member', 'monthly', 'active', 0, '2026-01-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000005', 'member', 'monthly', 'active', 0, '2026-03-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000006', 'member', 'point_card', 'active', 3, '2026-04-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000007', 'member', 'point_card', 'active', 0, '2026-05-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000008', 'member', 'annual', 'active', 0, '2026-06-15 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000009', 'member', 'monthly', 'active', 0, '2026-08-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'member', 'monthly', 'active', 0, '2026-02-01 00:00:00+00')
ON CONFLICT (team_id, swimmer_id) DO NOTHING;

-- ── 年会費・月謝(membership_fees) ────────────────────────────────────
-- 田中一郎: 2026年会費 支払済
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status, paid_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000001', 'annual', '2026', 38000, 'cash', 'paid', '2026-01-25 00:00:00+00')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- 高橋美咲: 2026年会費 未払い
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000002', 'annual', '2026', 38000, 'cash', 'unpaid')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- 伊藤健二: 月謝 1〜7月支払済、8月未払い
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status, paid_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-01', 3800, 'cash', 'paid', '2026-01-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-02', 3800, 'cash', 'paid', '2026-02-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-03', 3800, 'cash', 'paid', '2026-03-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-04', 3800, 'cash', 'paid', '2026-04-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-05', 3800, 'cash', 'paid', '2026-05-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-06', 3800, 'cash', 'paid', '2026-06-05 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-07', 3800, 'cash', 'paid', '2026-07-05 00:00:00+00')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000003', 'monthly', '2026-08', 3800, 'cash', 'unpaid')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- 渡辺さくら: 月謝 1〜8月すべて支払済(完全に追いついている会員)
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status, paid_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-01', 3800, 'cash', 'paid', '2026-01-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-02', 3800, 'cash', 'paid', '2026-02-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-03', 3800, 'cash', 'paid', '2026-03-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-04', 3800, 'cash', 'paid', '2026-04-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-05', 3800, 'cash', 'paid', '2026-05-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-06', 3800, 'cash', 'paid', '2026-06-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-07', 3800, 'cash', 'paid', '2026-07-10 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000004', 'monthly', '2026-08', 3800, 'cash', 'paid', '2026-08-10 00:00:00+00')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- 中村大輔: 月謝 3〜6月支払済、7・8月未払い(2ヶ月延滞)
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status, paid_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000005', 'monthly', '2026-03', 3800, 'cash', 'paid', '2026-03-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000005', 'monthly', '2026-04', 3800, 'cash', 'paid', '2026-04-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000005', 'monthly', '2026-05', 3800, 'cash', 'paid', '2026-05-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000005', 'monthly', '2026-06', 3800, 'cash', 'paid', '2026-06-01 00:00:00+00')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000005', 'monthly', '2026-07', 3800, 'cash', 'unpaid'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000005', 'monthly', '2026-08', 3800, 'cash', 'unpaid')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- 山本恵美: 年度途中入会、2026年会費 未払い
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000008', 'annual', '2026', 38000, 'cash', 'unpaid')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- 岡田翔太: 今月(8月)入会、初月分未払い
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000009', 'monthly', '2026-08', 3800, 'cash', 'unpaid')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- 松本結衣: 月謝 2〜7月支払済、8月未払い
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status, paid_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'monthly', '2026-02', 3800, 'cash', 'paid', '2026-02-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'monthly', '2026-03', 3800, 'cash', 'paid', '2026-03-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'monthly', '2026-04', 3800, 'cash', 'paid', '2026-04-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'monthly', '2026-05', 3800, 'cash', 'paid', '2026-05-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'monthly', '2026-06', 3800, 'cash', 'paid', '2026-06-01 00:00:00+00'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'monthly', '2026-07', 3800, 'cash', 'paid', '2026-07-01 00:00:00+00')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, payment_method, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000010', 'monthly', '2026-08', 3800, 'cash', 'unpaid')
ON CONFLICT (team_id, swimmer_id, type, period) DO NOTHING;

-- ── 回数券購入履歴(stamp_purchases) ──────────────────────────────────
-- 小林愛: 10回券購入済み、残3(7回消費)
INSERT INTO stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, payment_method, status, note, purchased_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000006', 1, 10, 9600, 'cash', 'paid', '初回購入', '2026-04-01 00:00:00+00');

-- 加藤直樹: 10回券購入済み、残0(使い切り・要再購入のテストケース)
INSERT INTO stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, payment_method, status, note, purchased_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-000000000007', 1, 10, 9600, 'cash', 'paid', '初回購入(使い切り)', '2026-05-01 00:00:00+00');

-- ── 過去セッションへの現金参加登録(admin-session-listの現金未回収バッジ検証用) ──
-- 2026-07-13 個人メドレー特訓(confirmed): 松本結衣=現金未回収、伊藤健二=現金回収済み
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status, charged_amount, registered_at) VALUES
  ('5634a92f-2d89-4867-9aec-b10a63d5a8d3', 'e0000000-0000-0000-0000-000000000010', true, 'cash', 'pending', 1000, '2026-07-12 09:00:00+00'),
  ('5634a92f-2d89-4867-9aec-b10a63d5a8d3', 'e0000000-0000-0000-0000-000000000003', true, 'cash', 'paid', 1000, '2026-07-12 09:00:00+00');

-- 2026-03-04 土曜スピード練習(confirmed): 中村大輔=現金未回収、渡辺さくら=現金回収済み
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status, charged_amount, registered_at) VALUES
  ('12a948c9-016c-478c-9a3d-a3ad4f62dc31', 'e0000000-0000-0000-0000-000000000005', true, 'cash', 'pending', 1000, '2026-03-03 09:00:00+00'),
  ('12a948c9-016c-478c-9a3d-a3ad4f62dc31', 'e0000000-0000-0000-0000-000000000004', true, 'cash', 'paid', 1000, '2026-03-03 09:00:00+00');
