-- ============================================================
-- Rangers デモデータ（完全版 v3 — 2026-06-25）
-- 実行方法: npx supabase db query --linked --file supabase/seed_data.sql
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
--   2026-01-10  チーム1 創設、山田・鈴木 admin 参加
--   2026-02-01  佐藤 チーム1 point_card 参加
--   2026-02-03  佐藤 回数券購入（10枚 ¥9,000）
--   2026-02-11  チーム1 Session A（確定・過去）user3 回数券 #1
--   2026-03-04  チーム1 Session B（確定・過去）user3 回数券 #2
--   2026-04-01  チーム2 創設、山田 admin 参加
--   2026-04-05  鈴木 チーム2 monthly 参加 + 4月月謝支払い
--   2026-04-09  チーム1 Session C（確定・過去）user3 回数券 #3
--   2026-04-10  佐藤 チーム2 monthly 参加 + 4月月謝支払い
--   2026-04-16  チーム2 Session A（確定・過去）
--   2026-05-01  鈴木・佐藤 5月月謝支払い
--   2026-05-12  チーム2 Session B（確定・過去）
--   2026-05-14  チーム1 Session D（確定・過去）user3 回数券 #4
--   2026-06-02  鈴木・佐藤 6月月謝支払い
--   2026-06-09  チーム2 Session C（確定・過去）
--   2026-06-20  田中 新規登録 + チーム1 参加申請（pending）
--   2026-06-25  本日（現在）
--   （未来）    各チームの開催予定セッション（回数券 #5 使用含む）
--
-- ▼ アドミン支払いポリシー
--   admin ロールのメンバーは支払いが一切発生しない
--   セッション参加は payment_status='free'、会費レコードも作成しない
--
-- ▼ 回数券残枚数
--   佐藤 購入: 10枚 / 過去4セッション + 確定済み1セッション = 5枚使用 / 残5枚
--
-- ▼ 現金払いデモシナリオ
--   チーム2 月曜朝練（+3日後）: 鈴木・佐藤が現金払い pending
--   → 管理者が集金管理フィルターで「現金のみ」表示して集金状況を確認

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

  -- ──────────────────────────────────────────────────────────
  -- test1: 山田 健太（上級 / 両チーム admin・コーチ / 支払いなし）
  -- ──────────────────────────────────────────────────────────
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

  -- ──────────────────────────────────────────────────────────
  -- test2: 鈴木 太郎（中級 / チーム1 admin・チーム2 monthly member）
  -- 体験: 管理者視点（チーム1）+ 一般メンバー視点（チーム2）を切り替え可能
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
    bio                       = '東京都在住。学生時代は水泳部に所属し、社会人になってからブランクがありましたが、40歳を機に復帰。山田コーチに誘われてマウントリバーの副代表も務めながら、東京マスターズには月謝制で参加中。週2〜3回のペースで練習を続けています。',
    career                    = '大学水泳部出身（平泳ぎ専門）。20年のブランクを経て2010年にマスターズ水泳に参加。2026年1月よりマウントリバー水泳クラブ副代表兼コーチ。',
    achievements              = '2021年 東京マスターズ記録会 100m 平泳ぎ 自己ベスト更新（1:28.5）' || chr(10) ||
                                '2024年 山梨マスターズ記録会 50m 平泳ぎ 出場',
    target_ages               = ARRAY['大人（19歳〜）'],
    onboarding_completed_at   = '2026-01-05 09:00:00+09'
  WHERE id = v_user2;

  -- ──────────────────────────────────────────────────────────
  -- test3: 佐藤 花子（中級 / チーム1 point_card・チーム2 monthly）
  -- 体験: 回数券と月謝の異なる会費タイプ・複数チーム所属
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

  -- ──────────────────────────────────────────────────────────
  -- test4: 田中 新太郎（初級 / 新規アカウント・チーム未所属）
  -- 体験: 参加申請〜承認待ちの状態。公開チームページからの申請フロー確認可能
  -- ──────────────────────────────────────────────────────────
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
  -- 料金体系: セッション参加費 + 回数券 / 月謝・年会費なし
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
  -- admin×2 (支払いなし) / point_card×1 (stamp_remaining=5: 10枚購入-5枚使用)
  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team1, v_user1, 'admin',  'annual',     0, '2026-01-10 09:00:00+09'),
    (v_team1, v_user2, 'admin',  'annual',     0, '2026-01-15 10:00:00+09'),
    (v_team1, v_user3, 'member', 'point_card', 5, '2026-02-01 11:00:00+09');

  -- ==========================================================
  -- チーム2: 東京マスターズ水泳クラブ
  -- 料金体系: セッション参加費 + 月謝（¥3,000/月）
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

  -- S1-1: 水曜朝練（+5日, open, 回数券OK）
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

  -- S1-2: 土曜スピード練習（+10日, open, 中上級向け）
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

  -- S1-4: 個人メドレー特訓（+17日, confirmed）← 全員参加・回数券5枚目使用
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

  -- S1-2 土曜スピード: 登録なし（新規セッション感）

  -- S1-3 ミーティング（無料）: user2・user3 free
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_3, v_user2, true, 'cash', 'free'),
    (v_s1_3, v_user3, true, 'cash', 'free');

  -- S1-4 個人メドレー特訓（confirmed）: 全員参加
  -- admin は free / user3 は point_card paid（回数券5枚目 = 残5枚）
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_4, v_user1, true, 'cash',       'free'),
    (v_s1_4, v_user2, true, 'cash',       'free'),
    (v_s1_4, v_user3, true, 'point_card', 'paid');

  -- S1-5 夏季合宿（open）: user3 cash pending（現金払いオプション）
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s1_5, v_user3, true, 'cash', 'pending');

  -- S1-6 キャンセル済み: user3 が参加していた（cancelled_at あり）
  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, cancelled_at)
  VALUES
    (v_s1_6, v_user3, true, 'point_card', 'pending', (now() - interval '10 days'));

  -- ==========================================================
  -- セッション: チーム2（東京マスターズ）5件
  -- ==========================================================

  -- S2-1: 月曜朝練（+3日, open）← 現金払いフィルター デモセッション
  -- user2・user3 が現金払い pending → 管理者が集金管理フィルターで確認
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
  -- user1(admin) free / user2 cash pending / user3 cash pending
  INSERT INTO session_registrations (session_id, swimmer_id, is_member, payment_method, payment_status) VALUES
    (v_s2_1, v_user1, true, 'cash', 'free'),
    (v_s2_1, v_user2, true, 'cash', 'pending'),
    (v_s2_1, v_user3, true, 'cash', 'pending');

  -- S2-2 木曜夜練（+8日, confirmed）: 全員参加
  -- admin free / monthly members cash paid（開催確定後に集金済み）
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
-- PHASE 4: 過去の確定済みセッション + 会費 + 回数券 + 通知
-- ============================================================
DO $$
DECLARE
  v_user1  uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730';
  v_user2  uuid := '9d30728f-96e9-4415-9823-97040111ad22';
  v_user3  uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a';
  v_team1  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_team2  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  v_ps1_a uuid;
  v_ps1_b uuid;
  v_ps1_c uuid;
  v_ps1_d uuid;
  v_ps2_a uuid;
  v_ps2_b uuid;
  v_ps2_c uuid;
BEGIN

  -- ==========================================================
  -- チーム1 過去セッション × 4（全て confirmed）
  -- user3 が毎回 point_card paid（回数券 #1〜#4）
  -- admin（user1・user2）は free
  -- ==========================================================

  -- PS1-A: 2026-02-11 水曜朝練（チーム1 最初の練習）
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
    (v_ps1_a, v_user2, true, 'cash',       'free', '2026-02-09 11:00:00+09'),
    (v_ps1_a, v_user3, true, 'point_card', 'paid', '2026-02-10 09:00:00+09');

  -- PS1-B: 2026-03-04 土曜スピード練習
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '土曜スピード練習',
    '大会シーズンに向けた強化練習。',
    'アップ 600m / スプリント 8×25m / メインセット 3×100m / ダウン 300m',
    'practice', '2026-03-04 09:00:00+09', '甲府市民プール',
    1000, 1500, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps1_b;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps1_b, v_user2, true, 'cash',       'free', '2026-03-02 10:00:00+09'),
    (v_ps1_b, v_user3, true, 'point_card', 'paid', '2026-03-03 09:00:00+09');

  -- PS1-C: 2026-04-09 水曜朝練
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '水曜朝練 - クロール技術練習',
    'クロールのターン練習に重点を置いた定期練習。',
    'アップ 400m / ターン練習 8×50m / メインセット 2×200m / ダウン 200m',
    'practice', '2026-04-09 07:00:00+09', '甲府市民プール',
    1000, 1500, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps1_c;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps1_c, v_user1, true, 'cash',       'free', '2026-04-07 10:00:00+09'),
    (v_ps1_c, v_user3, true, 'point_card', 'paid', '2026-04-08 09:00:00+09');

  -- PS1-D: 2026-05-14 土曜スピード練習
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team1, v_user1,
    '土曜スピード練習',
    '夏の大会に向けたスプリント強化。タイム計測あり。',
    'アップ 600m / タイム計測 4×50m / メインセット 5×100m / ダウン 300m',
    'practice', '2026-05-14 09:00:00+09', '甲府市民プール',
    1000, 1500, true, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps1_d;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps1_d, v_user2, true, 'cash',       'free', '2026-05-12 10:00:00+09'),
    (v_ps1_d, v_user3, true, 'point_card', 'paid', '2026-05-13 09:00:00+09');

  -- ==========================================================
  -- チーム2 過去セッション × 3（全て confirmed）
  -- user2: 2026-04-05 入会後 / user3: 2026-04-10 入会後
  -- 両者ともに cash paid（現金払いの実績）
  -- ==========================================================

  -- PS2-A: 2026-04-16 月曜朝練（チーム2 初セッション）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '月曜朝練 - 持久力強化',
    '週始めの定期練習。チーム2 初練習。距離をしっかり泳いで持久力を養います。',
    'アップ 600m / キック 6×50m / メインセット 2×400m / ダウン 200m',
    'practice', '2026-04-16 06:30:00+09', '辰巳国際水泳場',
    1200, 2000, false, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps2_a;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps2_a, v_user1, true, 'cash', 'free', '2026-04-14 09:00:00+09'),
    (v_ps2_a, v_user2, true, 'cash', 'paid', '2026-04-14 10:00:00+09'),
    (v_ps2_a, v_user3, true, 'cash', 'paid', '2026-04-15 09:00:00+09');

  -- PS2-B: 2026-05-12 木曜夜練
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
    (v_ps2_b, v_user1, true, 'cash', 'free', '2026-05-10 09:00:00+09'),
    (v_ps2_b, v_user2, true, 'cash', 'paid', '2026-05-10 10:00:00+09'),
    (v_ps2_b, v_user3, true, 'cash', 'paid', '2026-05-11 09:00:00+09');

  -- PS2-C: 2026-06-09 月曜朝練
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team2, v_user1,
    '月曜朝練 - 持久力強化',
    '先月に比べてペース向上。タイム計測セットを追加。',
    'アップ 600m / キック 6×50m / タイム計測 4×100m / メインセット 400m / ダウン 200m',
    'practice', '2026-06-09 06:30:00+09', '辰巳国際水泳場',
    1200, 2000, false, false, 'confirmed', 'published'
  ) RETURNING id INTO v_ps2_c;

  INSERT INTO session_registrations
    (session_id, swimmer_id, is_member, payment_method, payment_status, registered_at)
  VALUES
    (v_ps2_c, v_user1, true, 'cash', 'free', '2026-06-07 09:00:00+09'),
    (v_ps2_c, v_user2, true, 'cash', 'paid', '2026-06-07 10:00:00+09'),
    (v_ps2_c, v_user3, true, 'cash', 'paid', '2026-06-08 09:00:00+09');

  -- ==========================================================
  -- 回数券購入履歴（佐藤 花子 / チーム1）
  -- 2026-02-01 入会 → 2026-02-03 回数券購入（10枚 ¥9,000）
  -- ==========================================================
  INSERT INTO stamp_purchases (team_id, swimmer_id, card_count, stamp_count, amount, purchased_at)
  VALUES (v_team1, v_user3, 1, 10, 9000, '2026-02-03 12:00:00+09');

  -- ==========================================================
  -- 月謝記録（チーム2 / 鈴木・佐藤）
  -- 入会日以降の月分のみ
  -- user2: joined 2026-04-05 → 4月〜6月 paid + 7月 unpaid
  -- user3: joined 2026-04-10 → 4月〜6月 paid + 7月 unpaid
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
  -- 通知（payment_charged / is_read = false が基本）
  -- 時系列順で挿入
  -- ==========================================================
  INSERT INTO notifications (user_id, type, title, body, team_id, link, is_read, created_at) VALUES

    -- ─── 佐藤: 回数券購入（2026-02-03）───
    (v_user3, 'payment_charged',
     '回数券を購入しました（10枚）',
     '¥9,000が引き落とされました',
     v_team1, '/payments', false, '2026-02-03 12:00:00+09'),

    -- ─── 佐藤: チーム1 回数券使用 × 4（PS1-A〜D）───
    (v_user3, 'payment_charged',
     '「水曜朝練 - クロール技術練習」の回数券を使用しました',
     '回数券1枚が使用されました（残り9枚）',
     v_team1, '/payments', false, '2026-02-11 07:00:00+09'),

    (v_user3, 'payment_charged',
     '「土曜スピード練習」の回数券を使用しました',
     '回数券1枚が使用されました（残り8枚）',
     v_team1, '/payments', false, '2026-03-04 09:00:00+09'),

    (v_user3, 'payment_charged',
     '「水曜朝練 - クロール技術練習」の回数券を使用しました',
     '回数券1枚が使用されました（残り7枚）',
     v_team1, '/payments', false, '2026-04-09 07:00:00+09'),

    -- ─── 鈴木: チーム2 4月月謝（2026-04-05）───
    (v_user2, 'payment_charged',
     '2026年4月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', false, '2026-04-05 10:30:00+09'),

    -- ─── 佐藤: チーム2 4月月謝（2026-04-10）───
    (v_user3, 'payment_charged',
     '2026年4月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', false, '2026-04-10 11:30:00+09'),

    -- ─── 鈴木・佐藤: チーム2 PS2-A セッション参加費（2026-04-16）───
    (v_user2, 'payment_charged',
     '「月曜朝練 - 持久力強化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, '2026-04-16 06:30:00+09'),

    (v_user3, 'payment_charged',
     '「月曜朝練 - 持久力強化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, '2026-04-16 06:30:00+09'),

    -- ─── 鈴木・佐藤: 5月月謝（2026-05-01）───
    (v_user2, 'payment_charged',
     '2026年5月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', false, '2026-05-01 09:00:00+09'),

    (v_user3, 'payment_charged',
     '2026年5月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', false, '2026-05-01 09:30:00+09'),

    -- ─── 鈴木・佐藤: チーム2 PS2-B セッション参加費（2026-05-12）───
    (v_user2, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, '2026-05-12 19:30:00+09'),

    (v_user3, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, '2026-05-12 19:30:00+09'),

    -- ─── 佐藤: チーム1 回数券使用 #4（2026-05-14）───
    (v_user3, 'payment_charged',
     '「土曜スピード練習」の回数券を使用しました',
     '回数券1枚が使用されました（残り6枚）',
     v_team1, '/payments', false, '2026-05-14 09:00:00+09'),

    -- ─── 鈴木・佐藤: 6月月謝（2026-06-02）───
    (v_user2, 'payment_charged',
     '2026年6月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', false, '2026-06-02 09:00:00+09'),

    (v_user3, 'payment_charged',
     '2026年6月の月謝が引き落とされました',
     '¥3,000が引き落とされました',
     v_team2, '/payments', false, '2026-06-02 09:30:00+09'),

    -- ─── 鈴木・佐藤: チーム2 PS2-C セッション参加費（2026-06-09）───
    (v_user2, 'payment_charged',
     '「月曜朝練 - 持久力強化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, '2026-06-09 06:30:00+09'),

    (v_user3, 'payment_charged',
     '「月曜朝練 - 持久力強化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', false, '2026-06-09 06:30:00+09'),

    -- ─── 佐藤: チーム1 個人メドレー特訓（確定済み未来セッション）回数券 #5（最近）───
    (v_user3, 'payment_charged',
     '「水曜朝練 - 個人メドレー特訓」の回数券を使用しました',
     '回数券1枚が使用されました（残り5枚）',
     v_team1, '/payments', true, now() - interval '6 hours'),

    -- ─── 鈴木・佐藤: チーム2 木曜夜練（確定済み未来セッション）集金済み（最近）───
    (v_user2, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', true, now() - interval '6 hours'),

    (v_user3, 'payment_charged',
     '「木曜夜練 - スプリント特化」の参加費が決済されました',
     '¥1,200が引き落とされました',
     v_team2, '/payments', true, now() - interval '6 hours');

  RAISE NOTICE '=== PHASE 4 完了 ===';
  RAISE NOTICE 'チーム1 過去セッション: 4件（user3 回数券#1〜#4）';
  RAISE NOTICE 'チーム2 過去セッション: 3件（user2・user3 現金払い）';
  RAISE NOTICE '月謝: user2×4ヶ月 + user3×4ヶ月 = 計8件（7月未払い含む）';
  RAISE NOTICE '回数券: 1件（10枚 ¥9,000 / 2026-02-03）';
  RAISE NOTICE '通知: 時系列順 計22件';
  RAISE NOTICE '時系列整合性: 入会→会費支払い→セッション参加→決済 の順序を保証';
END $$;
