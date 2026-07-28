-- CRITICAL: teams テーブルのRLSが invite_code 等の全カラムを未ログインユーザーにも公開していた問題を修正
--
-- 旧 teams_select_own ポリシー(to句なし = anonにも適用)は、
--   「外部公開セッション(is_external=true かつ status='published')を持つチーム」であれば
--   auth.uid() を一切問わずそのチームの teams 行全体(invite_code, stripe_account_id等含む)を
--   誰でも select できる、という条件を含んでいた。
--
-- 攻撃シナリオ: 未認証で GET {SUPABASE_URL}/rest/v1/teams?id=eq.<team_id>&select=* を叩くと
--   invite_code が取得でき、joinTeamByCode() 経由で管理者承認なしに任意のmembership_typeで
--   自己参加できてしまう。
--
-- 確認した通り、公開ページ(app/(public)/page.tsx, app/(public)/teams/join/[inviteCode]/page.tsx,
-- actions/teams.ts の getPublicTeam/getPublicSessions 等)はすべて createAdminClient()
-- (RLSバイパス) + 明示的なカラムホワイトリストで実装されており、
-- このRLS経由の匿名アクセスに依存しているコードは存在しない。
-- そのため、当該OR条件を削除し、to authenticated を追加して認可ロジックを厳格化する。

drop policy if exists "teams_select_own" on teams;
create policy "teams_select_own" on teams for select
  to authenticated
  using (
    coach_id = (select auth.uid())
    or id in (select get_my_team_ids())
  );
