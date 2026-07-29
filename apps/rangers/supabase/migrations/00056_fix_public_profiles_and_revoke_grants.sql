-- 5回目の全体レビュー: Supabaseアドバイザーで検出した2件を修正
--
-- 1. public_profiles ビューが profiles.deleted_at を考慮しておらず、
--    退会（論理削除）済みユーザーの公開プロフィールが誰でも閲覧可能なまま残っていた。
-- 2. 直接呼び出す必要のない関数が anon / authenticated ロールから
--    RPC 経由で実行可能になっていた（多層防御として権限を絞る）。
--    - get_my_team_ids / get_my_admin_team_ids / get_my_profile_role は
--      内部で auth.uid() によりフィルタするため anon 呼び出し自体は無害だが、
--      anon が呼ぶ正当な理由がないため anon からの EXECUTE のみ revoke する。
--    - handle_new_user / update_instructor_rating はトリガー専用関数（戻り値 trigger）。
--      トリガー発火自体は EXECUTE 権限の影響を受けないため、anon/authenticated
--      からの直接 RPC 呼び出し経路のみ塞ぐ。

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
from profiles
where deleted_at is null;

grant select on public_profiles to authenticated;

revoke execute on function public.get_my_team_ids() from anon;
revoke execute on function public.get_my_admin_team_ids() from anon;
revoke execute on function public.get_my_profile_role() from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.update_instructor_rating() from anon, authenticated;
