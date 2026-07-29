-- 5回目の全体レビュー: database-reviewer が検出した MEDIUM/LOW 項目の多層防御修正
-- （実害は限定的だが、堅牢性のために対応する）

-- 1. get_my_team_ids / get_my_admin_team_ids は RLS ポリシーで最も多用される
--    ヘルパー関数だが、search_path に pg_temp が含まれておらず、他の
--    SECURITY DEFINER 関数（00036以降）と設定が不揃いだった。
--    現状は本文が public.team_members と完全修飾されているため実害はないが、
--    将来の変更で規約が崩れた場合の保険として揃えておく。
alter function public.get_my_team_ids() set search_path = public, pg_temp;
alter function public.get_my_admin_team_ids() set search_path = public, pg_temp;

-- 2. lessons/bookings/reviews/schedule_requests は 00043 で「未使用」と判定された
--    レガシーテーブル（現在も0行、コード参照ゼロを確認済み）。
--    reviews の SELECT ポリシーが `using (true)` かつ `to` 句なしで
--    anon にも解放されたままになっており、将来データが入った場合に
--    誰でも閲覧できてしまう。コードから一切参照されていないため、
--    テーブル自体は残しつつ anon/authenticated からのアクセス経路を塞ぐ。
revoke all on lessons, bookings, reviews, schedule_requests from anon, authenticated;

-- 3. join_requests は admin 向けクエリで team_id 単体条件のフルスキャンが
--    発生し得る（既存インデックスは (team_id, swimmer_id) の pending 限定部分索引のみ）。
create index if not exists idx_join_requests_team on join_requests(team_id);

-- 4. profiles の UPDATE ポリシーに `to authenticated` が無い。
--    auth.uid() が anon では null になるため実害はないが、他の profiles
--    ポリシー（00033/00047以降）と同様に明示しておく。
drop policy if exists "自分のプロフィールのみ更新可" on profiles;
create policy "自分のプロフィールのみ更新可"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check (((select auth.uid()) = id) and (role = get_my_profile_role()));
