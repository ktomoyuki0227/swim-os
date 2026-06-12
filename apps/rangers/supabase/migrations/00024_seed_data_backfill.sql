-- テストデータのバックフィル
-- 追加されたフィールドに対して既存のシードデータを補完する

-- プロフィール: phone
UPDATE profiles SET phone = '075-001-0001' WHERE name = '山田 健太';
UPDATE profiles SET phone = '03-0002-0002' WHERE name = '鈴木 太郎';
UPDATE profiles SET phone = '047-003-0003' WHERE name = '佐藤 花子';

-- チーム: activity_area
UPDATE teams SET activity_area = '山梨県甲府市' WHERE name = 'マウントリバー水泳クラブ';
UPDATE teams SET activity_area = '東京都江東区' WHERE name = '東京マスターズ水泳クラブ';
