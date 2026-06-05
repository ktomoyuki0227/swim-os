-- ============================================================
-- ロール統一マイグレーション
-- profiles.role を 'member' | 'super_admin' に整理
--
-- Before: check (role in ('swimmer', 'instructor', 'admin')) default 'swimmer'
-- After:  check (role in ('member', 'super_admin')) default 'member'
--
-- 変換ルール:
--   swimmer    → member
--   instructor → member
--   admin      → super_admin（プラットフォーム管理者）
-- ============================================================

-- 1. 先に制約を削除してからデータ変換（逆順だと制約違反になる）
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles alter column role set default 'member';

-- 2. 既存データを変換
update profiles set role = 'super_admin' where role = 'admin';
update profiles set role = 'member'      where role in ('swimmer', 'instructor');

-- 3. 新しい制約を追加
alter table profiles add constraint profiles_role_check
  check (role in ('member', 'super_admin'));

-- 3. 旧スキーマの RLS ポリシーを廃止（lessons/bookings は teams 体系に移行済み）
drop policy if exists "指導員のみレッスン作成可"  on lessons;
drop policy if exists "スイマーのみ予約作成可"    on bookings;
