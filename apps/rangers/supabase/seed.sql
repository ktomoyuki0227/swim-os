-- ============================================================
-- Rangers デモ用シードデータ（検証網羅版）
-- 「個人として登録 → チームを作ると管理者になる」フローを体現
-- ============================================================
-- 実行方法:
--   npx supabase db query --linked --file supabase/seed.sql
--
-- テストアカウント（全パスワード: test1234）:
--   test1@example.com → 山田 健太 ★マスターアカウント（チーム管理者・全機能検証可）
--   test2@example.com → 鈴木 太郎（レギュラー会員・cash支払い）
--   test3@example.com → 佐藤 花子（回数券会員・スタンプ残7回）
--
-- 検証網羅:
--   ロール        : admin / member
--   会員種別      : regular / point_card
--   セッションtype : practice / event / meeting
--   session_status: open / confirmed / cancelled
--   publishStatus : published / draft
--   外部公開      : true / false
--   payment_method: cash / point_card（stripe は実際の決済が必要）
--   payment_status: pending / paid / free
--   会費status    : paid / unpaid
--   タグ（レベル）: beginner / intermediate / advanced
--   タグ（種目）  : freestyle / backstroke / breaststroke / butterfly / medley
--   タグ（目的）  : health / competitive
-- ============================================================

-- ============================================================
-- STEP 1: 既存テストユーザーの完全クリーンアップ（FK依存順に削除）
-- ============================================================
DO $$
DECLARE
  old_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO old_ids FROM auth.users
  WHERE email IN (
    'instructor@example.com', 'swimmer1@example.com', 'swimmer2@example.com',
    'swimmer3@example.com', 'swimmer4@example.com',
    'test1@example.com', 'test2@example.com', 'test3@example.com',
    'test4@example.com'
  );

  IF old_ids IS NOT NULL THEN
    DELETE FROM session_registrations WHERE swimmer_id = ANY(old_ids);
    DELETE FROM membership_fees WHERE swimmer_id = ANY(old_ids);
    DELETE FROM stamp_purchases WHERE swimmer_id = ANY(old_ids);
    DELETE FROM team_members WHERE swimmer_id = ANY(old_ids);
    DELETE FROM notifications WHERE user_id = ANY(old_ids);
    DELETE FROM messages WHERE sender_id = ANY(old_ids) OR receiver_id = ANY(old_ids);
    DELETE FROM announcements WHERE author_id = ANY(old_ids);
    DELETE FROM practice_sessions WHERE coach_id = ANY(old_ids);
    DELETE FROM teams WHERE coach_id = ANY(old_ids);
    DELETE FROM bookings WHERE swimmer_id = ANY(old_ids);
    DELETE FROM lessons WHERE instructor_id = ANY(old_ids);
    -- profiles は auth.users の CASCADE DELETE で連鎖削除される
    DELETE FROM auth.users WHERE id = ANY(old_ids);
  END IF;
END $$;

-- ============================================================
-- STEP 2: テストユーザー作成（固定UUID）
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'test1@example.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"山田 健太"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'test2@example.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"鈴木 太郎"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'test3@example.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"佐藤 花子"}',
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'test4@example.com',
    crypt('test1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"田中 新太郎"}',
    'authenticated', 'authenticated', now(), now()
  );

-- auth.identities を作成（signInWithPassword に必須）
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"test1@example.com"}',
    'email', 'test1@example.com', now(), now(), now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"test2@example.com"}',
    'email', 'test2@example.com', now(), now(), now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"test3@example.com"}',
    'email', 'test3@example.com', now(), now(), now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    '{"sub":"44444444-4444-4444-4444-444444444444","email":"test4@example.com"}',
    'email', 'test4@example.com', now(), now(), now()
  );

-- プロフィール名を設定（auth trigger で profile が自動生成される場合に備えて UPDATE）
UPDATE profiles SET name = '山田 健太' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET name = '鈴木 太郎' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE profiles SET name = '佐藤 花子' WHERE id = '33333333-3333-3333-3333-333333333333';
-- 田中 新太郎: チーム未所属（LINEログイン後の新規ユーザー状態を再現）
UPDATE profiles SET name = '田中 新太郎' WHERE id = '44444444-4444-4444-4444-444444444444';

-- ============================================================
-- STEP 3: チーム・セッション・登録・会費データ
-- ============================================================
DO $$
DECLARE
  v_user1 uuid := '11111111-1111-1111-1111-111111111111'; -- 山田 健太（管理者）
  v_user2 uuid := '22222222-2222-2222-2222-222222222222'; -- 鈴木 太郎（レギュラー会員）
  v_user3 uuid := '33333333-3333-3333-3333-333333333333'; -- 佐藤 花子（回数券会員）
  v_team_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  -- セッションID
  v_s1 uuid; -- 水曜朝練（open）
  v_s2 uuid; -- 土曜スピード（open）
  v_s3 uuid; -- 個人メドレー（confirmed）
  v_s4 uuid; -- チームミーティング（open / meeting）
  v_s5 uuid; -- 夏季合宿（open / event / 外部公開）
  v_s6 uuid; -- キャンセル済み練習（cancelled）
  v_s7 uuid; -- 下書き練習（draft）
BEGIN

-- ============================================================
-- チーム作成（山田 健太が作成 → 管理者になる）
-- ============================================================
INSERT INTO teams (
  id, coach_id, name, description,
  default_member_price, default_guest_price,
  annual_fee_amount, monthly_fee_amount,
  cancellation_days, point_card_count, point_card_price,
  status
) VALUES (
  v_team_id, v_user1,
  'マウントリバー水泳クラブ',
  '山梨県甲府市を拠点とするマスターズ水泳チーム。'||chr(10)||'毎週水・土曜日に甲府市民プールで練習を行っています。',
  1000, 1500,
  5000, 3000,
  3, 10, 9000,
  'active'
);

-- ============================================================
-- メンバー登録（ロール・会員種別・全タグを網羅）
-- ============================================================

-- 山田 健太: admin / regular / レベル:上級 / 種目:全種目 / 目的:競技
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
VALUES (
  v_team_id, v_user1, 'admin', 'regular',
  '["level_advanced","stroke_freestyle","stroke_backstroke","stroke_breaststroke","stroke_butterfly","stroke_medley","purpose_competitive"]',
  0
);

-- 鈴木 太郎: member / regular / レベル:中級 / 種目:クロール・背泳ぎ / 目的:健康
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
VALUES (
  v_team_id, v_user2, 'member', 'regular',
  '["level_intermediate","stroke_freestyle","stroke_backstroke","purpose_health"]',
  0
);

-- 佐藤 花子: member / point_card / レベル:初級 / 種目:平泳ぎ・バタフライ / 目的:健康
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
VALUES (
  v_team_id, v_user3, 'member', 'point_card',
  '["level_beginner","stroke_breaststroke","stroke_butterfly","purpose_health"]',
  7
);

-- ============================================================
-- セッション1: 水曜朝練（practice / open / published）来週
-- → 検証: 参加受付中・全員対象・cash/pending & point_card/paid
-- ============================================================
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '水曜朝練 - クロール技術練習',
  '週1回の定期練習。クロールのフォーム改善に重点を置きます。',
  'アップ 400m（クロール）'||chr(10)||
  'キック練習 4×50m（板キック）'||chr(10)||
  'プル練習 4×100m（パドル）'||chr(10)||
  'テクニカルドリル 6×50m'||chr(10)||
  'メインセット 3×200m（ペース泳）'||chr(10)||
  'ダウン 200m（クール）',
  'practice',
  (now() + interval '7 days')::date + time '07:00',
  '甲府市民プール',
  1000, 1500,
  (now() + interval '5 days')::date + time '23:59',
  3, 12,
  '[]'::jsonb, true,
  false, 'open', 'published'
) RETURNING id INTO v_s1;

-- ============================================================
-- セッション2: 土曜スピード練習（practice / open / published）10日後
-- → 検証: レベル絞り込みタグ・cash/paid
-- ============================================================
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '土曜スピード練習',
  '大会シーズンに向けた強化練習。スピード系のセットを中心に行います。',
  'アップ 600m（IM順）'||chr(10)||
  'スピードドリル 8×25m（全力）'||chr(10)||
  'メインセット 3×(100m + 50m + 25m) 全力'||chr(10)||
  'インターバル 10×50m (rest :30)'||chr(10)||
  'ダウン 300m',
  'practice',
  (now() + interval '10 days')::date + time '09:00',
  '甲府市民プール',
  1000, 1500,
  (now() + interval '8 days')::date + time '23:59',
  5, 15,
  '["level_intermediate","level_advanced"]'::jsonb, true,
  false, 'open', 'published'
) RETURNING id INTO v_s2;

-- ============================================================
-- セッション3: 個人メドレー特訓（practice / confirmed / published）14日後
-- → 検証: 開催確定・全員登録済み・cash/paid & point_card/paid & cash/free
-- ============================================================
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '水曜朝練 - 個人メドレー特訓',
  'マスターズ大会に向けた個人メドレーの強化練習です。',
  'アップ 500m（IM）'||chr(10)||
  'ドリル 4×75m（各種目25m）'||chr(10)||
  'ターン練習 16×25m（各種目×4）'||chr(10)||
  'メインセット 4×100m IM'||chr(10)||
  'ダウン 200m',
  'practice',
  (now() + interval '14 days')::date + time '07:00',
  '甲府市民プール',
  1000, 1500,
  (now() + interval '12 days')::date + time '23:59',
  4, 12,
  '["stroke_medley"]'::jsonb, true,
  false, 'confirmed', 'published'
) RETURNING id INTO v_s3;

-- ============================================================
-- セッション4: チームミーティング（meeting / open / published）5日後
-- → 検証: meetingタイプ・無料参加（free）
-- ============================================================
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '6月度チームミーティング',
  '夏季合宿の内容確認と今後のスケジュール調整を行います。',
  '1. 夏季合宿の詳細確認'||chr(10)||
  '2. 7〜8月の練習スケジュール'||chr(10)||
  '3. 大会エントリー状況報告'||chr(10)||
  '4. その他連絡事項',
  'meeting',
  (now() + interval '5 days')::date + time '19:00',
  '甲府市民プール 会議室',
  0, 0,
  (now() + interval '4 days')::date + time '23:59',
  1, 20,
  '[]'::jsonb, false,
  false, 'open', 'published'
) RETURNING id INTO v_s4;

-- ============================================================
-- セッション5: 夏季強化合宿（event / open / published / is_external=true）30日後
-- → 検証: eventタイプ・外部公開・ゲスト料金
-- ============================================================
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '夏季強化合宿 Day1（外部参加OK）',
  '1泊2日の強化合宿。外部からのゲスト参加も大歓迎です！',
  '午前練習: 2000m（技術中心）'||chr(10)||
  '午後練習: 2500m（持久力中心）'||chr(10)||
  'コーチングセッション（フォーム動画分析）',
  'event',
  (now() + interval '30 days')::date + time '09:00',
  '山梨県立富士北麓公園屋内プール',
  3000, 5000,
  (now() + interval '25 days')::date + time '23:59',
  8, 20,
  '["level_intermediate","level_advanced"]'::jsonb, false,
  true, 'open', 'published'
) RETURNING id INTO v_s5;

-- ============================================================
-- セッション6: キャンセル済み練習（practice / cancelled / published）過去
-- → 検証: session_status=cancelled の表示
-- ============================================================
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '水曜朝練 - キャンセル（雨天中止）',
  'プール施設の都合によりキャンセルとなりました。',
  'キャンセル',
  'practice',
  (now() - interval '7 days')::date + time '07:00',
  '甲府市民プール',
  1000, 1500,
  (now() - interval '9 days')::date + time '23:59',
  3, 12,
  '[]'::jsonb, true,
  false, 'cancelled', 'published'
) RETURNING id INTO v_s6;

-- ============================================================
-- セッション7: 下書き練習（practice / open / draft）20日後
-- → 検証: status=draft（管理者のみ表示・一般非公開）
-- ============================================================
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '【下書き】土曜特別練習',
  '内容未定。まだ公開していません。',
  '未定',
  'practice',
  (now() + interval '20 days')::date + time '09:00',
  '甲府市民プール',
  1000, 1500,
  (now() + interval '18 days')::date + time '23:59',
  3, 10,
  '[]'::jsonb, true,
  false, 'open', 'draft'
) RETURNING id INTO v_s7;

-- ============================================================
-- 参加登録（payment_method × payment_status を網羅）
-- ============================================================

-- セッション1（open）:
--   鈴木太郎: cash / pending（未払い → 管理者が確認する典型ケース）
--   佐藤花子: point_card / paid（スタンプ使用済み）
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s1, v_user2, true, 'cash', 'pending');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s1, v_user3, true, 'point_card', 'paid');

-- セッション2（open）:
--   鈴木太郎: cash / paid（現金支払い済み）
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s2, v_user2, true, 'cash', 'paid');

-- セッション3（confirmed）: 全員登録済み・支払い済み
--   山田健太: cash / free（管理者・無料参加）
--   鈴木太郎: cash / paid
--   佐藤花子: point_card / paid
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s3, v_user1, true, 'cash', 'free');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s3, v_user2, true, 'cash', 'paid');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s3, v_user3, true, 'point_card', 'paid');

-- セッション4（meeting / 無料）:
--   鈴木太郎: cash / free
--   佐藤花子: cash / free
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s4, v_user2, true, 'cash', 'free');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s4, v_user3, true, 'cash', 'free');

-- セッション6（cancelled）:
--   鈴木太郎: cash / pending（キャンセル前に登録していた状態）
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_s6, v_user2, true, 'cash', 'pending');

-- ============================================================
-- 回数券購入履歴（佐藤花子）
-- → 検証: stamp_purchases テーブル・購入→使用の流れ
-- ============================================================
INSERT INTO stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, purchased_at)
VALUES (v_team_id, v_user3, 1, 10, 9000, now() - interval '30 days');

-- ============================================================
-- お知らせ（2件）
-- ============================================================
INSERT INTO announcements (id, team_id, author_id, title, body, link_url)
VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '開催確定: 水曜朝練 - 個人メドレー特訓',
  format('%s の「水曜朝練 - 個人メドレー特訓」が開催確定しました。参加費のお支払いをお忘れなく。',
    (now() + interval '14 days')::date),
  '/teams/' || v_team_id || '/sessions/' || v_s3
);

INSERT INTO announcements (id, team_id, author_id, title, body, link_url)
VALUES (
  gen_random_uuid(), v_team_id, v_user1,
  '夏季合宿の参加受付を開始しました',
  '今年も夏季強化合宿を開催します！外部からのゲスト参加も歓迎。'||chr(10)||
  '定員20名になり次第締め切りますので、お早めにご登録ください。',
  '/teams/' || v_team_id || '/sessions/' || v_s5
);

-- ============================================================
-- 会費データ（paid / unpaid を両方用意）
-- ============================================================

-- 山田健太（管理者）: 年会費 支払い済み
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at)
VALUES (v_team_id, v_user1, 'annual', extract(year from now())::text, 5000, 'paid', now() - interval '60 days');

-- 鈴木太郎: 年会費 未払い（督促表示の検証）
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status)
VALUES (v_team_id, v_user2, 'annual', extract(year from now())::text, 5000, 'unpaid');

-- 佐藤花子: 年会費 支払い済み
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at)
VALUES (v_team_id, v_user3, 'annual', extract(year from now())::text, 5000, 'paid', now() - interval '30 days');

-- ============================================================
-- 完了ログ
-- ============================================================
RAISE NOTICE '==============================================';
RAISE NOTICE 'Rangers デモデータ投入完了（検証網羅版）';
RAISE NOTICE '==============================================';
RAISE NOTICE 'アカウント（パスワード: test1234）:';
RAISE NOTICE '  test1@example.com → 山田 健太（★マスター / チーム管理者）';
RAISE NOTICE '  test2@example.com → 鈴木 太郎（レギュラー会員）';
RAISE NOTICE '  test3@example.com → 佐藤 花子（回数券会員・残7回）';
RAISE NOTICE '  test4@example.com → 田中 新太郎（新規ユーザー / チーム未所属 / LINEログイン導線検証用）';
RAISE NOTICE '----------------------------------------------';
RAISE NOTICE 'チーム: マウントリバー水泳クラブ';
RAISE NOTICE 'セッション: 7件';
RAISE NOTICE '  practice×5（open×2, confirmed×1, cancelled×1, draft×1）';
RAISE NOTICE '  meeting×1（open）';
RAISE NOTICE '  event×1（open / 外部公開）';
RAISE NOTICE '参加登録: 8件';
RAISE NOTICE '  cash/pending×2, cash/paid×2, cash/free×3, point_card/paid×2';
RAISE NOTICE '回数券購入: 1件（佐藤花子 / 10枚 / ¥9,000）';
RAISE NOTICE 'お知らせ: 2件 / 会費: 3件（paid×2, unpaid×1）';
RAISE NOTICE '==============================================';

END $$;
