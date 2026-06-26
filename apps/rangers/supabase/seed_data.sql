-- ============================================================
-- Rangers デモデータ（完全版 v4 — 2026-06-26）
-- 変更点: 過去セッション数削減 / 全通知タイプ網羅
-- 実行方法: npx supabase db query --linked --file apps/rangers/supabase/seed_data.sql
-- ============================================================
--
-- ▼ アカウント構成
--   test1@example.com (山田 健太)   — チーム1・2 admin（コーチ）→ 支払い一切なし
--   test2@example.com (鈴木 太郎)   — チーム1 admin / チーム2 monthly member
--   test3@example.com (佐藤 花子)   — チーム1 point_card / チーム2 monthly member
--   test4@example.com (田中 新太郎) — 新規アカウント・チーム未所属・チーム1 参加申請中
--
-- ▼ チーム構成
--   チーム1: マウントリバー水泳クラブ（2026-01-10 創設）
--     料金体系: セッション参加費（¥1,000）+ 回数券（10枚 ¥9,000）
--   チーム2: 東京マスターズ水泳クラブ（2026-04-01 創設）
--     料金体系: セッション参加費（¥1,200）+ 月謝（¥3,000/月）
--
-- ▼ 時系列（整合性保証）
--   2026-01-10  チーム1 創設、山田 admin 参加
--   2026-01-15  鈴木 チーム1 admin 参加
--   2026-02-01  佐藤 チーム1 point_card 参加
--   2026-02-03  佐藤 回数券購入（10枚 ¥9,000）
--   2026-02-11  チーム1 Session A（確定・過去）user3 回数券 #1
--   2026-03-04  チーム1 Session B（確定・過去）user3 回数券 #2
--   2026-04-01  チーム2 創設、山田 admin 参加
--   2026-04-05  鈴木 チーム2 monthly 参加 + 4月月謝支払い
--   2026-04-10  佐藤 チーム2 monthly 参加 + 4月月謝支払い
--   2026-04-16  チーム2 Session A（確定・過去、最小参加数達成）
--   2026-05-01  鈴木・佐藤 5月月謝支払い
--   2026-05-12  チーム2 Session B（確定・過去）
--   2026-06-02  鈴木・佐藤 6月月謝支払い
--   2026-06-16  チーム1 水曜朝練 キャンセル（プール点検）
--   2026-06-20  田中 新規登録 + チーム1 参加申請（pending）
--   2026-06-26  本日（現在）
--   （未来）    各チームの開催予定セッション（回数券 #3 使用含む）
--
-- ▼ アドミン支払いポリシー
--   admin ロールのメンバーは支払いが一切発生しない
--   セッション参加は payment_status='free'、会費レコードも作成しない
--
-- ▼ 回数券残枚数（v4）
--   佐藤 購入: 10枚 / PS1-A + PS1-B = 2枚使用 / S1-4 確定済 = 1枚使用 / 残7枚
--
-- ▼ 現金払いデモシナリオ
--   チーム2 月曜朝練（+3日）: 鈴木・佐藤が現金払い pending
--   → 管理者が集金管理フィルターで「現金のみ」表示して確認

-- ============================================================
-- PHASE 1: クリーンアップ
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';
  v_user2  uuid := '9d30728f-96e9-4415-9823-97040111ad22';
  v_user3  uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a';
  v_user4  uuid := '8e538fba-2637-4abf-aa9f-5b784cb2f561';
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
    DELETE FROM join_requests      WHERE team_id = ANY(v_team_ids);
    DELETE FROM team_members       WHERE team_id = ANY(v_team_ids);
    DELETE FROM teams              WHERE id = ANY(v_team_ids);
  END IF;

  DELETE FROM notifications
    WHERE user_id IN (v_user1, v_user2, v_user3, v_user4);

  RAISE NOTICE 'クリーンアップ完了';
END $$;

-- ============================================================
-- PHASE 2: プロフィール更新（4アカウント）
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';
  v_user2  uuid := '9d30728f-96e9-4415-9823-97040111ad22';
  v_user3  uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a';
  v_user4  uuid := '8e538fba-2637-4abf-aa9f-5b784cb2f561';
BEGIN

  UPDATE profiles SET
    name                      = '山田 健太',
    furigana                  = 'ヤマダ ケンタ',
    gender                    = 'male',
    birthday                  = '1970-03-15',
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
    bio                       = '甲府市出身。20代から水泳を本格的に始め、マスターズ水泳大会に毎年出場。得意種目はクロールと個人メドレー。マウントリバー水泳クラブ代表として運営に携わりながら、東京マスターズのコーチも兼任。両チームの橋渡し役としてメンバーの交流も大切にしています。',
    career                    = '1998年より水泳指導を開始。山梨県水泳協会公認コーチ資格取得。マウントリバー水泳クラブ代表として15年以上にわたりチームを運営。2026年より東京マスターズ水泳クラブのコーチも兼任。',
    achievements              = '2018年 全日本マスターズ水泳選手権 50m クロール 第3位（55〜59歳区分）' || chr(10) ||
                                '2022年 山梨マスターズ記録会 200m 個人メドレー 優勝' || chr(10) ||
                                '指導実績: マスターズ大会出場延べ80名以上',
    target_ages               = ARRAY['大人（19歳〜）', 'シニア（60歳〜）'],
    onboarding_completed_at   = '2024-01-10 10:00:00+09'
  WHERE id = v_user1;

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
    bio                       = '東京都在住。学生時代は水泳部に所属し、社会人になってからブランクがありましたが、40歳を機に復帰。山田コーチに誘われてマウントリバーの副代表も務めながら、東京マスターズには月謝制で参加中。週2〜3回のペースで練習を続けています。',
    career                    = '大学水泳部出身（平泳ぎ専門）。20年のブランクを経て2010年にマスターズ水泳に参加。2026年1月よりマウントリバー水泳クラブ副代表兼コーチ。',
    achievements              = '2021年 東京マスターズ記録会 100m 平泳ぎ 自己ベスト更新（1:28.5）' || chr(10) ||
                                '2024年 山梨マスターズ記録会 50m 平泳ぎ 出場',
    target_ages               = ARRAY['大人（19歳〜）'],
    onboarding_completed_at   = '2026-01-05 09:00:00+09'
  WHERE id = v_user2;

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
    level                     = '中級',
    swimmer_type              = NULL,
    swim_disciplines          = ARRAY['競泳'],
    specialties               = ARRAY['平泳ぎ', 'バタフライ'],
    swimming_goals            = ARRAY['健康維持', '楽しみ・趣味'],
    participation_styles      = ARRAY['チーム練習'],
    prefectures               = ARRAY['千葉県', '東京都'],
    bio                       = '健康維持のために水泳を続けています。マウントリバーには回数券で自分のペースで参加し、東京マスターズには月謝制でほぼ毎週参加中。2つのチームに入ることで幅広い練習スタイルを楽しめています。平泳ぎが得意で、最近バタフライにも挑戦中！',
    career                    = '2020年に水泳スクールに通い始め、2026年よりマウントリバーと東京マスターズに二重所属。',
    achievements              = NULL,
    target_ages               = NULL,
    onboarding_completed_at   = '2026-01-28 14:00:00+09'
  WHERE id = v_user3;

  UPDATE profiles SET
    name                      = '田中 新太郎',
    furigana                  = 'タナカ シンタロウ',
    gender                    = 'male',
    birthday                  = '1997-09-12',
    phone                     = '09087654321',
    address                   = '神奈川県横浜市西区みなとみらい3-3-3 コスモタワー802',
    emergency_contact         = '09076543210',
    emergency_contact_name    = '田中 和子',
    emergency_contact_relation = '母',
    swimwear_size             = 'M',
    masters_registered        = false,
    masters_number            = NULL,
    jsa_registered            = false,
    jsa_number                = NULL,
    level                     = '初級',
    swimmer_type              = NULL,
    swim_disciplines          = ARRAY['競泳'],
    specialties               = ARRAY['クロール'],
    swimming_goals            = ARRAY['健康維持', '水泳再開（ブランクあり）'],
    participation_styles      = ARRAY['チーム練習'],
    prefectures               = ARRAY['神奈川県'],
    bio                       = '学生時代に少しだけ水泳をやっていましたが、社会人になってからは全くやっていませんでした。最近健康意識が高まりこのアプリを見つけて登録しました。マウントリバー水泳クラブに興味があり参加申請中です。初心者なのでゆっくり始めたいと思っています。',
    career                    = '水泳経験ほぼなし（小学校のスイミングスクール程度）。2026年6月にアプリ登録・チーム参加申請。',
    achievements              = NULL,
    target_ages               = NULL,
    onboarding_completed_at   = '2026-06-20 18:30:00+09'
  WHERE id = v_user4;

  RAISE NOTICE 'プロフィール更新完了（4アカウント）';
END $$;

-- ============================================================
-- PHASE 3: チーム・メンバー・現在/未来のセッション・アナウンス
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';
  v_user2  uuid := '9d30728f-96e9-4415-9823-97040111ad22';
  v_user3  uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a';
  v_user4  uuid := '8e538fba-2637-4abf-aa9f-5b784cb2f561';

  v_team1  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_team2  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  v_s1_1 uuid; -- 水曜朝練（+5日, open）
  v_s1_2 uuid; -- 土曜スピード（+10日, open）
  v_s1_3 uuid; -- ミーティング（+7日, open, 無料）
  v_s1_4 uuid; -- 個人メドレー特訓（+17日, confirmed）
  v_s1_5 uuid; -- 夏季合宿（+24日, open, event）
  v_s1_6 uuid; -- キャンセル済み（-10日）

  v_s2_1 uuid; -- 月曜朝練（+3日, open）← 現金払いデモ
  v_s2_2 uuid; -- 木曜夜練（+8日, confirmed）
  v_s2_3 uuid; -- 日曜テクニカル（+15日, open）
  v_s2_4 uuid; -- 月例記録会（+28日, open, competition）
  v_s2_5 uuid; -- 夏特別練習（+36日, draft）
BEGIN

  -- ==========================================================
  -- チーム1: マウントリバー水泳クラブ
  -- ==========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session,
    activity_area, status,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone,
    created_at
  ) VALUES (
    v_team1, v_user1,
    'マウントリバー水泳クラブ',
    '山梨県甲府市を拠点とするマスターズ水泳チーム。毎週水・土曜日に甲府市民プールで練習。回数券制なので自分のペースで参加できます。大会参加にも積極的で、初心者から上級者まで歓迎！',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/mountriver-icon.jpg',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/mountriver-cover.jpg',
    1000, 1500,
    NULL, NULL,
    3, 10, 9000,
    true, false, false, true,
    false,
    '山梨県甲府市', 'active',
    '週2回', ARRAY['水', '土'], '甲府市民プール（山梨県甲府市北口）',
    'info@mountriver-swim.example.jp', '0552011234',
    '2026-01-10 09:00:00+09'
  );

  -- チーム1 メンバー
  -- v4: stamp_remaining = 7（10枚購入 - 2枚過去使用 - 1枚S1-4確定済 = 7枚残）
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team1, v_user1, 'admin',  'annual',     0, '2026-01-10 09:00:00+09'),
    (v_team1, v_user2, 'admin',  'annual',     0, '2026-01-15 10:00:00+09'),
    (v_team1, v_user3, 'member', 'point_card', 7, '2026-02-01 11:00:00+09');

  -- ==========================================================
  -- チーム2: 東京マスターズ水泳クラブ
  -- ==========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session,
    activity_area, status,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone,
    created_at
  ) VALUES (
    v_team2, v_user1,
    '東京マスターズ水泳クラブ',
    '東京都江東区を拠点とするマスターズ水泳チーム。辰巳国際水泳場で月・木・日に活動中。月謝制で安定して練習できます。初心者から競技者まで幅広く受け入れ。月例記録会も毎月開催！',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/tokyomasters-icon.jpg',
    'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed/tokyomasters-cover.jpg',
    1200, 2000,
    NULL, 3000,
    2, 10, 10000,
    true, false, true, false,
    false,
    '東京都江東区', 'active',
    '週3回', ARRAY['月', '木', '日'], '辰巳国際水泳場（東京都江東区辰巳2-2-1）',
    'contact@tokyo-masters-swim.example.jp', '0335551234',
    '2026-04-01 09:00:00+09'
  );

  -- チーム2 メンバー（admin×1 / monthly×2）
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team2, v_user1, 'admin',  'monthly', 0, '2026-04-01 09:00:00+09'),
    (v_team2, v_user2, 'member', 'monthly', 0, '2026-04-05 10:00:00+09'),
    (v_team2, v_user3, 'member', 'monthly', 0, '2026-04-10 11:00:00+09');

  -- ==========================================================
  -- チーム1 参加申請（田中 新太郎 → pending）
  -- ==========================================================
  INSERT INTO join_requests (team_id, swimmer_id, membership_type, status, created_at) VALUES
    (v_team1, v_user4, 'annual', 'pending', '2026-06-20 19:00:00+09');

  -- ==========================================================
  -- セッション: チーム1（マウントリバー）6件
  -- ==========================================================

  -- S1-1: 水曜朝練（+5日, open）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    course_rules, target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '水曜朝練 - クロール技術練習',
    '週1回の定期練習。クロールのフォーム改善に重点を置きます。初級者も丁寧にフォロー。',
    'アップ 400m（クロール）'                    || chr(10) ||
    'キック練習 4×50m（板キック）'               || chr(10) ||
    'プル練習 4×100m（パドル）'                  || chr(10) ||
    'テクニカルドリル 6×50m'                    || chr(10) ||
    'メインセット 3×200m（ペース泳）'            || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '5 days')::date + time '07:00',
    '甲府市民プール',
    1000, 1500,
    (now() + interval '4 days')::date + time '23:59', 3, 12,
    '[{"min":1,"max":5,"courses":1},{"min":6,"max":12,"courses":2},{"cancel_below":3}]'::jsonb,
    '[]'::jsonb, true, false, 'open', 'published'
  ) RETURNING id INTO v_s1_1;

  -- S1-2: 土曜スピード練習（+10日, open）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '土曜スピード練習',
    '大会シーズンに向けた強化練習。スピード系セットを中心に行います。中級以上推奨。',
    'アップ 600m（IM順）'                          || chr(10) ||
    'スピードドリル 8×25m（全力）'                 || chr(10) ||
    'メインセット 3×(100m + 50m + 25m) 全力'      || chr(10) ||
    'インターバル 10×50m (rest :30)'              || chr(10) ||
    'ダウン 300m',
    'practice',
    (now() + interval '10 days')::date + time '09:00',
    '甲府市民プール',
    1000, 1500,
    (now() + interval '9 days')::date + time '23:59', 5, 15,
    '["level_intermediate","level_advanced"]'::jsonb, true, false, 'open', 'published'
  ) RETURNING id INTO v_s1_2;

  -- S1-3: チームミーティング（+7日, open, 無料）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '7月度チームミーティング',
    '夏季合宿の詳細確認と8〜9月スケジュール調整。新メンバー田中さんの申請確認も行います。全員参加推奨。',
    '1. 夏季合宿の詳細（場所・日程・費用）確認' || chr(10) ||
    '2. 8〜9月の練習スケジュール調整'           || chr(10) ||
    '3. 大会エントリー希望者の確認'             || chr(10) ||
    '4. 新メンバー田中さんの参加申請について',
    'meeting',
    (now() + interval '7 days')::date + time '19:00',
    '甲府市民プール 会議室',
    0, 0,
    (now() + interval '6 days')::date + time '23:59', 1, 20,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s1_3;

  -- S1-4: 個人メドレー特訓（+17日, confirmed）← 全員参加・回数券3枚目使用
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    course_rules, target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '水曜朝練 - 個人メドレー特訓',
    'マスターズ大会に向けた個人メドレーの強化練習。開催確定済みです。',
    'アップ 500m（IM）'                  || chr(10) ||
    'ドリル 4×75m（各種目25m）'          || chr(10) ||
    'ターン練習 16×25m（各種目×4）'      || chr(10) ||
    'メインセット 4×100m IM'            || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '17 days')::date + time '07:00',
    '甲府市民プール',
    1000, 1500,
    (now() + interval '15 days')::date + time '23:59', 4, 12,
    '[{"min":1,"max":6,"courses":1},{"min":7,"max":12,"courses":2},{"cancel_below":4}]'::jsonb,
    '["stroke_medley"]'::jsonb, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_s1_4;

  -- S1-5: 夏季強化合宿（+24日, open, event, 外部公開）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, end_at, location, meeting_point,
    member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '夏季強化合宿 Day1（外部参加OK）',
    '1泊2日の強化合宿。外部からのゲスト参加も大歓迎！午前・午後の2部制で集中的に取り組みます。',
    '午前練習: 2000m（技術中心）'                           || chr(10) ||
    '午後練習: 2500m（持久力中心）'                          || chr(10) ||
    'コーチングセッション（フォーム動画分析）',
    'event',
    (now() + interval '24 days')::date + time '09:00',
    (now() + interval '25 days')::date + time '17:00',
    '山梨県立富士北麓公園屋内プール',
    '河口湖駅 南口 集合',
    3000, 5000,
    (now() + interval '20 days')::date + time '23:59', 8, 20,
    '["level_intermediate","level_advanced"]'::jsonb, false, true, 'open', 'published'
  ) RETURNING id INTO v_s1_5;

  -- S1-6: キャンセル済み（-10日）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '水曜朝練 - キャンセル（プール設備点検）',
    'プール施設の定期点検のためキャンセルとなりました。次回は通常通り開催予定です。',
    'キャンセル',
    'practice',
    (now() - interval '10 days')::date + time '07:00',
    '甲府市民プール',
    1000, 1500,
    (now() - interval '12 days')::date + time '23:59', 3, 12,
    '[]'::jsonb, true, false, 'cancelled', 'published'
  ) RETURNING id INTO v_s1_6;

  -- ==========================================================
  -- セッション登録: チーム1（現在/未来）
  -- ==========================================================

  -- S1-1 水曜朝練（open）: user3 point_card pending
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_1, v_user3, true, 'point_card', 'pending');

  -- S1-2: 登録なし（新規セッション感）

  -- S1-3 ミーティング（無料）: user2 のみ（user3は参加未定）
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_3, v_user2, true, 'cash', 'free');

  -- S1-4 個人メドレー特訓（confirmed）: 全員参加
  -- admin は free / user3 は point_card paid（回数券3枚目 = 残7枚）
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_4, v_user1, true, 'cash',       'free'),
    (v_s1_4, v_user2, true, 'cash',       'free'),
    (v_s1_4, v_user3, true, 'point_card', 'paid');

  -- S1-5 夏季合宿: 登録なし（まだ誰も申し込んでいない状態）

  -- S1-6 キャンセル済み: user3 が参加していた（cancelled_at あり）
  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, cancelled_at)
  VALUES
    (v_s1_6, v_user3, true, 'point_card', 'pending', (now() - interval '10 days'));

  -- ==========================================================
  -- セッション: チーム2（東京マスターズ）5件
  -- ==========================================================

  -- S2-1: 月曜朝練（+3日, open）← 現金払いフィルター デモセッション
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    course_rules, target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '月曜朝練 - 持久力強化',
    '週始めの定期練習。距離をしっかり泳いで持久力を養います。',
    'アップ 600m'                           || chr(10) ||
    'キック 6×50m'                          || chr(10) ||
    'メインセット 2×400m（LT強度）'          || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '3 days')::date + time '06:30',
    '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '2 days')::date + time '23:59', 4, 15,
    '[{"min":1,"max":8,"courses":2},{"min":9,"max":15,"courses":3},{"cancel_below":4}]'::jsonb,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s2_1;

  -- S2-2: 木曜夜練（+8日, confirmed）← 集金済みデモ
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '木曜夜練 - スプリント特化',
    '短距離スピードを徹底強化。50m・100mのタイムアップを目指します。開催確定済み。',
    'アップ 500m'                           || chr(10) ||
    'スプリント 10×25m（全力）'             || chr(10) ||
    'メインセット 5×100m（90%強度）'        || chr(10) ||
    'ダウン 300m',
    'practice',
    (now() + interval '8 days')::date + time '19:30',
    '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '7 days')::date + time '23:59', 5, 12,
    '["level_intermediate","level_advanced"]'::jsonb, false, false, 'confirmed', 'published'
  ) RETURNING id INTO v_s2_2;

  -- S2-3: 日曜テクニカル（+15日, open）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '日曜テクニカル練習',
    '泳法の細部を丁寧に修正。ビデオ撮影でフォーム確認できます。',
    'アップ 400m'                                   || chr(10) ||
    'テクニカルドリル（各種目）'                     || chr(10) ||
    'フォーム確認 8×50m'                            || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '15 days')::date + time '09:00',
    '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '14 days')::date + time '23:59', 3, 10,
    '[]'::jsonb, false, false, 'open', 'published'
  ) RETURNING id INTO v_s2_3;

  -- S2-4: 月例記録会（+28日, open, competition, 外部公開）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '東京マスターズ月例記録会',
    '毎月恒例の記録会。外部からの参加も歓迎！全種目エントリー可能。タイム証明書を当日発行。',
    '50m・100m・200m 各種目エントリー可'            || chr(10) ||
    '8時受付、9時スタート予定'                      || chr(10) ||
    'タイム証明書を当日発行',
    'competition',
    (now() + interval '28 days')::date + time '08:00',
    '辰巳国際水泳場',
    2000, 3000,
    (now() + interval '25 days')::date + time '23:59', 10, 40,
    '[]'::jsonb, false, true, 'open', 'published'
  ) RETURNING id INTO v_s2_4;

  -- S2-5: 下書き（draft — コーチ視点のみ）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '【下書き】夏の特別強化練習',
    '内容調整中。まだ公開していません。',
    '未定',
    'practice',
    (now() + interval '36 days')::date + time '09:00',
    '辰巳国際水泳場',
    1200, 2000,
    (now() + interval '34 days')::date + time '23:59', 5, 12,
    '[]'::jsonb, false, false, 'open', 'draft'
  ) RETURNING id INTO v_s2_5;

  -- ==========================================================
  -- セッション登録: チーム2（現在/未来）
  -- ==========================================================

  -- S2-1 月曜朝練（+3日, open）← 現金払いデモ
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s2_1, v_user1, true, 'cash', 'free'),
    (v_s2_1, v_user2, true, 'cash', 'pending'),
    (v_s2_1, v_user3, true, 'cash', 'pending');

  -- S2-2 木曜夜練（+8日, confirmed）: 全員参加・集金済み
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s2_2, v_user1, true, 'cash', 'free'),
    (v_s2_2, v_user2, true, 'cash', 'paid'),
    (v_s2_2, v_user3, true, 'cash', 'paid');

  -- S2-3・S2-4: 登録なし

  -- ==========================================================
  -- お知らせ（各チーム2件）
  -- ==========================================================
  INSERT INTO announcements (id, team_id, author_id, title, body, link_url) VALUES
    (gen_random_uuid(), v_team1, v_user1,
     '開催確定: 水曜朝練 - 個人メドレー特訓',
     '個人メドレー特訓が開催確定しました。参加費のお支払い（回数券または現金）をお忘れなく。',
     '/sessions/' || v_s1_4::text),
    (gen_random_uuid(), v_team1, v_user1,
     '夏季強化合宿の参加受付を開始しました',
     '今年も夏季強化合宿を開催します！外部からのゲスト参加も歓迎。定員20名になり次第締め切り。',
     '/sessions/' || v_s1_5::text);

  INSERT INTO announcements (id, team_id, author_id, title, body, link_url) VALUES
    (gen_random_uuid(), v_team2, v_user1,
     '開催確定: 木曜夜練 - スプリント特化',
     '木曜夜練のスプリント特化練習が開催確定しました。当日現金でお支払いください。',
     '/sessions/' || v_s2_2::text),
    (gen_random_uuid(), v_team2, v_user1,
     '月例記録会の参加募集を開始しました',
     '今月も月例記録会を開催します！外部参加も大歓迎。タイム証明書を当日発行します。',
     '/sessions/' || v_s2_4::text);

  RAISE NOTICE '=== PHASE 3 完了 ===';
  RAISE NOTICE 'チーム1 (ID: %)', v_team1;
  RAISE NOTICE 'チーム2 (ID: %)', v_team2;
END $$;

-- ============================================================
-- PHASE 4: 過去セッション + 会費 + 回数券 + 通知（全タイプ網羅）
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';
  v_user2  uuid := '9d30728f-96e9-4415-9823-97040111ad22';
  v_user3  uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a';
  v_team1  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_team2  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  -- 過去セッション変数（このブロックで INSERT RETURNING）
  v_ps1_a uuid;  -- 2026-02-11 チーム1 水曜朝練
  v_ps1_b uuid;  -- 2026-03-04 チーム1 土曜スピード
  v_ps2_a uuid;  -- 2026-04-16 チーム2 月曜朝練（初回）
  v_ps2_b uuid;  -- 2026-05-12 チーム2 木曜夜練

  -- 未来セッション変数（PHASE3で作成 → 検索して取得）
  v_s1_4_id uuid;  -- 個人メドレー特訓（confirmed）
  v_s1_6_id uuid;  -- キャンセル済みセッション
  v_s2_1_id uuid;  -- 月曜朝練（現金デモ）
  v_s2_2_id uuid;  -- 木曜夜練（confirmed・集金済み）
BEGIN

  -- ── 未来セッションIDの取得（PHASE3で生成済み）────────────────
  SELECT id INTO v_s1_4_id FROM practice_sessions
    WHERE team_id = v_team1 AND title LIKE '%個人メドレー%' LIMIT 1;
  SELECT id INTO v_s1_6_id FROM practice_sessions
    WHERE team_id = v_team1 AND session_status = 'cancelled' LIMIT 1;
  SELECT id INTO v_s2_1_id FROM practice_sessions
    WHERE team_id = v_team2 AND title LIKE '%月曜朝練%' AND scheduled_at > now() LIMIT 1;
  SELECT id INTO v_s2_2_id FROM practice_sessions
    WHERE team_id = v_team2 AND title LIKE '%木曜夜練%' AND scheduled_at > now() LIMIT 1;

  -- ==========================================================
  -- 過去セッション × 4（全て confirmed / v4: 削減版）
  -- ==========================================================

  -- PS1-A: 2026-02-11 チーム1 水曜朝練（創設後の初練習）
  -- user1(admin free) + user3(point_card paid #1 → 残9枚)
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '水曜朝練 - クロール技術練習',
    'クロールのフォーム改善。チーム1 創設後の初練習。',
    'アップ 400m / キック 4×50m / プル 4×100m / ダウン 200m',
    'practice', '2026-02-11 07:00:00+09', '甲府市民プール',
    1000, 1500, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps1_a;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps1_a, v_user1, true, 'cash',       'free', '2026-02-09 10:00:00+09'),
    (v_ps1_a, v_user3, true, 'point_card', 'paid', '2026-02-09 14:00:00+09');

  -- PS1-B: 2026-03-04 チーム1 土曜スピード練習
  -- user3(point_card paid #2 → 残8枚)
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '土曜スピード練習',
    '大会シーズンに向けた強化練習。スプリントセット中心。',
    'アップ 600m / スプリント 8×25m / メインセット 3×100m / ダウン 300m',
    'practice', '2026-03-04 09:00:00+09', '甲府市民プール',
    1000, 1500, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps1_b;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps1_b, v_user3, true, 'point_card', 'paid', '2026-03-02 10:00:00+09');

  -- PS2-A: 2026-04-16 チーム2 月曜朝練（初回・最小参加数=3を達成）
  -- user1(admin free) + user2(cash paid) + user3(cash paid)
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    min_participants, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '月曜朝練 - 持久力強化',
    '週始めの定期練習。チーム2 初練習。距離をしっかり泳いで持久力を養います。',
    'アップ 600m / キック 6×50m / メインセット 2×400m / ダウン 200m',
    'practice', '2026-04-16 06:30:00+09', '辰巳国際水泳場',
    1200, 2000, 3, false, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps2_a;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps2_a, v_user1, true, 'cash', 'free', '2026-04-14 09:00:00+09'),
    (v_ps2_a, v_user2, true, 'cash', 'paid', '2026-04-14 10:00:00+09'),
    (v_ps2_a, v_user3, true, 'cash', 'paid', '2026-04-15 09:00:00+09');

  -- PS2-B: 2026-05-12 チーム2 木曜夜練
  -- user2(cash paid) + user3(cash paid)
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '木曜夜練 - スプリント特化',
    '短距離スピードを徹底強化。50m・100mのタイムアップを目指します。',
    'アップ 500m / スプリント 10×25m / メインセット 5×100m / ダウン 300m',
    'practice', '2026-05-12 19:30:00+09', '辰巳国際水泳場',
    1200, 2000, false, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps2_b;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps2_b, v_user2, true, 'cash', 'paid', '2026-05-10 10:00:00+09'),
    (v_ps2_b, v_user3, true, 'cash', 'paid', '2026-05-11 09:00:00+09');

  -- ==========================================================
  -- 回数券購入履歴（佐藤 花子 / チーム1）
  -- 2026-02-03 購入（10枚 ¥9,000）
  -- ==========================================================
  INSERT INTO stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, purchased_at)
  VALUES (v_team1, v_user3, 1, 10, 9000, '2026-02-03 12:00:00+09');

  -- ==========================================================
  -- 月謝記録（チーム2 / 鈴木・佐藤）
  -- user2: joined 2026-04-05 → 4〜6月 paid + 7月 unpaid
  -- user3: joined 2026-04-10 → 4〜6月 paid + 7月 unpaid
  -- ==========================================================
  INSERT INTO membership_fees (team_id, swimmer_id, type, period, amount, status, paid_at) VALUES
    (v_team2, v_user2, 'monthly', '2026-04', 3000, 'paid', '2026-04-05 10:30:00+09'),
    (v_team2, v_user2, 'monthly', '2026-05', 3000, 'paid', '2026-05-01 09:00:00+09'),
    (v_team2, v_user2, 'monthly', '2026-06', 3000, 'paid', '2026-06-02 09:00:00+09'),
    (v_team2, v_user2, 'monthly', '2026-07', 3000, 'unpaid', NULL),
    (v_team2, v_user3, 'monthly', '2026-04', 3000, 'paid', '2026-04-10 11:30:00+09'),
    (v_team2, v_user3, 'monthly', '2026-05', 3000, 'paid', '2026-05-01 09:30:00+09'),
    (v_team2, v_user3, 'monthly', '2026-06', 3000, 'paid', '2026-06-02 09:30:00+09'),
    (v_team2, v_user3, 'monthly', '2026-07', 3000, 'unpaid', NULL);

  -- ==========================================================
  -- 通知（全タイプ網羅・時系列順）
  -- is_read: 6/20以降 = false（未読）/ それ以前 = true（既読）
  -- ==========================================================
  INSERT INTO notifications (user_id, type, title, body, team_id, link, is_read, created_at) VALUES

    -- ─────────────────────────────────────────────────────────
    -- 2026-01-10 チーム1 創設
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'team_created',
     'マウントリバー水泳クラブを作成しました',
     'チームページを公開してメンバーを招待しましょう',
     v_team1, '/teams/' || v_team1, true, '2026-01-10 09:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-01-15 鈴木 チーム1 参加
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'member_joined',
     '鈴木 太郎さんが「マウントリバー水泳クラブ」に参加しました',
     NULL,
     v_team1, '/teams/' || v_team1 || '?tab=members', true, '2026-01-15 10:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-02-01 佐藤 チーム1 参加
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'member_joined',
     '佐藤 花子さんが「マウントリバー水泳クラブ」に参加しました',
     NULL,
     v_team1, '/teams/' || v_team1 || '?tab=members', true, '2026-02-01 11:05:00+09'),

    (v_user2, 'member_joined',
     '佐藤 花子さんが「マウントリバー水泳クラブ」に参加しました',
     NULL,
     v_team1, '/teams/' || v_team1 || '?tab=members', true, '2026-02-01 11:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-02-03 佐藤 回数券購入
    -- ─────────────────────────────────────────────────────────
    (v_user3, 'payment_charged',
     '回数券を購入しました（10枚）',
     '¥9,000が引き落とされました',
     v_team1, '/payments', true, '2026-02-03 12:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-02-04 PS1-A セッション作成通知（佐藤へ）
    -- ─────────────────────────────────────────────────────────
    (v_user3, 'session_added',
     '「水曜朝練 - クロール技術練習」が追加されました',
     '2026年2月11日（水）07:00 | 甲府市民プール',
     v_team1, '/sessions/' || v_ps1_a, true, '2026-02-04 10:00:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-02-09 佐藤 PS1-A 登録 → 管理者へ通知
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'session_registered',
     '佐藤 花子さんが「水曜朝練 - クロール技術練習」に申し込みました',
     '2026年2月11日（水）07:00',
     v_team1, '/sessions/' || v_ps1_a, true, '2026-02-09 14:05:00+09'),

    (v_user2, 'session_registered',
     '佐藤 花子さんが「水曜朝練 - クロール技術練習」に申し込みました',
     '2026年2月11日（水）07:00',
     v_team1, '/sessions/' || v_ps1_a, true, '2026-02-09 14:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-02-10 前日リマインダー（クーロン: PS1-A）
    -- ─────────────────────────────────────────────────────────
    (v_user3, 'session_reminder',
     '明日のセッションのリマインダー',
     '「水曜朝練 - クロール技術練習」が明日開催されます',
     v_team1, '/sessions/' || v_ps1_a, true, '2026-02-10 18:00:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-02-11 PS1-A 開催 → 佐藤 回数券 #1 使用
    -- ─────────────────────────────────────────────────────────
    (v_user3, 'payment_charged',
     '「水曜朝練 - クロール技術練習」の回数券を使用しました',
     '回数券1枚が使用されました（残り9枚）',
     v_team1, '/payments', true, '2026-02-11 07:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-03-02 PS1-B セッション作成通知 & 佐藤 登録
    -- ─────────────────────────────────────────────────────────
    (v_user3, 'session_added',
     '「土曜スピード練習」が追加されました',
     '2026年3月4日（土）09:00 | 甲府市民プール',
     v_team1, '/sessions/' || v_ps1_b, true, '2026-03-01 10:00:00+09'),

    (v_user1, 'session_registered',
     '佐藤 花子さんが「土曜スピード練習」に申し込みました',
     '2026年3月4日（土）09:00',
     v_team1, '/sessions/' || v_ps1_b, true, '2026-03-02 10:05:00+09'),

    (v_user2, 'session_registered',
     '佐藤 花子さんが「土曜スピード練習」に申し込みました',
     '2026年3月4日（土）09:00',
     v_team1, '/sessions/' || v_ps1_b, true, '2026-03-02 10:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-03-04 PS1-B 開催 → 佐藤 回数券 #2 使用
    -- ─────────────────────────────────────────────────────────
    (v_user3, 'payment_charged',
     '「土曜スピード練習」の回数券を使用しました',
     '回数券1枚が使用されました（残り8枚）',
     v_team1, '/payments', true, '2026-03-04 09:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-04-01 チーム2 創設
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'team_created',
     '東京マスターズ水泳クラブを作成しました',
     'チームページを公開してメンバーを招待しましょう',
     v_team2, '/teams/' || v_team2, true, '2026-04-01 09:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-04-05 鈴木 チーム2 参加 + 4月月謝
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'member_joined',
     '鈴木 太郎さんが「東京マスターズ水泳クラブ」に参加しました',
     NULL,
     v_team2, '/teams/' || v_team2 || '?tab=members', true, '2026-04-05 10:05:00+09'),

    (v_user2, 'payment_charged',
     '2026年4月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', true, '2026-04-05 10:35:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-04-10 佐藤 チーム2 参加 + 4月月謝
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'member_joined',
     '佐藤 花子さんが「東京マスターズ水泳クラブ」に参加しました',
     NULL,
     v_team2, '/teams/' || v_team2 || '?tab=members', true, '2026-04-10 11:05:00+09'),

    (v_user3, 'payment_charged',
     '2026年4月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', true, '2026-04-10 11:35:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-04-12 PS2-A セッション作成通知（鈴木・佐藤へ）
    -- チーム2の非admin（鈴木=member, 佐藤=member）
    -- ─────────────────────────────────────────────────────────
    (v_user2, 'session_added',
     '「月曜朝練 - 持久力強化」が追加されました',
     '2026年4月16日（月）06:30 | 辰巳国際水泳場',
     v_team2, '/sessions/' || v_ps2_a, true, '2026-04-12 10:00:00+09'),

    (v_user3, 'session_added',
     '「月曜朝練 - 持久力強化」が追加されました',
     '2026年4月16日（月）06:30 | 辰巳国際水泳場',
     v_team2, '/sessions/' || v_ps2_a, true, '2026-04-12 10:00:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-04-14〜15 PS2-A 登録 → 管理者へ通知 + 最小参加数達成
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'session_registered',
     '鈴木 太郎さんが「月曜朝練 - 持久力強化」に申し込みました',
     '2026年4月16日（月）06:30',
     v_team2, '/sessions/' || v_ps2_a, true, '2026-04-14 10:05:00+09'),

    (v_user1, 'session_registered',
     '佐藤 花子さんが「月曜朝練 - 持久力強化」に申し込みました',
     '2026年4月16日（月）06:30',
     v_team2, '/sessions/' || v_ps2_a, true, '2026-04-15 09:05:00+09'),

    -- 3人目登録で最小参加数（3人）を達成 → 管理者へ通知
    (v_user1, 'session_min_reached',
     '「月曜朝練 - 持久力強化」が最小参加人数を達成しました',
     '3名が参加申し込みをしました',
     v_team2, '/sessions/' || v_ps2_a, true, '2026-04-15 09:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-04-15 前日リマインダー（PS2-A）
    -- ─────────────────────────────────────────────────────────
    (v_user2, 'session_reminder',
     '明日のセッションのリマインダー',
     '「月曜朝練 - 持久力強化」が明日開催されます',
     v_team2, '/sessions/' || v_ps2_a, true, '2026-04-15 18:00:00+09'),

    (v_user3, 'session_reminder',
     '明日のセッションのリマインダー',
     '「月曜朝練 - 持久力強化」が明日開催されます',
     v_team2, '/sessions/' || v_ps2_a, true, '2026-04-15 18:00:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-04-16 PS2-A 開催 → 参加費決済
    -- ─────────────────────────────────────────────────────────
    (v_user2, 'payment_charged',
     '「月曜朝練 - 持久力強化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', true, '2026-04-16 06:35:00+09'),

    (v_user3, 'payment_charged',
     '「月曜朝練 - 持久力強化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', true, '2026-04-16 06:35:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-05-01 月謝（鈴木・佐藤）
    -- ─────────────────────────────────────────────────────────
    (v_user2, 'payment_charged',
     '2026年5月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', true, '2026-05-01 09:05:00+09'),

    (v_user3, 'payment_charged',
     '2026年5月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', true, '2026-05-01 09:35:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-05-08 PS2-B セッション作成通知
    -- ─────────────────────────────────────────────────────────
    (v_user2, 'session_added',
     '「木曜夜練 - スプリント特化」が追加されました',
     '2026年5月12日（木）19:30 | 辰巳国際水泳場',
     v_team2, '/sessions/' || v_ps2_b, true, '2026-05-08 10:00:00+09'),

    (v_user3, 'session_added',
     '「木曜夜練 - スプリント特化」が追加されました',
     '2026年5月12日（木）19:30 | 辰巳国際水泳場',
     v_team2, '/sessions/' || v_ps2_b, true, '2026-05-08 10:00:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-05-10〜11 PS2-B 登録
    -- ─────────────────────────────────────────────────────────
    (v_user1, 'session_registered',
     '鈴木 太郎さんが「木曜夜練 - スプリント特化」に申し込みました',
     '2026年5月12日（木）19:30',
     v_team2, '/sessions/' || v_ps2_b, true, '2026-05-10 10:05:00+09'),

    (v_user1, 'session_registered',
     '佐藤 花子さんが「木曜夜練 - スプリント特化」に申し込みました',
     '2026年5月12日（木）19:30',
     v_team2, '/sessions/' || v_ps2_b, true, '2026-05-11 09:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-05-12 PS2-B 開催 → 参加費決済
    -- ─────────────────────────────────────────────────────────
    (v_user2, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', true, '2026-05-12 19:35:00+09'),

    (v_user3, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', true, '2026-05-12 19:35:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-06-02 月謝（鈴木・佐藤）
    -- ─────────────────────────────────────────────────────────
    (v_user2, 'payment_charged',
     '2026年6月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', true, '2026-06-02 09:05:00+09'),

    (v_user3, 'payment_charged',
     '2026年6月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', true, '2026-06-02 09:35:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-06-10〜15 直近のアクション（既読）
    -- ─────────────────────────────────────────────────────────

    -- S1-6 キャンセル → user3 に session_cancelled 通知
    (v_user3, 'session_cancelled',
     '「水曜朝練 - キャンセル（プール設備点検）」がキャンセルされました',
     'プール施設の定期点検のためキャンセルとなりました',
     v_team1, '/sessions/' || v_s1_6_id, true, '2026-06-16 09:00:00+09'),

    -- S1-4 確定セッションへの申し込み（user3 → admins）
    (v_user1, 'session_registered',
     '佐藤 花子さんが「水曜朝練 - 個人メドレー特訓」に申し込みました',
     NULL,
     v_team1, '/sessions/' || v_s1_4_id, true, '2026-06-18 10:05:00+09'),

    (v_user2, 'session_registered',
     '佐藤 花子さんが「水曜朝練 - 個人メドレー特訓」に申し込みました',
     NULL,
     v_team1, '/sessions/' || v_s1_4_id, true, '2026-06-18 10:05:00+09'),

    -- S1-4 回数券 #3 使用（確定セッション登録時に決済済み）
    (v_user3, 'payment_charged',
     '「水曜朝練 - 個人メドレー特訓」の回数券を使用しました',
     '回数券1枚が使用されました（残り7枚）',
     v_team1, '/payments', true, '2026-06-18 10:05:00+09'),

    -- ─────────────────────────────────────────────────────────
    -- 2026-06-20〜現在 直近（未読: is_read = false）
    -- ─────────────────────────────────────────────────────────

    -- 田中 新太郎 → チーム1 参加申請 → admins へ通知
    (v_user1, 'join_request_received',
     'マウントリバー水泳クラブへの参加申請が届きました',
     '田中 新太郎さんが参加を申請しました',
     v_team1, '/teams/' || v_team1 || '?tab=requests', false, '2026-06-20 19:05:00+09'),

    (v_user2, 'join_request_received',
     'マウントリバー水泳クラブへの参加申請が届きました',
     '田中 新太郎さんが参加を申請しました',
     v_team1, '/teams/' || v_team1 || '?tab=requests', false, '2026-06-20 19:05:00+09'),

    -- 近日セッション追加通知（未読）
    (v_user2, 'session_added',
     '「木曜夜練 - スプリント特化」が追加されました',
     NULL,
     v_team2, '/sessions/' || v_s2_2_id, false, '2026-06-22 10:00:00+09'),

    (v_user3, 'session_added',
     '「木曜夜練 - スプリント特化」が追加されました',
     NULL,
     v_team2, '/sessions/' || v_s2_2_id, false, '2026-06-22 10:00:00+09'),

    (v_user2, 'session_added',
     '「月曜朝練 - 持久力強化」が追加されました',
     NULL,
     v_team2, '/sessions/' || v_s2_1_id, false, '2026-06-23 10:00:00+09'),

    (v_user3, 'session_added',
     '「月曜朝練 - 持久力強化」が追加されました',
     NULL,
     v_team2, '/sessions/' || v_s2_1_id, false, '2026-06-23 10:00:00+09'),

    -- S2-2 木曜夜練（confirmed）集金済み → 最新の payment_charged（未読）
    (v_user2, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, now() - interval '6 hours'),

    (v_user3, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, now() - interval '6 hours');

  RAISE NOTICE '=== PHASE 4 完了 ===';
  RAISE NOTICE 'チーム1 過去セッション: 2件（PS1-A: user1+user3 / PS1-B: user3のみ）';
  RAISE NOTICE 'チーム2 過去セッション: 2件（PS2-A: 全員 / PS2-B: user2+user3）';
  RAISE NOTICE '月謝: user2×4ヶ月 + user3×4ヶ月 = 計8件（7月未払い含む）';
  RAISE NOTICE '回数券: 10枚購入 / 過去2枚+確定済1枚 = 残7枚';
  RAISE NOTICE '通知タイプ: team_created / member_joined / session_added / session_registered /';
  RAISE NOTICE '           session_cancelled / session_min_reached / session_reminder /';
  RAISE NOTICE '           payment_charged / join_request_received';
END $$;
