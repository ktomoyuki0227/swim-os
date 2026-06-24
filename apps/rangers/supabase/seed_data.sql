-- ============================================================
-- Rangers デモデータ（完全版 v2 — 2026-06-24）
-- 実行方法: npx supabase db query --linked --file supabase/seed_data.sql
-- ============================================================
--
-- アカウント構成と体験できるロール:
--   test1@example.com (山田 健太)   — 両チームの admin（コーチ視点フル体験）
--   test2@example.com (鈴木 太郎)   — チーム1 admin / チーム2 member（管理者・メンバー両方）
--   test3@example.com (佐藤 花子)   — チーム1 point_card / チーム2 monthly（会費バリエーション）
--   test4@example.com (田中 新太郎) — チーム1 annual member / チーム2 admin（両視点）
--
-- チーム構成:
--   チーム1: マウントリバー水泳クラブ — 年会費 + 回数券 + セッション参加費
--   チーム2: 東京マスターズ水泳クラブ — 年会費 + 月謝 + セッション参加費
--
-- データ量:
--   セッション: チーム1×7件 + チーム2×5件 = 計12件
--   参加登録: 計20件（pending/paid/free/point_card バリエーション）
--   お知らせ: 各2件 = 計4件
--   会費: チーム1×3件 + チーム2×4件 = 計7件（paid/unpaid/monthly）
--   回数券購入履歴: 1件
--
-- ⚠️ Stripe カード登録について:
--   stripe_payment_method_id は Stripe API（SetupIntent フロー）が必要なため
--   SQL では設定できません。デモ時は「カードが登録されていません」と表示されます。
--   実際のカード登録はオンボーディングまたは /payments ページから行ってください。
--   セッション参加費の支払い方法は cash / point_card で登録しています。

-- ============================================================
-- PHASE 1: クリーンアップ（test1 がコーチの全チームを対象）
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';
  v_team_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_team_ids
  FROM teams WHERE coach_id = v_user1;

  IF v_team_ids IS NOT NULL THEN
    DELETE FROM session_registrations
      WHERE session_id IN (
        SELECT id FROM practice_sessions WHERE team_id = ANY(v_team_ids)
      );
    DELETE FROM practice_sessions  WHERE team_id = ANY(v_team_ids);
    DELETE FROM announcements      WHERE team_id = ANY(v_team_ids);
    DELETE FROM membership_fees    WHERE team_id = ANY(v_team_ids);
    DELETE FROM stamp_purchases    WHERE team_id = ANY(v_team_ids);
    DELETE FROM team_members       WHERE team_id = ANY(v_team_ids);
    DELETE FROM teams              WHERE id = ANY(v_team_ids);
  END IF;

  RAISE NOTICE 'クリーンアップ完了';
END $$;

-- ============================================================
-- PHASE 2: プロフィール更新（4アカウント — 全フィールド設定）
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';
  v_user2  uuid := '9d30728f-96e9-4415-9823-97040111ad22';
  v_user3  uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a';
  v_user4  uuid := '8e538fba-2637-4abf-aa9f-5b784cb2f561';
BEGIN

  -- ──────────────────────────────────────────────────────────
  -- test1: 山田 健太（上級 / コーチ / マスターズ大会常連）
  -- 体験: 両チームの admin 視点、コーチとしてのフル操作
  -- ──────────────────────────────────────────────────────────
  UPDATE profiles SET
    name                      = '山田 健太',
    furigana                  = 'ヤマダ ケンタ',
    gender                    = 'male',
    birthday                  = '1975-03-15',
    phone                     = '09011112222',
    address                   = '山梨県甲府市丸の内1-1-1 ハイツ甲府101',
    emergency_contact         = '09033334444',
    emergency_contact_name    = '山田 幸子',
    emergency_contact_relation = '配偶者',
    swimwear_size             = 'M',
    masters_registered        = true,
    masters_number            = 'M-2005-001234',
    jsa_registered            = true,
    jsa_number                = 'JSA-1998-005678',
    level                     = '上級',
    swimmer_type              = 'マスターズ',
    swim_disciplines          = ARRAY['競泳'],
    specialties               = ARRAY['クロール', 'バタフライ', '個人メドレー', 'マスターズ水泳'],
    swimming_goals            = ARRAY['競技・タイム向上', 'マスターズ大会出場'],
    participation_styles      = ARRAY['チーム練習', '大会・記録会', '合宿・遠征'],
    prefectures               = ARRAY['山梨県', '東京都'],
    bio                       = '甲府市出身。20代から水泳を本格的に始め、マスターズ水泳大会に毎年出場。得意種目はクロールと個人メドレー。チームの仲間と一緒に楽しみながら記録を追いかけています。',
    career                    = '1998年より水泳指導を開始。山梨県水泳協会公認コーチ資格取得。マウントリバー水泳クラブ代表として15年以上にわたりチームを運営。',
    achievements              = '2018年 全日本マスターズ水泳選手権 50m クロール 第3位（55〜59歳区分）\n2022年 山梨マスターズ記録会 200m 個人メドレー 優勝\n指導実績: マスターズ大会出場延べ80名以上',
    target_ages               = ARRAY['大人（19歳〜）', 'シニア（60歳〜）'],
    onboarding_completed_at   = now() - interval '2 years'
  WHERE id = v_user1;

  -- ──────────────────────────────────────────────────────────
  -- test2: 鈴木 太郎（中級 / チーム1 admin・チーム2 member）
  -- 体験: 管理者と一般メンバー両方の視点を切り替えられる
  -- ──────────────────────────────────────────────────────────
  UPDATE profiles SET
    name                      = '鈴木 太郎',
    furigana                  = 'スズキ タロウ',
    gender                    = 'male',
    birthday                  = '1982-07-22',
    phone                     = '09055556666',
    address                   = '東京都新宿区西新宿2-3-4 グランドビュー305',
    emergency_contact         = '09077778888',
    emergency_contact_name    = '鈴木 恵子',
    emergency_contact_relation = '配偶者',
    swimwear_size             = 'L',
    masters_registered        = true,
    masters_number            = 'M-2010-007890',
    jsa_registered            = false,
    jsa_number                = NULL,
    level                     = '中級',
    swimmer_type              = 'マスターズ',
    swim_disciplines          = ARRAY['競泳'],
    specialties               = ARRAY['クロール', '平泳ぎ', 'マスターズ水泳'],
    swimming_goals            = ARRAY['マスターズ大会出場', '健康維持'],
    participation_styles      = ARRAY['チーム練習', 'パーソナルレッスン', '大会・記録会'],
    prefectures               = ARRAY['東京都', '神奈川県'],
    bio                       = '東京都在住。学生時代は水泳部に所属し、社会人になってからブランクがありましたが、40歳を機に復帰。現在は週2回の練習を欠かさず、タイム改善を目標に頑張っています。',
    career                    = '大学水泳部出身（平泳ぎ専門）。20年のブランクを経て2010年にマスターズ水泳に参加。現在はクロールにも挑戦中。',
    achievements              = '2021年 東京マスターズ記録会 100m 平泳ぎ 自己ベスト更新',
    target_ages               = ARRAY['大人（19歳〜）'],
    onboarding_completed_at   = now() - interval '1 year'
  WHERE id = v_user2;

  -- ──────────────────────────────────────────────────────────
  -- test3: 佐藤 花子（初級 / チーム1 point_card・チーム2 monthly）
  -- 体験: 回数券・月謝という異なる会費タイプの確認
  -- ──────────────────────────────────────────────────────────
  UPDATE profiles SET
    name                      = '佐藤 花子',
    furigana                  = 'サトウ ハナコ',
    gender                    = 'female',
    birthday                  = '1990-11-05',
    phone                     = '09012341234',
    address                   = '千葉県千葉市中央区中央4-5-6 サニーハイツ201',
    emergency_contact         = '04356789012',
    emergency_contact_name    = '佐藤 明子',
    emergency_contact_relation = '母',
    swimwear_size             = 'S',
    masters_registered        = false,
    masters_number            = NULL,
    jsa_registered            = false,
    jsa_number                = NULL,
    level                     = '初級',
    swimmer_type              = NULL,
    swim_disciplines          = ARRAY['競泳'],
    specialties               = ARRAY['平泳ぎ', 'バタフライ'],
    swimming_goals            = ARRAY['健康維持', '楽しみ・趣味'],
    participation_styles      = ARRAY['チーム練習'],
    prefectures               = ARRAY['千葉県'],
    bio                       = '健康維持のために水泳を始めました。平泳ぎが得意です。週1〜2回のペースで楽しく続けることが目標です。みなさんと一緒に上達していけたら嬉しいです！',
    career                    = '2020年に水泳教室に通い始め、現在はチーム練習に参加中。初心者ながら着実に上達中。',
    achievements              = NULL,
    target_ages               = NULL,
    onboarding_completed_at   = now() - interval '6 months'
  WHERE id = v_user3;

  -- ──────────────────────────────────────────────────────────
  -- test4: 田中 新太郎（中級 / チーム1 member・チーム2 admin）
  -- 体験: チーム2でのコーチ視点（管理機能の全操作）
  -- ──────────────────────────────────────────────────────────
  UPDATE profiles SET
    name                      = '田中 新太郎',
    furigana                  = 'タナカ シンタロウ',
    gender                    = 'male',
    birthday                  = '1978-04-30',
    phone                     = '09098765432',
    address                   = '神奈川県横浜市西区みなとみらい1-2-3 タワーマンション1501',
    emergency_contact         = '09087654321',
    emergency_contact_name    = '田中 道子',
    emergency_contact_relation = '配偶者',
    swimwear_size             = 'L',
    masters_registered        = true,
    masters_number            = 'M-2015-003456',
    jsa_registered            = false,
    jsa_number                = NULL,
    level                     = '中級',
    swimmer_type              = 'マスターズ',
    swim_disciplines          = ARRAY['競泳'],
    specialties               = ARRAY['クロール', '背泳ぎ'],
    swimming_goals            = ARRAY['健康維持', '水泳再開（ブランクあり）', 'マスターズ大会出場'],
    participation_styles      = ARRAY['チーム練習', '自主練'],
    prefectures               = ARRAY['神奈川県'],
    bio                       = '学生時代は競泳をやっていましたが、10年以上のブランクを経て水泳に復帰。現在はマスターズ大会を目標に練習中。クロールと背泳ぎを中心に取り組んでいます。',
    career                    = '高校・大学で競泳に打ち込む（背泳ぎ専門）。社会人を経て2015年にマスターズ水泳へ復帰。東京マスターズ水泳クラブのコーチ資格取得（2020年）。',
    achievements              = '2023年 東京マスターズ記録会 50m 背泳ぎ 第2位（45〜49歳区分）',
    target_ages               = ARRAY['大人（19歳〜）', 'シニア（60歳〜）'],
    onboarding_completed_at   = now() - interval '3 months'
  WHERE id = v_user4;

  RAISE NOTICE 'プロフィール更新完了（全フィールド設定済み）';
END $$;

-- ============================================================
-- PHASE 3: チーム・メンバー・セッション・各種データ作成
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';  -- 山田 健太
  v_user2  uuid := '9d30728f-96e9-4415-9823-97040111ad22';  -- 鈴木 太郎
  v_user3  uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a';  -- 佐藤 花子
  v_user4  uuid := '8e538fba-2637-4abf-aa9f-5b784cb2f561';  -- 田中 新太郎

  -- 固定チームID（毎回同じ ID で再作成）
  v_team1  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_team2  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  -- セッションID（チーム1: v_s1_x / チーム2: v_s2_x）
  v_s1_1 uuid; v_s1_2 uuid; v_s1_3 uuid; v_s1_4 uuid;
  v_s1_5 uuid; v_s1_6 uuid; v_s1_7 uuid;
  v_s2_1 uuid; v_s2_2 uuid; v_s2_3 uuid; v_s2_4 uuid; v_s2_5 uuid;
BEGIN

  -- ==========================================================
  -- チーム1: マウントリバー水泳クラブ
  -- 料金体系: セッション参加費（現金/回数券） + 年会費
  -- ==========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    activity_area, status,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone
  ) VALUES (
    v_team1, v_user1,
    'マウントリバー水泳クラブ',
    '山梨県甲府市を拠点とするマスターズ水泳チーム。毎週水・土曜日に甲府市民プールで練習。大会参加にも積極的なチームです。初心者から上級者まで歓迎！',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/mountriver-icon.jpg',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/mountriver-cover.jpg',
    1000, 1500,
    5000, NULL,
    3, 10, 9000,
    true, true, false, true,
    '山梨県甲府市', 'active',
    '週2回', ARRAY['水', '土'], '甲府市民プール（山梨県甲府市北口）',
    'info@mountriver-swim.example.jp', '0552011234'
  );

  -- チーム1 メンバー（4パターン: admin×2 / annual / point_card）
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team1, v_user1, 'admin',  'annual',     0, now() - interval '2 years'),
    (v_team1, v_user2, 'admin',  'annual',     0, now() - interval '1 year'),
    (v_team1, v_user3, 'member', 'point_card', 5, now() - interval '6 months'),
    (v_team1, v_user4, 'member', 'annual',     0, now() - interval '3 months');

  -- ==========================================================
  -- チーム2: 東京マスターズ水泳クラブ
  -- 料金体系: セッション参加費（現金） + 年会費 + 月謝
  -- ==========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    activity_area, status,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone
  ) VALUES (
    v_team2, v_user1,
    '東京マスターズ水泳クラブ',
    '東京都江東区を拠点とするマスターズ水泳チーム。辰巳国際水泳場で月・木・日に活動中。初心者から競技者まで幅広く受け入れています。月例記録会も毎月開催！',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/tokyomasters-icon.jpg',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/tokyomasters-cover.jpg',
    1200, 2000,
    6000, 3000,
    2, 10, 10000,
    true, true, true, false,
    '東京都江東区', 'active',
    '週3回', ARRAY['月', '木', '日'], '辰巳国際水泳場（東京都江東区辰巳2-2-1）',
    'contact@tokyo-masters-swim.example.jp', '0335551234'
  );

  -- チーム2 メンバー（admin×2 / annual / monthly — test2とtest4のロールが逆になる設計）
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team2, v_user1, 'admin',  'annual',   0, now() - interval '1 year 6 months'),
    (v_team2, v_user2, 'member', 'annual',   0, now() - interval '8 months'),
    (v_team2, v_user3, 'member', 'monthly',  0, now() - interval '4 months'),
    (v_team2, v_user4, 'admin',  'annual',   0, now() - interval '2 months');

  -- ==========================================================
  -- セッション: チーム1（マウントリバー）7件
  -- ==========================================================

  -- S1-1: 水曜朝練（open / +7日 / 全員向け / 回数券OK）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team1, v_user1,
    '水曜朝練 - クロール技術練習',
    '週1回の定期練習。クロールのフォーム改善に重点を置きます。初級者も丁寧にフォロー。',
    'アップ 400m（クロール）'                    || chr(10) ||
    'キック練習 4×50m（板キック）'               || chr(10) ||
    'プル練習 4×100m（パドル）'                  || chr(10) ||
    'テクニカルドリル 6×50m'                    || chr(10) ||
    'メインセット 3×200m（ペース泳）'            || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '7 days')::date + time '07:00', '甲府市民プール',
    1000, 1500,
    (now() + interval '5 days')::date + time '23:59', 3, 12,
    '[]'::jsonb, true, false, 'open', 'published'
  ) RETURNING id INTO v_s1_1;

  -- S1-2: 土曜スピード練習（open / +10日 / 中級・上級向け / 回数券OK）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team1, v_user1,
    '土曜スピード練習',
    '大会シーズンに向けた強化練習。スピード系のセットを中心に行います。中級以上推奨。',
    'アップ 600m（IM順）'                          || chr(10) ||
    'スピードドリル 8×25m（全力）'                 || chr(10) ||
    'メインセット 3×(100m + 50m + 25m) 全力'      || chr(10) ||
    'インターバル 10×50m (rest :30)'              || chr(10) ||
    'ダウン 300m',
    'practice',
    (now() + interval '10 days')::date + time '09:00', '甲府市民プール',
    1000, 1500,
    (now() + interval '8 days')::date + time '23:59', 5, 15,
    '["level_intermediate","level_advanced"]'::jsonb, true, false, 'open', 'published'
  ) RETURNING id INTO v_s1_2;

  -- S1-3: 個人メドレー特訓（confirmed / +14日）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team1, v_user1,
    '水曜朝練 - 個人メドレー特訓',
    'マスターズ大会に向けた個人メドレーの強化練習。開催確定済みです。',
    'アップ 500m（IM）'                  || chr(10) ||
    'ドリル 4×75m（各種目25m）'          || chr(10) ||
    'ターン練習 16×25m（各種目×4）'      || chr(10) ||
    'メインセット 4×100m IM'            || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '14 days')::date + time '07:00', '甲府市民プール',
    1000, 1500,
    (now() + interval '12 days')::date + time '23:59', 4, 12,
    '["stroke_medley"]'::jsonb, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_s1_3;

  -- S1-4: 夏季強化合宿 Day1（open / +30日 / 外部公開 / event）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, end_at, location, meeting_point,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team1, v_user1,
    '夏季強化合宿 Day1（外部参加OK）',
    '1泊2日の強化合宿。外部からのゲスト参加も大歓迎！午前・午後の2部制で集中的に取り組みます。',
    '午前練習: 2000m（技術中心）'                           || chr(10) ||
    '午後練習: 2500m（持久力中心）'                          || chr(10) ||
    'コーチングセッション（フォーム動画分析）',
    'event',
    (now() + interval '30 days')::date + time '09:00',
    (now() + interval '31 days')::date + time '17:00',
    '山梨県立富士北麓公園屋内プール',
    '河口湖駅 南口 集合',
    3000, 5000,
    (now() + interval '25 days')::date + time '23:59', 8, 20,
    '["level_intermediate","level_advanced"]'::jsonb, false, true, 'open', 'published'
  ) RETURNING id INTO v_s1_4;

  -- S1-5: バタフライ入門オープン練習（open / +11日 / 外部公開 / event）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team1, v_user1,
    'オープン練習会 - バタフライ入門',
    '初めてバタフライに挑戦したい方向けのオープン練習。丁寧に指導しますので初心者も大歓迎。',
    'ウォームアップ 300m'                       || chr(10) ||
    'バタフライキック基礎練習'                   || chr(10) ||
    'ドリル練習（片手・両手）'                   || chr(10) ||
    '50m × 5本（フォーム重視）',
    'event',
    (now() + interval '11 days')::date + time '14:00', '甲府市民プール',
    1500, 2000,
    (now() + interval '9 days')::date + time '23:59', 3, 8,
    '["stroke_butterfly"]'::jsonb, false, true, 'open', 'published'
  ) RETURNING id INTO v_s1_5;

  -- S1-6: キャンセルされた過去のセッション（cancelled / -7日）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team1, v_user1,
    '水曜朝練 - キャンセル（プール設備点検）',
    'プール施設の定期点検のためキャンセルとなりました。次回は通常通り開催予定。',
    'キャンセル',
    'practice',
    (now() - interval '7 days')::date + time '07:00', '甲府市民プール',
    1000, 1500,
    (now() - interval '9 days')::date + time '23:59', 3, 12,
    '[]'::jsonb, true, false, 'cancelled', 'published'
  ) RETURNING id INTO v_s1_6;

  -- S1-7: チームミーティング（open / +5日 / 無料）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team1, v_user1,
    '6月度チームミーティング',
    '夏季合宿の詳細確認と7〜8月スケジュール調整。大会エントリー希望者の確認も行います。全員参加推奨。',
    '1. 夏季合宿の詳細（場所・日程・費用）確認' || chr(10) ||
    '2. 7〜8月の練習スケジュール調整'           || chr(10) ||
    '3. 大会エントリー希望者の確認',
    'meeting',
    (now() + interval '5 days')::date + time '19:00', '甲府市民プール 会議室',
    0, 0,
    (now() + interval '4 days')::date + time '23:59', 1, 20,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s1_7;

  -- ==========================================================
  -- セッション: チーム2（東京マスターズ）5件
  -- ==========================================================

  -- S2-1: 月曜朝練（open / +3日 / 全員向け）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2, v_user1,
    '月曜朝練 - 持久力強化',
    '週始めの定期練習。距離をしっかり泳いで持久力を養います。',
    'アップ 600m'                           || chr(10) ||
    'キック 6×50m'                          || chr(10) ||
    'メインセット 2×400m（LT強度）'          || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '3 days')::date + time '06:30', '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '2 days')::date + time '23:59', 4, 15,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s2_1;

  -- S2-2: 木曜夜練（confirmed / +6日 / 中級・上級向け）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2, v_user1,
    '木曜夜練 - スプリント特化',
    '短距離スピードを徹底強化。50m・100mのタイムアップを目指します。開催確定済み。',
    'アップ 500m'                           || chr(10) ||
    'スプリント 10×25m（全力）'             || chr(10) ||
    'メインセット 5×100m（90%強度）'        || chr(10) ||
    'ダウン 300m',
    'practice',
    (now() + interval '6 days')::date + time '19:30', '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '5 days')::date + time '23:59', 5, 12,
    '["level_intermediate","level_advanced"]'::jsonb, false, false, 'confirmed', 'published'
  ) RETURNING id INTO v_s2_2;

  -- S2-3: 日曜テクニカル（open / +8日 / 全員向け）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2, v_user1,
    '日曜テクニカル練習',
    '泳法の細部を丁寧に修正。ビデオ撮影でフォーム確認できます。どの種目でもOK。',
    'アップ 400m'                                   || chr(10) ||
    'テクニカルドリル（各種目）'                     || chr(10) ||
    'フォーム確認 8×50m'                            || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '8 days')::date + time '09:00', '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '7 days')::date + time '23:59', 3, 10,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s2_3;

  -- S2-4: 月例記録会（open / +17日 / 外部公開 / competition）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2, v_user1,
    '東京マスターズ月例記録会',
    '毎月恒例の記録会。外部からの参加も歓迎！全種目エントリー可能。タイム証明書を当日発行。',
    '50m・100m・200m 各種目エントリー可'            || chr(10) ||
    '8時受付、9時スタート予定'                      || chr(10) ||
    'タイム証明書を当日発行',
    'competition',
    (now() + interval '17 days')::date + time '08:00', '辰巳国際水泳場',
    2000, 3000,
    (now() + interval '14 days')::date + time '23:59', 10, 40,
    '[]'::jsonb, false, true, 'open', 'published'
  ) RETURNING id INTO v_s2_4;

  -- S2-5: 下書きセッション（draft — コーチ視点でのみ見える）
  INSERT INTO practice_sessions (
    id, team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    gen_random_uuid(), v_team2, v_user1,
    '【下書き】夏の特別強化練習',
    '内容調整中。まだ公開していません。',
    '未定',
    'practice',
    (now() + interval '21 days')::date + time '09:00', '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '19 days')::date + time '23:59', 5, 12,
    '[]'::jsonb, false, false, 'open', 'draft'
  ) RETURNING id INTO v_s2_5;

  -- ==========================================================
  -- 参加登録（20件 / payment_method・status バリエーション）
  -- ⚠️ payment_method は 'cash' または 'point_card' のみ
  --   （'stripe' は実際の Stripe API 連携が必要なため除外）
  -- ==========================================================

  -- チーム1 S1-1 水曜朝練（open）: user2 pending cash / user3 paid point_card / user4 pending cash
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_1, v_user2, true, 'cash',       'pending'),
    (v_s1_1, v_user3, true, 'point_card', 'paid'),
    (v_s1_1, v_user4, true, 'cash',       'pending');

  -- チーム1 S1-2 土曜スピード（open）: user2・user4 参加申込中
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_2, v_user2, true, 'cash', 'pending'),
    (v_s1_2, v_user4, true, 'cash', 'pending');

  -- チーム1 S1-3 個人メドレー（confirmed）: 全員参加・支払い済み
  --   コーチ（user1）は free / メンバーは paid
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_3, v_user1, true, 'cash',       'free'),
    (v_s1_3, v_user2, true, 'cash',       'paid'),
    (v_s1_3, v_user3, true, 'point_card', 'paid'),
    (v_s1_3, v_user4, true, 'cash',       'paid');

  -- チーム1 S1-4 夏季合宿（open）: user2 pending / user4 pending（合宿参加申込）
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_4, v_user2, true,  'cash', 'pending'),
    (v_s1_4, v_user4, true,  'cash', 'pending');

  -- チーム1 S1-6 キャンセルセッション: user2 が参加していた（cancelled & pending → 支払い履歴に表示されない）
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status, cancelled_at) VALUES
    (v_s1_6, v_user2, true, 'cash', 'pending', now() - interval '7 days');

  -- チーム1 S1-7 チームミーティング（無料）: user2・user3・user4 参加
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_7, v_user2, true, 'cash', 'free'),
    (v_s1_7, v_user3, true, 'cash', 'free'),
    (v_s1_7, v_user4, true, 'cash', 'free');

  -- チーム2 S2-1 月曜朝練（open）: user2・user3 参加申込中
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s2_1, v_user2, true, 'cash', 'pending'),
    (v_s2_1, v_user3, true, 'cash', 'pending');

  -- チーム2 S2-2 木曜夜練（confirmed）: user1 free / user2・user4 paid
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s2_2, v_user1, true, 'cash', 'free'),
    (v_s2_2, v_user2, true, 'cash', 'paid'),
    (v_s2_2, v_user4, true, 'cash', 'paid');

  -- ==========================================================
  -- 回数券購入履歴（test3 / チーム1）
  -- 10スタンプ購入、5スタンプ使用 → 残り5（team_membersと対応）
  -- ==========================================================
  INSERT INTO stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, purchased_at)
  VALUES (v_team1, v_user3, 1, 10, 9000, now() - interval '3 months');

  -- ==========================================================
  -- お知らせ（各チーム2件）
  -- ==========================================================

  -- チーム1
  INSERT INTO announcements (id, team_id, author_id, title, body, link_url) VALUES
    (gen_random_uuid(), v_team1, v_user1,
     '開催確定: 水曜朝練 - 個人メドレー特訓',
     '個人メドレー特訓が開催確定しました。参加費のお支払いをお忘れなく。',
     '/teams/' || v_team1::text || '/sessions/' || v_s1_3::text),
    (gen_random_uuid(), v_team1, v_user1,
     '夏季合宿の参加受付を開始しました',
     '今年も夏季強化合宿を開催します！外部からのゲスト参加も歓迎。定員20名になり次第締め切り。',
     '/teams/' || v_team1::text || '/sessions/' || v_s1_4::text);

  -- チーム2（user4 が投稿するケースも追加）
  INSERT INTO announcements (id, team_id, author_id, title, body, link_url) VALUES
    (gen_random_uuid(), v_team2, v_user1,
     '開催確定: 木曜夜練 - スプリント特化',
     '木曜夜練のスプリント特化練習が開催確定しました。奮ってご参加ください。',
     '/teams/' || v_team2::text || '/sessions/' || v_s2_2::text),
    (gen_random_uuid(), v_team2, v_user4,
     '月例記録会の参加募集を開始しました',
     '今月も月例記録会を開催します！外部参加も大歓迎。タイム証明書を当日発行します。',
     '/teams/' || v_team2::text || '/sessions/' || v_s2_4::text);

  -- ==========================================================
  -- 会費データ（paid / unpaid バリエーション）
  -- ==========================================================

  -- チーム1（年会費 5000円）
  -- test3 は point_card 会員なので年会費なし
  INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at) VALUES
    (v_team1, v_user1, 'annual', extract(year from now())::text, 5000, 'paid',   now() - interval '90 days'),
    (v_team1, v_user2, 'annual', extract(year from now())::text, 5000, 'paid',   now() - interval '60 days'),
    (v_team1, v_user4, 'annual', extract(year from now())::text, 5000, 'unpaid', NULL);

  -- チーム2（年会費 6000円 / 月謝 3000円）
  INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at) VALUES
    (v_team2, v_user1, 'annual',  extract(year from now())::text, 6000, 'paid',   now() - interval '120 days'),
    (v_team2, v_user2, 'annual',  extract(year from now())::text, 6000, 'unpaid', NULL),
    (v_team2, v_user3, 'monthly', to_char(now(), 'YYYY-MM'),      3000, 'paid',   now() - interval '5 days'),
    (v_team2, v_user4, 'annual',  extract(year from now())::text, 6000, 'paid',   now() - interval '45 days');

  RAISE NOTICE '=== シード完了 ===';
  RAISE NOTICE 'チーム1: マウントリバー水泳クラブ (ID: %)', v_team1;
  RAISE NOTICE 'チーム2: 東京マスターズ水泳クラブ (ID: %)', v_team2;
  RAISE NOTICE 'プロフィール: 全フィールド設定済み（onboarding_completed_at含む）';
  RAISE NOTICE 'セッション: 12件 / 参加登録: 20件 / お知らせ: 4件 / 会費: 7件 / 回数券: 1件';
  RAISE NOTICE '⚠️  Stripe カード: SQL では設定不可。デモ時は UI から登録してください。';
END $$;
