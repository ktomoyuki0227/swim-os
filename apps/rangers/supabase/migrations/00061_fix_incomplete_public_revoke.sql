-- 6回目の全体レビュー: 00056で anon/authenticated から個別に REVOKE したはずの
-- RPC関数が、Supabase advisorで引き続き anon 実行可能と警告され続けていた。
-- 原因調査: pg_proc.proacl を直接確認したところ `=X/postgres`(PUBLIC ロールへの
-- EXECUTE 付与)が残っており、特定ロールからの REVOKE は PUBLIC 経由の権限には
-- 影響しないため、結局 anon はPUBLIC経由で実行可能なままだった。
-- 00056 の修正が不完全だったことの是正。

revoke execute on function public.get_my_team_ids() from public;
revoke execute on function public.get_my_admin_team_ids() from public;
revoke execute on function public.get_my_profile_role() from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.update_instructor_rating() from public;

-- get_my_team_ids / get_my_admin_team_ids はRLSポリシー内で authenticated として
-- 評価されるため、authenticated には明示的に再付与する。
grant execute on function public.get_my_team_ids() to authenticated;
grant execute on function public.get_my_admin_team_ids() to authenticated;
grant execute on function public.get_my_profile_role() to authenticated;
