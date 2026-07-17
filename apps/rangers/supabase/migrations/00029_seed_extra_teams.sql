-- 追加デモデータ: チーム4件 + パーソナル3件 + 各セッション
-- 冪等性: 先に削除してから挿入

DO $$
DECLARE
  -- 既存ユーザー
  v_user1 uuid := '530b3d24-ca9c-4cf5-b9e9-a6966a913730'; -- 山田 健太
  v_user2 uuid := '9d30728f-96e9-4415-9823-97040111ad22'; -- 鈴木 太郎
  v_user3 uuid := '3e281812-1e3d-4522-91ca-690aa7d9d14a'; -- 佐藤 花子
  v_user4 uuid := '8e538fba-2637-4abf-aa9f-5b784cb2f561'; -- 田中 新太郎
  v_user5 uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc'; -- 田中 小太郎

  -- 新規チーム
  v_team3 uuid := 'dddddddd-dddd-dddd-dddd-000000000001'; -- 大阪スイミングクラブ
  v_team4 uuid := 'dddddddd-dddd-dddd-dddd-000000000002'; -- 横浜トライスイマーズ
  v_team5 uuid := 'dddddddd-dddd-dddd-dddd-000000000003'; -- 福岡マスターズ
  v_team6 uuid := 'dddddddd-dddd-dddd-dddd-000000000004'; -- 京都スイミングサークル

  -- 新規パーソナル
  v_team7 uuid := 'dddddddd-dddd-dddd-dddd-000000000005'; -- 山田コーチパーソナル
  v_team8 uuid := 'dddddddd-dddd-dddd-dddd-000000000006'; -- 鈴木コーチパーソナル
  v_team9 uuid := 'dddddddd-dddd-dddd-dddd-000000000007'; -- 佐藤コーチパーソナル

  -- Supabase Storage ベースURL
  v_storage text := 'https://jeosqnkeyiwapeeujrml.supabase.co/storage/v1/object/public/teams/seed';

BEGIN

  -- ===========================================================
  -- クリーンアップ（冪等性）
  -- ===========================================================
  DELETE FROM practice_sessions WHERE team_id IN (v_team3, v_team4, v_team5, v_team6, v_team7, v_team8, v_team9);
  DELETE FROM team_members      WHERE team_id IN (v_team3, v_team4, v_team5, v_team6, v_team7, v_team8, v_team9);
  DELETE FROM teams             WHERE id       IN (v_team3, v_team4, v_team5, v_team6, v_team7, v_team8, v_team9);

  -- ===========================================================
  -- チーム3: 大阪スイミングクラブ（coach=user2, 月謝制）
  -- ===========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session, is_recruiting,
    activity_area, status, team_type,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone, created_at
  ) VALUES (
    v_team3, v_user2,
    '大阪スイミングクラブ',
    '大阪府大阪市を拠点に活動するマスターズ水泳チーム。月・木・土の週3回、なみはや大橋プールで練習しています。月謝制で安定して練習できる環境です。年齢・レベル問わず大歓迎！社会人から定年後の方まで幅広いメンバーが在籍しています。',
    v_storage || '/seed_team_osaka.jpg',
    v_storage || '/seed_team_osaka.jpg',
    1000, 1800,
    NULL, 4000,
    3, NULL, NULL,
    true, false, true, false,
    true, true,
    '大阪府大阪市', 'active', 'team',
    '週2〜4回', ARRAY['月', '木', '土'], 'なみはや大橋プール（大阪府大阪市此花区）',
    'info@osaka-swimming.example.jp', '0661230001',
    '2026-02-15 09:00:00+09'
  );

  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team3, v_user2, 'admin',  'monthly', 0, '2026-02-15 09:00:00+09'),
    (v_team3, v_user4, 'member', 'monthly', 0, '2026-02-20 10:00:00+09');

  -- チーム3 セッション（3件）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team3, v_user2,
    '月曜定期練習 - 持久力強化',
    '月謝制メンバー向け定期練習。有酸素系メニューを中心に2000〜3000mを泳ぎます。初心者も丁寧にサポートします。',
    'アップ 400m（自由）'              || chr(10) ||
    'キック 4×100m（板キック）'        || chr(10) ||
    'プル 4×100m（パドル）'            || chr(10) ||
    'メインセット 8×200m（3:30/本）'   || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '3 days')::date + time '19:00',
    'なみはや大橋プール',
    1000, 1800,
    (now() + interval '2 days')::date + time '20:00', 4, 16,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team3, v_user2,
    '木曜練習 - IM強化',
    '個人メドレー（IM）の各種目を集中強化します。バタフライ・背泳ぎ・平泳ぎ・クロールを丁寧に指導。',
    'アップ 400m（IM）'                           || chr(10) ||
    'ドリル 4×50m × 4種目'                       || chr(10) ||
    'IM練習 4×100m IM'                           || chr(10) ||
    'メインセット 6×100m（各種目2本ずつ）'        || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '6 days')::date + time '19:00',
    'なみはや大橋プール',
    1000, 1800,
    (now() + interval '5 days')::date + time '20:00', 4, 16,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team3, v_user2,
    '大阪マスターズ春季記録会 参加説明会',
    '5月開催の大阪マスターズ春季記録会への参加に向けた説明会。エントリー方法・当日の流れ・応援の仕方を共有します。',
    '・大阪マスターズ春季大会の概要説明'          || chr(10) ||
    '・エントリー種目の相談'                      || chr(10) ||
    '・当日タイムテーブルの確認'                  || chr(10) ||
    '・軽い調整練習 500m',
    'meeting',
    (now() + interval '14 days')::date + time '10:00',
    'なみはや大橋プール 会議室',
    0, 0,
    (now() + interval '12 days')::date + time '20:00', 2, 20,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  -- ===========================================================
  -- チーム4: 横浜トライスイマーズ（coach=user3, 年会費制）
  -- ===========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session, is_recruiting,
    activity_area, status, team_type,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone, created_at
  ) VALUES (
    v_team4, v_user3,
    '横浜トライスイマーズ',
    '神奈川県横浜市を拠点にトライアスロンを目指すスイマーのためのチーム。横浜国際プールで毎週土・日に練習。年会費制でコスパよく参加できます。オープンウォーターの大会にも積極参加しています。',
    v_storage || '/seed_team_yokohama.jpg',
    v_storage || '/seed_team_yokohama.jpg',
    800, 1500,
    30000, NULL,
    5, NULL, NULL,
    true, true, false, false,
    true, true,
    '神奈川県横浜市', 'active', 'team',
    '週1〜2回', ARRAY['土', '日'], '横浜国際プール（神奈川県横浜市港北区小机町3300）',
    'tri@yokohama-trisw.example.jp', '0452010002',
    '2026-03-01 10:00:00+09'
  );

  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team4, v_user3, 'admin',  'annual', 0, '2026-03-01 10:00:00+09'),
    (v_team4, v_user5, 'member', 'annual', 0, '2026-03-10 11:00:00+09');

  -- チーム4 セッション（3件）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team4, v_user3,
    '土曜早朝練習 - オープンウォータースキル',
    'トライアスロン向けのオープンウォータースキルを習得します。ドラフティング・サイティング・スタート練習を重点的に行います。',
    'アップ 600m（クロール＋背泳ぎ混走）'          || chr(10) ||
    'サイティング練習 10×50m'                     || chr(10) ||
    'ドラフティング練習（2〜3人ペア）'             || chr(10) ||
    'メインセット 4×500m（実戦ペース）'            || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '4 days')::date + time '06:30',
    '横浜国際プール',
    800, 1500,
    (now() + interval '3 days')::date + time '22:00', 4, 20,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team4, v_user3,
    '日曜スピード強化練習',
    'タイムトライアル中心のスピード強化練習。100m・200mの記録を伸ばすためのインターバル練習を行います。',
    'アップ 800m'                                 || chr(10) ||
    'スピードドリル 8×25m（最速）'                || chr(10) ||
    'インターバル 10×100m（r:30s）'               || chr(10) ||
    'タイムトライアル 1×200m'                     || chr(10) ||
    'クールダウン 400m',
    'practice',
    (now() + interval '5 days')::date + time '08:00',
    '横浜国際プール',
    800, 1500,
    (now() + interval '4 days')::date + time '22:00', 4, 20,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team4, v_user3,
    '横浜トライアスロン夏合宿 2026',
    '2泊3日の夏合宿。1日3セッション・合計25000m予定。技術指導・栄養セミナー・チームビルディングも含みます。',
    '【1日目】アップ練習＋技術講習'                || chr(10) ||
    '【2日目】午前：長距離セット / 午後：スピード' || chr(10) ||
    '【3日目】タイムトライアル＋クールダウン'      || chr(10) ||
    '※宿泊費・食費は別途',
    'camp',
    (now() + interval '45 days')::date + time '09:00',
    '伊豆大島海洋スポーツセンター（仮）',
    5000, 8000,
    (now() + interval '30 days')::date + time '23:59', 6, 24,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  -- ===========================================================
  -- チーム5: 福岡マスターズ（coach=user4, 回数券制）
  -- ===========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session, is_recruiting,
    activity_area, status, team_type,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone, created_at
  ) VALUES (
    v_team5, v_user4,
    '福岡マスターズ',
    '福岡県福岡市を拠点とする本格的なマスターズ水泳チーム。火・金曜日に福岡市総合体育館プールで活動中。回数券制なので自分のスケジュールに合わせて参加できます。全国マスターズ大会入賞メンバーも多数在籍！',
    v_storage || '/seed_team_fukuoka.jpg',
    v_storage || '/seed_team_fukuoka.jpg',
    1200, 2000,
    NULL, NULL,
    3, 10, 10000,
    true, false, false, true,
    false, true,
    '福岡県福岡市', 'active', 'team',
    '週1〜2回', ARRAY['火', '金'], '福岡市総合体育館プール（福岡県福岡市博多区東平尾公園2-1-1）',
    'fukuoka.masters@example.jp', '0924000003',
    '2026-01-20 09:00:00+09'
  );

  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team5, v_user4, 'admin',  'point_card', 0, '2026-01-20 09:00:00+09'),
    (v_team5, v_user1, 'member', 'point_card', 5, '2026-02-01 10:00:00+09');

  -- チーム5 セッション（4件）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team5, v_user4,
    '火曜練習 - 平泳ぎ専門強化',
    '平泳ぎの技術向上に特化した練習。キックのタイミング・グライドの長さ・プルの引き方を細かく指導します。',
    'アップ 400m（クロール）'                     || chr(10) ||
    '平泳ぎドリル 8×50m（各種ドリル）'            || chr(10) ||
    'テクニカル 6×100m 平泳ぎ'                   || chr(10) ||
    'メインセット 4×200m 平泳ぎ'                  || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '2 days')::date + time '19:30',
    '福岡市総合体育館プール',
    1200, 2000,
    (now() + interval '1 days')::date + time '22:00', 3, 12,
    '[]'::jsonb, true, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team5, v_user4,
    '金曜練習 - バタフライ強化',
    'バタフライを徹底的に磨きます。ダウンスイープ・インスイープ・タイミングを個別フィードバック付きで指導。',
    'アップ 400m（IM順）'                         || chr(10) ||
    'バタフライドリル 6×50m'                      || chr(10) ||
    'テクニカル 8×50m BF'                        || chr(10) ||
    'メインセット 4×100m BF（r:40s）'             || chr(10) ||
    'ダウン 200m',
    'practice',
    (now() + interval '5 days')::date + time '19:30',
    '福岡市総合体育館プール',
    1200, 2000,
    (now() + interval '4 days')::date + time '22:00', 3, 12,
    '[]'::jsonb, true, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team5, v_user4,
    '九州マスターズ夏季大会 壮行会',
    '8月開催の九州マスターズ夏季大会に向けた壮行会。最終確認練習・戦略ミーティングを行います。',
    '・種目別最終アドバイス'                       || chr(10) ||
    '・調整練習 1000m'                            || chr(10) ||
    '・大会当日の流れ確認'                         || chr(10) ||
    '・懇親会（任意）',
    'meeting',
    (now() + interval '20 days')::date + time '18:00',
    '福岡市総合体育館プール',
    0, 0,
    (now() + interval '18 days')::date + time '22:00', 2, 20,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team5, v_user4,
    '九州マスターズ夏季大会',
    '九州マスターズ水泳大会。メンバー全員で出場します。ぜひ応援にも来てください！',
    '・大会当日の集合・受付'                       || chr(10) ||
    '・アップ練習（大会プール）'                    || chr(10) ||
    '・各自エントリー種目への出場'                  || chr(10) ||
    '・表彰式・記念撮影',
    'competition',
    (now() + interval '35 days')::date + time '08:00',
    '福岡県立総合プール',
    0, 0,
    (now() + interval '25 days')::date + time '23:59', 1, 50,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  -- ===========================================================
  -- チーム6: 京都スイミングサークル（coach=user5, セッション料金のみ）
  -- ===========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session, is_recruiting,
    activity_area, status, team_type,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone, created_at
  ) VALUES (
    v_team6, v_user5,
    '京都スイミングサークル',
    '京都府京都市を拠点とする社会人水泳サークル。毎週土曜日に京都アクアリーナで活動中。ゆるく楽しく泳ぐことをモットーに、競技よりも健康・交流を大切にしています。初心者・復帰者も大歓迎！',
    v_storage || '/seed_team_kyoto.jpg',
    v_storage || '/seed_team_kyoto.jpg',
    600, 1000,
    NULL, NULL,
    2, NULL, NULL,
    true, false, false, false,
    false, true,
    '京都府京都市', 'active', 'team',
    '週0〜1回（月3回程度）', ARRAY['土'], '京都アクアリーナ（京都府京都市右京区西京極総合運動公園内）',
    'kyoto.swim@example.jp', '0757770004',
    '2026-04-15 10:00:00+09'
  );

  INSERT INTO team_members (team_id, swimmer_id, role, membership_type, stamp_remaining, joined_at) VALUES
    (v_team6, v_user5, 'admin',  'annual', 0, '2026-04-15 10:00:00+09'),
    (v_team6, v_user3, 'member', 'annual', 0, '2026-04-20 11:00:00+09');

  -- チーム6 セッション（3件）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team6, v_user5,
    '土曜のんびり練習',
    '気軽に泳ぎましょう！タイムや距離にこだわらず、自分のペースで参加できます。泳ぎ方を教えてほしい方も気軽にどうぞ。',
    '・各自自由練習 1000〜2000m（目安）'           || chr(10) ||
    '・希望者にはフォームチェック'                 || chr(10) ||
    '・練習後に希望者でカフェへ',
    'practice',
    (now() + interval '5 days')::date + time '10:00',
    '京都アクアリーナ',
    600, 1000,
    (now() + interval '4 days')::date + time '22:00', 2, 12,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team6, v_user5,
    '土曜テーマ練習 - 息継ぎをマスターしよう',
    '「息継ぎが苦手…」という方向けの集中練習。ローテーション呼吸・バイラテラル呼吸をわかりやすく解説します。',
    'アップ 200m（自由）'                          || chr(10) ||
    '呼吸ドリル 6×50m（片側・両側）'              || chr(10) ||
    '練習セット 4×100m（バイラテラル）'            || chr(10) ||
    '自由練習 300m',
    'practice',
    (now() + interval '12 days')::date + time '10:00',
    '京都アクアリーナ',
    600, 1000,
    (now() + interval '11 days')::date + time '22:00', 2, 12,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team6, v_user5,
    '新メンバー歓迎イベント & BBQ',
    '春の新メンバー歓迎イベント！午前中は軽く泳いで、午後はBBQで交流しましょう。水泳が初めての方も大歓迎。',
    '・午前：軽い自由練習（任意）'                 || chr(10) ||
    '・昼食：BBQ（食材費別途500円）'               || chr(10) ||
    '・自己紹介・懇親タイム',
    'event',
    (now() + interval '21 days')::date + time '10:00',
    '京都アクアリーナ＆近隣公園',
    600, 600,
    (now() + interval '18 days')::date + time '22:00', 4, 20,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  -- ===========================================================
  -- パーソナル7: 山田健太コーチのパーソナル指導（coach=user1）
  -- ===========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session, is_recruiting,
    activity_area, status, team_type,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone, created_at
  ) VALUES (
    v_team7, v_user1,
    '山田健太コーチのパーソナル指導',
    'マスターズ水泳歴10年以上の山田コーチによるマンツーマン指導。山梨・東京エリアのプールで対応可能です。タイム向上・フォーム改善・大会対策など、目標に合わせてプログラムをカスタマイズします。',
    v_storage || '/seed_personal_yamada.jpg',
    v_storage || '/seed_personal_yamada.jpg',
    NULL, 8000,
    NULL, NULL,
    3, NULL, NULL,
    false, false, false, false,
    false, true,
    '山梨県・東京都', 'active', 'personal',
    '週1〜2回', ARRAY['土', '日'], NULL,
    'yamada.coach@example.jp', '090-0001-0001',
    '2026-05-01 10:00:00+09'
  );

  -- パーソナル7 セッション（3件）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team7, v_user1,
    '【山田コーチ】パーソナルレッスン - クロール集中60分',
    '1対1でクロールを徹底指導。動画撮影フィードバック付き。水慣れから大会対策まで、どんなレベルにも対応します。',
    '・ウォームアップ・現状確認'                   || chr(10) ||
    '・フォーム動画撮影 & 分析'                    || chr(10) ||
    '・課題別ドリル 4〜6種'                        || chr(10) ||
    '・通し泳ぎ & フィードバック'                  || chr(10) ||
    '※水着・ゴーグル・キャップをご持参ください',
    'practice',
    (now() + interval '6 days')::date + time '09:00',
    '甲府市民プール',
    8000, 8000,
    (now() + interval '5 days')::date + time '20:00', 1, 1,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team7, v_user1,
    '【山田コーチ】パーソナルレッスン - 大会直前対策60分',
    '大会前の最終調整。レース戦略・スタート・ターン・フィニッシュを重点的に仕上げます。',
    '・ウォームアップ 400m'                       || chr(10) ||
    '・スタート練習 8本'                           || chr(10) ||
    '・ターン練習 10本'                            || chr(10) ||
    '・模擬レース & フィードバック'                || chr(10) ||
    '・レース当日のアドバイス',
    'practice',
    (now() + interval '13 days')::date + time '10:00',
    '辰巳国際水泳場（東京）',
    8000, 8000,
    (now() + interval '12 days')::date + time '20:00', 1, 1,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team7, v_user1,
    '【山田コーチ】グループレッスン（3〜4名）- フォーム総合改善',
    '3〜4名の小グループで行うお得なレッスン。全4泳法のフォームを順番にチェックします。',
    '・アップ 300m'                               || chr(10) ||
    '・クロール・背泳ぎドリル'                     || chr(10) ||
    '・平泳ぎ・バタフライドリル'                   || chr(10) ||
    '・通し泳ぎ & 個別フィードバック',
    'practice',
    (now() + interval '20 days')::date + time '10:00',
    '甲府市民プール',
    5000, 5000,
    (now() + interval '18 days')::date + time '20:00', 3, 4,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  -- ===========================================================
  -- パーソナル8: 鈴木太郎コーチのパーソナルレッスン（coach=user2）
  -- ===========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session, is_recruiting,
    activity_area, status, team_type,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone, created_at
  ) VALUES (
    v_team8, v_user2,
    '鈴木太郎コーチのパーソナルレッスン',
    '東京都新宿区エリアを中心に活動するパーソナルコーチ。水泳初心者から中級者まで幅広く対応。「泳げるようになりたい」から「タイムを上げたい」まで、丁寧にサポートします。',
    v_storage || '/seed_personal_suzuki.jpg',
    v_storage || '/seed_personal_suzuki.jpg',
    NULL, 6000,
    NULL, NULL,
    2, NULL, NULL,
    false, false, false, false,
    false, true,
    '東京都新宿区', 'active', 'personal',
    '週1〜2回', ARRAY['水', '土'], NULL,
    'suzuki.coach@example.jp', '090-0002-0002',
    '2026-04-01 10:00:00+09'
  );

  -- パーソナル8 セッション（3件）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team8, v_user2,
    '【鈴木コーチ】水泳初心者レッスン 60分',
    '泳いだことがない・泳ぎが苦手な方でも安心。水慣れから平泳ぎの基礎まで丁寧に指導します。',
    '・水慣れ・バタ足'                            || chr(10) ||
    '・ビート板を使った基礎練習'                   || chr(10) ||
    '・平泳ぎ基礎（キック → プル → 通し）'        || chr(10) ||
    '・25m完泳チャレンジ',
    'practice',
    (now() + interval '4 days')::date + time '19:00',
    '新宿スポーツセンタープール',
    6000, 6000,
    (now() + interval '3 days')::date + time '20:00', 1, 1,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team8, v_user2,
    '【鈴木コーチ】クロール中級レッスン 60分',
    '25mは泳げるけどもっと速く・楽に泳ぎたい方向け。腕の軌道・ローリング・ストローク数を改善します。',
    'アップ 200m'                                 || chr(10) ||
    '・ストロークカウント計測'                     || chr(10) ||
    '・キャッチ＆プルドリル'                       || chr(10) ||
    '・ローリング練習 6×50m'                      || chr(10) ||
    '・最終計測 & フィードバック',
    'practice',
    (now() + interval '7 days')::date + time '10:00',
    '新宿スポーツセンタープール',
    6000, 6000,
    (now() + interval '6 days')::date + time '20:00', 1, 1,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team8, v_user2,
    '【鈴木コーチ】親子レッスン - 水慣れから25m泳法習得',
    '親子で参加できる特別レッスン。お子さんの水慣れから始め、保護者の方も一緒に楽しめます。',
    '・水慣れ（親子ペア）'                         || chr(10) ||
    '・バタ足練習'                                 || chr(10) ||
    '・25m挑戦（子ども）'                          || chr(10) ||
    '・保護者向けアドバイス',
    'practice',
    (now() + interval '15 days')::date + time '10:00',
    '新宿スポーツセンタープール',
    4000, 4000,
    (now() + interval '13 days')::date + time '20:00', 1, 2,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  -- ===========================================================
  -- パーソナル9: 佐藤花子コーチの女性向け水泳レッスン（coach=user3）
  -- ===========================================================
  INSERT INTO teams (
    id, coach_id, name, description, avatar_url, cover_image_url,
    default_member_price, default_guest_price,
    annual_fee_amount, monthly_fee_amount,
    cancellation_days, point_card_count, point_card_price,
    has_session_fee, has_annual_fee, has_monthly_fee, has_point_card,
    fee_members_exempt_session, is_recruiting,
    activity_area, status, team_type,
    practice_frequency, practice_days, main_pool,
    contact_email, contact_phone, created_at
  ) VALUES (
    v_team9, v_user3,
    '佐藤花子コーチの女性向け水泳レッスン',
    '千葉県千葉市を中心に活動する女性専門コーチ。女性ならではの悩み（ダイエット・姿勢改善・疲れにくい泳ぎ方）に特化した指導が好評です。リラックスした雰囲気でお体のケアから競技まで幅広く対応。',
    v_storage || '/seed_personal_sato.jpg',
    v_storage || '/seed_personal_sato.jpg',
    NULL, 5000,
    NULL, NULL,
    2, NULL, NULL,
    false, false, false, false,
    false, true,
    '千葉県千葉市', 'active', 'personal',
    '週1〜2回', ARRAY['火', '金'], NULL,
    'sato.coach@example.jp', '090-0003-0003',
    '2026-03-15 10:00:00+09'
  );

  -- パーソナル9 セッション（3件）
  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team9, v_user3,
    '【佐藤コーチ】女性向けダイエット水泳レッスン 60分',
    '有酸素運動としての水泳を最大限に活かすプログラム。消費カロリーを高めながら楽しく続けられる泳ぎ方を指導します。',
    '・ウォームアップ（ウォーキング）'              || chr(10) ||
    '・有酸素インターバル 8×50m'                  || chr(10) ||
    '・体幹を意識したキック練習'                   || chr(10) ||
    '・背泳ぎ・クロール交互泳'                     || chr(10) ||
    '・ストレッチ & クールダウン',
    'practice',
    (now() + interval '2 days')::date + time '10:00',
    '千葉市花見川区民プール',
    5000, 5000,
    (now() + interval '1 days')::date + time '20:00', 1, 1,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team9, v_user3,
    '【佐藤コーチ】女性向けグループレッスン - 背泳ぎ姿勢改善',
    '猫背・肩こりに悩む女性向け。背泳ぎを通じて姿勢を整え、肩甲骨まわりをほぐします。最大3名の少人数制。',
    'アップ 200m'                                 || chr(10) ||
    '・肩甲骨ストレッチ'                           || chr(10) ||
    '・背泳ぎドリル 6×50m'                        || chr(10) ||
    '・ポジションチェック & フィードバック'         || chr(10) ||
    '・ダウン & ストレッチ',
    'practice',
    (now() + interval '9 days')::date + time '10:00',
    '千葉市花見川区民プール',
    4000, 4000,
    (now() + interval '7 days')::date + time '20:00', 1, 3,
    '[]'::jsonb, false, true, 'open', 'published'
  );

  INSERT INTO practice_sessions (
    team_id, coach_id, title, description, content, type,
    scheduled_at, location, member_price, guest_price,
    registration_deadline, min_participants, max_participants,
    target_tags, allow_point_card, is_external, session_status, status
  ) VALUES (
    v_team9, v_user3,
    '【佐藤コーチ】水中ヨガ & スイム体験イベント',
    '水中ヨガで体を整えてから、水泳の基礎を体験するコラボイベント。初めて水泳に挑戦する女性にもおすすめです。',
    '・水中ヨガ 30分'                             || chr(10) ||
    '・クロール基礎体験'                           || chr(10) ||
    '・感想シェア & ティータイム',
    'event',
    (now() + interval '16 days')::date + time '10:00',
    '千葉市中央区民プール',
    3500, 3500,
    (now() + interval '14 days')::date + time '20:00', 2, 6,
    '[]'::jsonb, false, true, 'open', 'published'
  );

END $$;
