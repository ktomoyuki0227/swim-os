-- Rangers デモデータ投入（ユーザーはAdmin APIで作成済み前提）
-- 実行方法: npx supabase db query --linked --file supabase/seed_data.sql

-- 既存テストデータのクリーンアップ
DO $$
DECLARE
  old_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO old_ids FROM auth.users
  WHERE email IN ('test1@example.com','test2@example.com','test3@example.com','test4@example.com','testnew@example.com');
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
  END IF;
END $$;

-- チーム・セッション・登録データ（UUIDをメールで動的引き当て）
DO $$
DECLARE
  v_user1 uuid;
  v_user2 uuid;
  v_user3 uuid;
  v_team_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_s1 uuid;
  v_s2 uuid;
  v_s3 uuid;
  v_s4 uuid;
  v_s5 uuid;
  v_s6 uuid;
  v_s7 uuid;
BEGIN
  SELECT id INTO v_user1 FROM auth.users WHERE email = 'test1@example.com';
  SELECT id INTO v_user2 FROM auth.users WHERE email = 'test2@example.com';
  SELECT id INTO v_user3 FROM auth.users WHERE email = 'test3@example.com';

  IF v_user1 IS NULL OR v_user2 IS NULL OR v_user3 IS NULL THEN
    RAISE EXCEPTION 'Test users not found. Create them via Admin API first.';
  END IF;

  -- チーム作成
  INSERT INTO teams (
    id, coach_id, name, description,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price, status
  ) VALUES (
    v_team_id, v_user1,
    'マウントリバー水泳クラブ',
    '山梨県甲府市を拠点とするマスターズ水泳チーム。毎週水・土曜日に甲府市民プールで練習を行っています。',
    1000, 1500, 5000, 3000, 3, 10, 9000, 'active'
  );

  -- メンバー登録
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
  VALUES (v_team_id, v_user1, 'admin', 'annual', 0);

  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
  VALUES (v_team_id, v_user2, 'member', 'annual', 0);

  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining)
  VALUES (v_team_id, v_user3, 'member', 'point_card', 7);

  -- セッション1: 水曜朝練（open）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team_id, v_user1,
    '水曜朝練 - クロール技術練習',
    '週1回の定期練習。クロールのフォーム改善に重点を置きます。',
    'アップ 400m（クロール）' || chr(10) || 'メインセット 3x200m',
    'practice', (now() + interval '7 days')::date + time '07:00', '甲府市民プール',
    1000, 1500, (now() + interval '5 days')::date + time '23:59', 3, 12,
    '[]'::jsonb, true, false, 'open', 'published'
  ) RETURNING id INTO v_s1;

  -- セッション2: 土曜スピード練習（open）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team_id, v_user1,
    '土曜スピード練習',
    '大会シーズンに向けた強化練習。スピード系のセットを中心に行います。',
    'スピードドリル 8x25m（全力）' || chr(10) || 'メインセット 3x(100m + 50m + 25m)',
    'practice', (now() + interval '10 days')::date + time '09:00', '甲府市民プール',
    1000, 1500, (now() + interval '8 days')::date + time '23:59', 5, 15,
    '["level_intermediate","level_advanced"]'::jsonb, true, false, 'open', 'published'
  ) RETURNING id INTO v_s2;

  -- セッション3: 個人メドレー特訓（confirmed）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team_id, v_user1,
    '水曜朝練 - 個人メドレー特訓',
    'マスターズ大会に向けた個人メドレーの強化練習です。',
    'メインセット 4x100m IM',
    'practice', (now() + interval '14 days')::date + time '07:00', '甲府市民プール',
    1000, 1500, (now() + interval '12 days')::date + time '23:59', 4, 12,
    '["stroke_medley"]'::jsonb, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_s3;

  -- セッション4: チームミーティング（meeting）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team_id, v_user1,
    '6月度チームミーティング',
    '夏季合宿の内容確認と今後のスケジュール調整を行います。',
    '1. 夏季合宿の詳細確認' || chr(10) || '2. 7〜8月の練習スケジュール',
    'meeting', (now() + interval '5 days')::date + time '19:00', '甲府市民プール 会議室',
    0, 0, (now() + interval '4 days')::date + time '23:59', 1, 20,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s4;

  -- セッション5: 夏季合宿（event / is_external=true）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team_id, v_user1,
    '夏季強化合宿 Day1（外部参加OK）',
    '1泊2日の強化合宿。外部からのゲスト参加も大歓迎です！',
    '午前練習: 2000m（技術中心）' || chr(10) || '午後練習: 2500m（持久力中心）',
    'event', (now() + interval '30 days')::date + time '09:00', '山梨県立富士北麓公園屋内プール',
    3000, 5000, (now() + interval '25 days')::date + time '23:59', 8, 20,
    '["level_intermediate","level_advanced"]'::jsonb, false, true, 'open', 'published'
  ) RETURNING id INTO v_s5;

  -- セッション6: キャンセル済み（cancelled）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team_id, v_user1,
    '水曜朝練 - キャンセル（雨天中止）',
    'プール施設の都合によりキャンセルとなりました。',
    'キャンセル',
    'practice', (now() - interval '7 days')::date + time '07:00', '甲府市民プール',
    1000, 1500, (now() - interval '9 days')::date + time '23:59', 3, 12,
    '[]'::jsonb, true, false, 'cancelled', 'published'
  ) RETURNING id INTO v_s6;

  -- セッション7: 下書き（draft）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team_id, v_user1,
    '【下書き】土曜特別練習',
    '内容未定。まだ公開していません。',
    '未定',
    'practice', (now() + interval '20 days')::date + time '09:00', '甲府市民プール',
    1000, 1500, (now() + interval '18 days')::date + time '23:59', 3, 10,
    '[]'::jsonb, true, false, 'open', 'draft'
  ) RETURNING id INTO v_s7;

  -- 参加登録
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s1, v_user2, true, 'cash', 'pending');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s1, v_user3, true, 'point_card', 'paid');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s2, v_user2, true, 'cash', 'paid');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s3, v_user1, true, 'cash', 'free');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s3, v_user2, true, 'cash', 'paid');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s3, v_user3, true, 'point_card', 'paid');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s4, v_user2, true, 'cash', 'free');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s4, v_user3, true, 'cash', 'free');
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES (v_s6, v_user2, true, 'cash', 'pending');

  -- 回数券購入履歴（佐藤花子）
  INSERT INTO stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, purchased_at)
  VALUES (v_team_id, v_user3, 1, 10, 9000, now() - interval '30 days');

  -- お知らせ
  INSERT INTO announcements (id, team_id, author_id, title, body)
  VALUES (gen_random_uuid(), v_team_id, v_user1, '開催確定: 水曜朝練 - 個人メドレー特訓', '開催確定しました。参加費のお支払いをお忘れなく。');
  INSERT INTO announcements (id, team_id, author_id, title, body)
  VALUES (gen_random_uuid(), v_team_id, v_user1, '夏季合宿の参加受付を開始しました', '今年も夏季強化合宿を開催します！外部からのゲスト参加も歓迎。');

  -- 会費データ
  INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at)
  VALUES (v_team_id, v_user1, 'annual', extract(year from now())::text, 5000, 'paid', now() - interval '60 days');
  INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status)
  VALUES (v_team_id, v_user2, 'annual', extract(year from now())::text, 5000, 'unpaid');
  INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at)
  VALUES (v_team_id, v_user3, 'annual', extract(year from now())::text, 5000, 'paid', now() - interval '30 days');

  RAISE NOTICE 'シード完了: user1=%, user2=%, user3=%', v_user1, v_user2, v_user3;
END $$;
