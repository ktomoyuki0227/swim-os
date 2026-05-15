-- Rangers デモ用テストデータ
-- 注意: Supabase Auth でユーザーを作成した後に実行する
-- 先に Auth > Users から以下のテストユーザーを手動作成すること:
--   1. instructor@example.com (パスワード: test1234)
--   2. swimmer1@example.com (パスワード: test1234)
--   3. swimmer2@example.com (パスワード: test1234)
--
-- 作成後、各ユーザーの UUID を下の変数に置き換えて実行する

-- ============================================
-- STEP 1: ここにユーザーの UUID を入れる
-- ============================================
-- Supabase Dashboard > Authentication > Users で確認

DO $$
DECLARE
  v_instructor_id uuid := '00000000-0000-0000-0000-000000000001'; -- ← instructor@example.com の UUID に置き換え
  v_swimmer1_id   uuid := '00000000-0000-0000-0000-000000000002'; -- ← swimmer1@example.com の UUID に置き換え
  v_swimmer2_id   uuid := '00000000-0000-0000-0000-000000000003'; -- ← swimmer2@example.com の UUID に置き換え
  v_lesson1_id    uuid;
  v_lesson2_id    uuid;
  v_lesson3_id    uuid;
  v_lesson4_id    uuid;
BEGIN

-- ============================================
-- STEP 2: プロフィールのロール・名前を設定
-- ============================================
UPDATE profiles SET role = 'instructor', name = '田中コーチ' WHERE id = v_instructor_id;
UPDATE profiles SET role = 'swimmer',    name = '鈴木太郎'   WHERE id = v_swimmer1_id;
UPDATE profiles SET role = 'swimmer',    name = '佐藤花子'   WHERE id = v_swimmer2_id;

-- ============================================
-- STEP 3: レッスンを作成
-- ============================================

-- レッスン1: 1週間後
INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (
  v_instructor_id,
  '初心者向けクロール指導',
  'クロールの基本フォームを丁寧に指導します。'||chr(10)||'泳ぎに自信がない方も安心してご参加ください。'||chr(10)||chr(10)||'持ち物: 水着、ゴーグル、タオル',
  3000, 5,
  now() + interval '7 days' + interval '10 hours',
  60, '東京辰巳国際水泳場', 'published'
) RETURNING id INTO v_lesson1_id;

-- レッスン2: 10日後
INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (
  v_instructor_id,
  'バタフライ特訓コース',
  'バタフライのキック・プル・タイミングを集中的に練習します。'||chr(10)||'クロール25m以上泳げる方が対象です。',
  4500, 3,
  now() + interval '10 days' + interval '14 hours',
  90, '横浜国際プール', 'published'
) RETURNING id INTO v_lesson2_id;

-- レッスン3: 2週間後
INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (
  v_instructor_id,
  'マスターズ大会対策 個人メドレー',
  '大会に向けた実践練習。ターン・ペース配分を重点的にトレーニングします。',
  5000, 4,
  now() + interval '14 days' + interval '9 hours',
  120, '東京アクアティクスセンター', 'published'
) RETURNING id INTO v_lesson3_id;

-- レッスン4: 下書き（非公開）
INSERT INTO lessons (instructor_id, title, description, price, capacity, scheduled_at, duration_minutes, location, status)
VALUES (
  v_instructor_id,
  '背泳ぎフォーム改善',
  '背泳ぎのストローク・キック・姿勢を見直すレッスンです。',
  3500, 6,
  now() + interval '21 days' + interval '11 hours',
  60, '東京辰巳国際水泳場', 'draft'
) RETURNING id INTO v_lesson4_id;

-- ============================================
-- STEP 4: 予約を作成（デモ用）
-- ============================================

-- swimmer1 がレッスン1を予約（確定済み）
INSERT INTO bookings (lesson_id, swimmer_id, status, stripe_payment_intent_id)
VALUES (v_lesson1_id, v_swimmer1_id, 'confirmed', 'pi_demo_confirmed_001');

-- swimmer2 がレッスン1を予約（確認待ち）
INSERT INTO bookings (lesson_id, swimmer_id, status, stripe_payment_intent_id)
VALUES (v_lesson1_id, v_swimmer2_id, 'pending', 'pi_demo_pending_001');

-- swimmer1 がレッスン2も予約（確定済み）
INSERT INTO bookings (lesson_id, swimmer_id, status, stripe_payment_intent_id)
VALUES (v_lesson2_id, v_swimmer1_id, 'confirmed', 'pi_demo_confirmed_002');

RAISE NOTICE 'テストデータ投入完了!';
RAISE NOTICE 'レッスン4件（公開3 + 下書き1）、予約3件を作成しました。';

END $$;
