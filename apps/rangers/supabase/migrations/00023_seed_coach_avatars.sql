-- テストコーチのアバター画像URLを設定
-- 画像は public/avatars/ に配置済み

UPDATE profiles
SET avatar_url = '/avatars/coach-yamada.jpg'
WHERE name = '山田 健太';

UPDATE profiles
SET avatar_url = '/avatars/coach-suzuki.jpg'
WHERE name = '鈴木 太郎';
