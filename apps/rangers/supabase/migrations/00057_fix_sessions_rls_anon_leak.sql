-- 5回目の全体レビュー: practice_sessions の RLS ポリシーが `to` 句を持たず
-- (roles = public = 全ロール適用)、is_external = true and status = 'published' の
-- 行については未ログイン(anon key)でも target_members / course_rules /
-- competition_fields / coach_id / content 等の全カラムを取得できてしまっていた。
--
-- teams テーブルの invite_code 漏洩 (00048) と全く同じ脆弱性パターン。
-- 対応方針も同じ: ポリシーを authenticated 限定にし、匿名向けの一覧取得は
-- Server Action 側で createAdminClient() + 安全なカラムのみの whitelist に
-- 切り替える（actions/sessions/crud.ts の getPublicSessions を参照）。

drop policy if exists "sessions_select_member" on practice_sessions;

create policy "sessions_select_member" on practice_sessions for select
  to authenticated
  using (
    team_id in (select team_id from team_members where swimmer_id = (select auth.uid()))
    or (is_external = true and status = 'published')
  );
