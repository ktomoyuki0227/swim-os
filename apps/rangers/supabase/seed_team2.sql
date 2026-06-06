-- Rangers 東京マスターズ水泳クラブ デモデータ
-- 前提: seed_users.mjs + seed_data.sql を実行済みであること
-- 実行: npx supabase db query --linked --file supabase/seed_team2.sql
--
-- 内容:
--   1. マウントリバー水泳クラブの avatar_url を設定
--   2. 東京マスターズ水泳クラブを新規作成
--   3. 鈴木太郎（test2）を admin として追加

DO $$
DECLARE
  v_user1  uuid;  -- 山田健太 (test1@example.com) — チームコーチ
  v_user2  uuid;  -- 鈴木太郎 (test2@example.com) — 東京マスターズの admin
  v_user3  uuid;  -- 佐藤花子 (test3@example.com) — member

  v_team2_id  uuid;
  v_s1        uuid;
  v_s2        uuid;
  v_s3        uuid;
  v_s4        uuid;
BEGIN
  -- UUIDをメールアドレスから動的取得
  SELECT id INTO v_user1 FROM auth.users WHERE email = 'test1@example.com';
  SELECT id INTO v_user2 FROM auth.users WHERE email = 'test2@example.com';
  SELECT id INTO v_user3 FROM auth.users WHERE email = 'test3@example.com';

  IF v_user1 IS NULL OR v_user2 IS NULL OR v_user3 IS NULL THEN
    RAISE EXCEPTION 'テストユーザーが見つかりません。seed_users.mjs を実行してください。';
  END IF;

  -- ============================================================
  -- 既存チーム: マウントリバー水泳クラブ の avatar_url を設定
  -- ============================================================
  UPDATE teams
  SET avatar_url = 'https://picsum.photos/seed/mountriver/400'
  WHERE name = 'マウントリバー水泳クラブ'
    AND coach_id = v_user1;

  -- ============================================================
  -- 新規チーム: 東京マスターズ水泳クラブ
  -- ============================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    status
  ) VALUES (
    gen_random_uuid(), v_user1,
    '東京マスターズ水泳クラブ',
    '東京都江東区を拠点とするマスターズ水泳チーム。'||chr(10)||
    '辰巳国際水泳場を主な練習場所とし、月・木・日に活動中。',
    'https://picsum.photos/seed/tokyomasters/400',
    1200, 2000,
    6000, NULL,
    2, 10, 10000,
    'active'
  ) RETURNING id INTO v_team2_id;

  -- 鈴木太郎: マウントリバーでの role を member → admin に変更
  UPDATE team_members
  SET role = 'admin'
  WHERE swimmer_id = v_user2
    AND team_id = (SELECT id FROM teams WHERE name = 'マウントリバー水泳クラブ' AND coach_id = v_user1);

  -- 山田健太: 東京マスターズの coach として admin に
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
  VALUES (v_team2_id, v_user1, 'admin', 'regular',
    '["level_advanced","stroke_freestyle","stroke_medley","purpose_competitive"]', 0);

  -- 鈴木太郎: 東京マスターズは member として追加
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
  VALUES (v_team2_id, v_user2, 'member', 'regular',
    '["level_intermediate","stroke_freestyle","stroke_backstroke","purpose_health"]', 0);

  -- 佐藤花子: レギュラー会員として追加
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, tags, stamp_remaining)
  VALUES (v_team2_id, v_user3, 'member', 'regular',
    '["level_beginner","stroke_breaststroke","purpose_health"]', 0);

  -- ============================================================
  -- セッション（マウントリバーとずらした日程: +3/+6/+8/+17日）
  -- ============================================================

  -- セッション1: 月曜朝練（+3日）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2_id, v_user1,
    '月曜朝練 - 持久力強化',
    '週始めの定期練習。距離をしっかり泳いで持久力を養います。',
    'アップ 600m'||chr(10)||'キック 6×50m'||chr(10)||'メインセット 2×400m（LT強度）'||chr(10)||'ダウン 200m',
    'practice', (now() + interval '3 days')::date + time '06:30', '辰巳国際水泳場',
    1200, 2000, (now() + interval '2 days')::date + time '23:59', 4, 15,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s1;

  -- セッション2: 木曜夜練（+6日）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2_id, v_user1,
    '木曜夜練 - スプリント特化',
    '短距離スピードを徹底強化。50m・100mのタイムアップを目指します。',
    'アップ 500m'||chr(10)||'スプリント 10×25m（全力）'||chr(10)||'メインセット 5×100m（90%強度）'||chr(10)||'ダウン 300m',
    'practice', (now() + interval '6 days')::date + time '19:30', '辰巳国際水泳場',
    1200, 2000, (now() + interval '5 days')::date + time '23:59', 5, 12,
    '["level_intermediate","level_advanced"]'::jsonb, false, false, 'confirmed', 'published'
  ) RETURNING id INTO v_s2;

  -- セッション3: 日曜テクニカル練習（+8日）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2_id, v_user1,
    '日曜テクニカル練習',
    '泳法の細部を丁寧に修正。ビデオ撮影で自分のフォームを確認できます。',
    'アップ 400m'||chr(10)||'テクニカルドリル（各種目）'||chr(10)||'フォーム確認 8×50m'||chr(10)||'ダウン 200m',
    'practice', (now() + interval '8 days')::date + time '09:00', '辰巳国際水泳場',
    1200, 2000, (now() + interval '7 days')::date + time '23:59', 3, 10,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s3;

  -- セッション4: 月例記録会（+17日・外部公開）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content,
    type, scheduled_at, location,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2_id, v_user1,
    '東京マスターズ月例記録会',
    '毎月恒例の記録会。外部からの参加も歓迎！全種目エントリー可能。',
    '50m・100m・200m 各種目エントリー可'||chr(10)||'8時受付、9時スタート予定',
    'competition', (now() + interval '17 days')::date + time '08:00', '辰巳国際水泳場',
    2000, 3000, (now() + interval '14 days')::date + time '23:59', 10, 40,
    '[]'::jsonb, false, true, 'open', 'published'
  ) RETURNING id INTO v_s4;

  -- ============================================================
  -- 参加登録（鈴木太郎: セッション1・2）
  -- ============================================================
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
  VALUES (v_s1, v_user2, true, 'cash', 'pending');

  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
  VALUES (v_s2, v_user2, true, 'cash', 'paid');

  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status)
  VALUES (v_s2, v_user3, true, 'cash', 'pending');

  -- ============================================================
  -- 会費
  -- ============================================================
  INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status)
  VALUES (v_team2_id, v_user2, 'annual', extract(year from now())::text, 6000, 'unpaid');

  RAISE NOTICE '東京マスターズ水泳クラブ 投入完了!';
  RAISE NOTICE 'チームID: %', v_team2_id;
  RAISE NOTICE 'マウントリバー: 鈴木太郎を member → admin に更新';
  RAISE NOTICE 'メンバー: 3名（admin 1: 山田健太 + member 2: 鈴木太郎・佐藤花子）';
  RAISE NOTICE 'セッション: 4件';

END $$;
