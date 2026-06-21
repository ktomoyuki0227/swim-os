-- Rangers チーム機能 デモ用シードデータ
-- 実行前に seed.sql を実行済みであること
-- (instructor@example.com / swimmer1@example.com / swimmer2@example.com が存在する前提)
--
-- 追加でさらに2名のスイマーが必要:
--   swimmer3@example.com (パスワード: test1234)
--   swimmer4@example.com (パスワード: test1234)
--
-- Supabase Dashboard > Authentication > Users で手動作成後に UUID を設定して実行

DO $$
DECLARE
  -- seed.sql と同じ UUID を設定
  v_instructor_id uuid := '00000000-0000-0000-0000-000000000001'; -- ← instructor@example.com
  v_swimmer1_id   uuid := '00000000-0000-0000-0000-000000000002'; -- ← swimmer1@example.com
  v_swimmer2_id   uuid := '00000000-0000-0000-0000-000000000003'; -- ← swimmer2@example.com
  v_swimmer3_id   uuid := '00000000-0000-0000-0000-000000000004'; -- ← swimmer3@example.com (追加作成)
  v_swimmer4_id   uuid := '00000000-0000-0000-0000-000000000005'; -- ← swimmer4@example.com (追加作成)

  v_team_id       uuid;
  v_session1_id   uuid;
  v_session2_id   uuid;
  v_session3_id   uuid;
  v_session4_id   uuid;
  v_session5_id   uuid;
  v_ann1_id       uuid;
  v_ann2_id       uuid;
BEGIN

-- プロフィール名を更新（追加メンバー）
UPDATE profiles SET name = '山田次郎', role = 'member' WHERE id = v_swimmer3_id;
UPDATE profiles SET name = '加藤みどり', role = 'member' WHERE id = v_swimmer4_id;

-- ============================================================
-- チーム作成: マウントリバー水泳クラブ（MTR）
-- ============================================================
INSERT INTO teams (
  id, coach_id, name, description,
  default_member_price, default_guest_price,
  annual_fee_amount, monthly_fee_amount,
  cancellation_days, point_card_count, point_card_price,
  status
) VALUES (
  gen_random_uuid(), v_instructor_id,
  'マウントリバー水泳クラブ',
  '山梨県甲府市を拠点とするマスターズ水泳チーム。'||chr(10)||'毎週水・土曜日に甲府市民プールで練習を行っています。',
  1000, 1500,
  5000, NULL,
  3, 10, 9000,
  'active'
) RETURNING id INTO v_team_id;

-- ============================================================
-- メンバー追加
-- ============================================================

-- コーチ自身を admin として追加
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
VALUES (v_team_id, v_instructor_id, 'admin', 'annual', 0);

-- メンバー1: レギュラー会員・中級・クロール中心
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
VALUES (v_team_id, v_swimmer1_id, 'member', 'annual', 0);

-- メンバー2: 回数券会員・初級
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
VALUES (v_team_id, v_swimmer2_id, 'member', 'point_card', 7);

-- メンバー3: レギュラー会員・上級
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
VALUES (v_team_id, v_swimmer3_id, 'member', 'annual', 0);

-- メンバー4: レギュラー会員・中級・平泳ぎ
INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
VALUES (v_team_id, v_swimmer4_id, 'member', 'annual', 0);

-- ============================================================
-- セッション作成
-- ============================================================

-- セッション1: 水曜朝練（来週）
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
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
) RETURNING id INTO v_session1_id;

-- セッション2: 土曜練習（来週末）
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
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
  '["level_intermediate", "level_advanced"]'::jsonb, true,
  false, 'open', 'published'
) RETURNING id INTO v_session2_id;

-- セッション3: 2週間後の練習（開催確定済み）
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
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
) RETURNING id INTO v_session3_id;

-- セッション4: 合宿イベント（外部公開・来月）
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '夏季強化合宿 Day1（外部参加OK）',
  '1泊2日の強化合宿。外部からのゲスト参加も大歓迎です！'||chr(10)||
  '午前・午後の2部制。宿泊込みのオプションあり。',
  '午前練習: 2000m（技術中心）'||chr(10)||
  '午後練習: 2500m（持久力中心）'||chr(10)||
  'コーチングセッション（フォーム動画分析）',
  'event',
  (now() + interval '30 days')::date + time '09:00',
  '山梨県立富士北麓公園屋内プール',
  3000, 5000,
  (now() + interval '25 days')::date + time '23:59',
  8, 20,
  '["level_intermediate", "level_advanced"]'::jsonb, false,
  true, 'open', 'published'
) RETURNING id INTO v_session4_id;

-- セッション5: 来週の土曜（外部公開・未来）
INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content,
  type, scheduled_at, location,
  member_price, guest_price,
  registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card,
  is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  'オープン練習会 - バタフライ入門',
  '初めてバタフライに挑戦したい方向けのオープン練習。'||chr(10)||'丁寧に指導しますので初心者も歓迎です。',
  'ウォームアップ 300m'||chr(10)||
  'バタフライキック基礎練習'||chr(10)||
  'ドリル練習（片手・両手）'||chr(10)||
  '50m × 5本（フォーム重視）',
  'event',
  (now() + interval '11 days')::date + time '14:00',
  '甲府市民プール',
  1500, 2000,
  (now() + interval '9 days')::date + time '23:59',
  3, 8,
  '["stroke_butterfly"]'::jsonb, false,
  true, 'open', 'published'
) RETURNING id INTO v_session5_id;

-- ============================================================
-- 参加登録（デモ用）
-- ============================================================

-- セッション1に swimmer1, swimmer3 が登録
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session1_id, v_swimmer1_id, true, 'cash', 'pending');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session1_id, v_swimmer3_id, true, 'cash', 'pending');

-- セッション2に swimmer1, swimmer4 が登録
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session2_id, v_swimmer1_id, true, 'cash', 'pending');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session2_id, v_swimmer4_id, true, 'cash', 'pending');

-- セッション3（確定済み）に swimmer1, swimmer2, swimmer3, swimmer4 全員登録
INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session3_id, v_swimmer1_id, true, 'cash', 'paid');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session3_id, v_swimmer2_id, true, 'point_card', 'paid');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session3_id, v_swimmer3_id, true, 'cash', 'paid');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session3_id, v_swimmer4_id, true, 'cash', 'paid');

-- ============================================================
-- お知らせ
-- ============================================================

INSERT INTO announcements (id, team_id, author_id, title, body, link_url)
VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '開催確定: 水曜朝練 - 個人メドレー特訓',
  format(
    '%s の「水曜朝練 - 個人メドレー特訓」が開催確定しました。',
    (now() + interval '14 days')::date
  ),
  '/teams/' || v_team_id || '/sessions/' || v_session3_id
) RETURNING id INTO v_ann1_id;

INSERT INTO announcements (id, team_id, author_id, title, body, link_url)
VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '夏季合宿の参加受付を開始しました',
  '今年も夏季強化合宿を開催します！外部からのゲスト参加も歓迎。'||chr(10)||
  '定員20名になり次第締め切りますので、お早めにご登録ください。',
  '/teams/' || v_team_id || '/sessions/' || v_session4_id
) RETURNING id INTO v_ann2_id;

-- ============================================================
-- 会費データ（今年の年会費）
-- ============================================================

-- 全レギュラー会員の年会費レコードを生成
INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status)
VALUES (v_team_id, v_swimmer1_id, 'annual', extract(year from now())::text, 5000, 'unpaid');

INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status)
VALUES (v_team_id, v_swimmer3_id, 'annual', extract(year from now())::text, 5000, 'paid');

INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at)
VALUES (v_team_id, v_swimmer4_id, 'annual', extract(year from now())::text, 5000, 'paid', now() - interval '30 days');

RAISE NOTICE 'チームデモデータ投入完了!';
RAISE NOTICE 'チーム: マウントリバー水泳クラブ (ID: %)', v_team_id;
RAISE NOTICE 'メンバー: 5名（admin 1 + member 4）';
RAISE NOTICE 'セッション: 5件（open 3 + confirmed 1, 外部公開 2件）';
RAISE NOTICE 'お知らせ: 2件';
RAISE NOTICE '会費: 3件（未払い 1 + 支払済み 2）';

END $$;
