-- CRIT-1: profiles テーブルの SELECT ポリシーが `using (true)` かつ `to` 制限なしで
-- 定義されており、未ログイン(anon key)でも緊急連絡先・住所・生年月日・Stripe/LINE ID等の
-- 個人情報を含む全プロフィールを取得できてしまう問題を修正する。
--
-- 対応方針:
--   1. profiles 本体の SELECT は「本人のみ・authenticated のみ」に制限する
--   2. 他ユーザーの安全なカラムだけを公開する public_profiles ビューを新設し、
--      authenticated ロールにのみ SELECT を許可する（未ログイン導線は adminClient 経由の
--      Server Action で別途提供済みのため anon には付与しない）

drop policy if exists "プロフィールは誰でも閲覧可" on profiles;

create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create or replace view public_profiles as
select
  id,
  name,
  avatar_url,
  bio,
  career,
  achievements,
  specialties,
  target_ages,
  rating_avg,
  review_count,
  prefecture,
  prefectures,
  swimming_goals,
  participation_styles,
  created_at
from profiles;

grant select on public_profiles to authenticated;
