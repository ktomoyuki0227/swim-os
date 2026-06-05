-- ============================================================
-- seed.sql (UUID 置換済み)
-- ============================================================
DO $$
DECLARE
  v_instructor_id uuid := '4deeec58-9cb4-423d-81b3-1b0fd0b3c71a';
  v_swimmer1_id   uuid := '7d0f52a2-4a62-4f45-93a3-ba16dd36179a';
  v_swimmer2_id   uuid := 'b6b0e4fa-5ad5-47fa-862e-7108e0ae6f96';
  v_lesson1_id    uuid;
  v_lesson2_id    uuid;
  v_lesson3_id    uuid;
  v_lesson4_id    uuid;
BEGIN

UPDATE profiles SET role = 'member', name = '田中コーチ' WHERE id = v_instructor_id;
UPDATE profiles SET role = 'member',    name = '鈴木太郎'   WHERE id = v_swimmer1_id;
UPDATE profiles SET role = 'member',    name = '佐藤花子'   WHERE id = v_swimmer2_id;

INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (v_instructor_id, '初心者向けクロール指導', 'クロールの基本フォームを丁寧に指導します。', 3000, 5, now() + interval '7 days' + interval '10 hours', 60, '東京辰巳国際水泳場', 'published') RETURNING id INTO v_lesson1_id;

INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (v_instructor_id, 'バタフライ特訓コース', 'バタフライのキック・プル・タイミングを集中的に練習します。', 4500, 3, now() + interval '10 days' + interval '14 hours', 90, '横浜国際プール', 'published') RETURNING id INTO v_lesson2_id;

INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (v_instructor_id, 'マスターズ大会対策 個人メドレー', '大会に向けた実践練習。', 5000, 4, now() + interval '14 days' + interval '9 hours', 120, '東京アクアティクスセンター', 'published') RETURNING id INTO v_lesson3_id;

INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (v_instructor_id, '背泳ぎフォーム改善', '背泳ぎのストローク・キック・姿勢を見直すレッスンです。', 3500, 6, now() + interval '21 days' + interval '11 hours', 60, '東京辰巳国際水泳場', 'draft') RETURNING id INTO v_lesson4_id;

INSERT INTO bookings (lesson_id, swimmer_id, status, stripe_payment_intent_id)
VALUES (v_lesson1_id, v_swimmer1_id, 'confirmed', 'pi_demo_confirmed_001');

INSERT INTO bookings (lesson_id, swimmer_id, status, stripe_payment_intent_id)
VALUES (v_lesson1_id, v_swimmer2_id, 'pending', 'pi_demo_pending_001');

INSERT INTO bookings (lesson_id, swimmer_id, status, stripe_payment_intent_id)
VALUES (v_lesson2_id, v_swimmer1_id, 'confirmed', 'pi_demo_confirmed_002');

RAISE NOTICE 'seed.sql 完了: レッスン4件、予約3件';
END $$;

-- ============================================================
-- seed_teams.sql (3名バージョン)
-- ============================================================
DO $$
DECLARE
  v_instructor_id uuid := '4deeec58-9cb4-423d-81b3-1b0fd0b3c71a';
  v_swimmer1_id   uuid := '7d0f52a2-4a62-4f45-93a3-ba16dd36179a';
  v_swimmer2_id   uuid := 'b6b0e4fa-5ad5-47fa-862e-7108e0ae6f96';
  v_team_id       uuid;
  v_session1_id   uuid;
  v_session2_id   uuid;
  v_session3_id   uuid;
  v_session4_id   uuid;
  v_session5_id   uuid;
BEGIN

INSERT INTO teams (
  id, coach_id, name, description,
  default_member_price, default_guest_price,
  annual_fee_amount, monthly_fee_amount,
  cancellation_days, point_card_count, point_card_price,
  status
) VALUES (
  gen_random_uuid(), v_instructor_id,
  'マウントリバー水泳クラブ',
  '山梨県甲府市を拠点とするマスターズ水泳チーム。毎週水・土曜日に甲府市民プールで練習を行っています。',
  1000, 1500, 5000, NULL, 3, 10, 9000, 'active'
) RETURNING id INTO v_team_id;

INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
VALUES (v_team_id, v_instructor_id, 'admin', 'regular', '["level_advanced", "stroke_freestyle", "stroke_medley", "purpose_competitive"]', 0);

INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
VALUES (v_team_id, v_swimmer1_id, 'member', 'regular', '["level_intermediate", "stroke_freestyle", "stroke_backstroke", "purpose_health"]', 0);

INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
VALUES (v_team_id, v_swimmer2_id, 'member', 'point_card', '["level_beginner", "stroke_freestyle", "purpose_health"]', 7);

INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content, type, scheduled_at, location,
  member_price, guest_price, registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card, is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '水曜朝練 - クロール技術練習', '週1回の定期練習。クロールのフォーム改善に重点を置きます。',
  'アップ 400m → キック 4×50m → プル 4×100m → ドリル 6×50m → メイン 3×200m → ダウン 200m',
  'practice', (now() + interval '7 days')::date + time '07:00', '甲府市民プール',
  1000, 1500, (now() + interval '5 days')::date + time '23:59', 3, 12,
  '[]'::jsonb, true, false, 'open', 'published'
) RETURNING id INTO v_session1_id;

INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content, type, scheduled_at, location,
  member_price, guest_price, registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card, is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '土曜スピード練習', '大会シーズンに向けた強化練習。',
  'アップ 600m → スピードドリル 8×25m → メイン 3×(100m+50m+25m) → インターバル 10×50m → ダウン 300m',
  'practice', (now() + interval '10 days')::date + time '09:00', '甲府市民プール',
  1000, 1500, (now() + interval '8 days')::date + time '23:59', 5, 15,
  '["level_intermediate", "level_advanced"]'::jsonb, true, false, 'open', 'published'
) RETURNING id INTO v_session2_id;

INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content, type, scheduled_at, location,
  member_price, guest_price, registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card, is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '水曜朝練 - 個人メドレー特訓', 'マスターズ大会に向けた個人メドレーの強化練習です。',
  'アップ 500m → ドリル 4×75m → ターン 16×25m → メイン 4×100m IM → ダウン 200m',
  'practice', (now() + interval '14 days')::date + time '07:00', '甲府市民プール',
  1000, 1500, (now() + interval '12 days')::date + time '23:59', 4, 12,
  '["stroke_medley"]'::jsonb, true, false, 'confirmed', 'published'
) RETURNING id INTO v_session3_id;

INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content, type, scheduled_at, location,
  member_price, guest_price, registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card, is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '夏季強化合宿 Day1（外部参加OK）', '1泊2日の強化合宿。外部からのゲスト参加も大歓迎です！',
  '午前: 2000m（技術中心）→ 午後: 2500m（持久力中心）→ フォーム動画分析',
  'event', (now() + interval '30 days')::date + time '09:00', '山梨県立富士北麓公園屋内プール',
  3000, 5000, (now() + interval '25 days')::date + time '23:59', 8, 20,
  '["level_intermediate", "level_advanced"]'::jsonb, false, true, 'open', 'published'
) RETURNING id INTO v_session4_id;

INSERT INTO practice_sessions (
  id, team_id, coach_id, title, description, content, type, scheduled_at, location,
  member_price, guest_price, registration_deadline, min_participants, max_participants,
  target_tags, allow_point_card, is_external, session_status, status
) VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  'オープン練習会 - バタフライ入門', '初めてバタフライに挑戦したい方向けのオープン練習。',
  'ウォームアップ 300m → バタフライキック基礎 → ドリル（片手・両手） → 50m×5本',
  'event', (now() + interval '11 days')::date + time '14:00', '甲府市民プール',
  1500, 2000, (now() + interval '9 days')::date + time '23:59', 3, 8,
  '["stroke_butterfly"]'::jsonb, false, true, 'open', 'published'
) RETURNING id INTO v_session5_id;

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session1_id, v_swimmer1_id, true, 'cash', 'pending');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session2_id, v_swimmer1_id, true, 'cash', 'pending');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session3_id, v_swimmer1_id, true, 'cash', 'paid');

INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
VALUES (v_session3_id, v_swimmer2_id, true, 'point_card', 'paid');

INSERT INTO announcements (id, team_id, author_id, title, body, link_url)
VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '開催確定: 水曜朝練 - 個人メドレー特訓',
  '個人メドレー特訓が開催確定しました。奮ってご参加ください。',
  '/teams/' || v_team_id::text || '/sessions/' || v_session3_id::text
);

INSERT INTO announcements (id, team_id, author_id, title, body, link_url)
VALUES (
  gen_random_uuid(), v_team_id, v_instructor_id,
  '夏季合宿の参加受付を開始しました',
  '今年も夏季強化合宿を開催します！外部からのゲスト参加も歓迎。定員20名になり次第締め切ります。',
  '/teams/' || v_team_id::text || '/sessions/' || v_session4_id::text
);

INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status)
VALUES (v_team_id, v_swimmer1_id, 'annual', extract(year from now())::text, 5000, 'unpaid');

RAISE NOTICE 'seed_teams.sql 完了: チーム・メンバー3名・セッション5件・お知らせ2件・会費1件';
END $$;
