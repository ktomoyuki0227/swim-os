-- MEDIUM-3（2026-08-03 独立レビュー）: このコードベースでは「RLSポリシーに
-- to authenticated を付け忘れ、anon key がREST API経由で非公開カラムを直接取得できる」
-- という同型のインシデントが過去に複数回発生している（teams: 00048、
-- practice_sessions: 00057、platform_settings: 00064）。
--
-- 現時点では以下のポリシーは条件式が auth.uid() の非NULL一致を要求するため、
-- anon（auth.uid()がNULL）に対しては実質的にブロックされており、今すぐの情報漏洩は
-- 確認されていない。しかし将来の条件変更（coalesce の追加、OR分岐の追加等）で
-- 同型の事故が再発するリスクがある構造的な穴のため、予防的に to authenticated を
-- 一括付与する。USING/WITH CHECK句自体は変更せず、適用ロールのみを明示化する。
--
-- 適用前に本番DB(pg_policies)を確認したところ、reads_select_admin(announcement_reads)
-- と price_views_select_admin(price_views) は00047で既に削除されており現存しなかった
-- (管理者からのアクセスはadminClient経由に統合済みのため)。この2件は対象から除外している。

alter policy "teams_insert" on teams to authenticated;
alter policy "teams_update" on teams to authenticated;
alter policy "teams_delete" on teams to authenticated;

alter policy "team_members_select" on team_members to authenticated;
alter policy "team_members_insert" on team_members to authenticated;
alter policy "team_members_update" on team_members to authenticated;
alter policy "team_members_delete" on team_members to authenticated;

alter policy "registrations_select_own" on session_registrations to authenticated;

alter policy "fees_select_own" on membership_fees to authenticated;

alter policy "templates_select_admin" on session_templates to authenticated;
alter policy "templates_insert_admin" on session_templates to authenticated;
alter policy "templates_update_admin" on session_templates to authenticated;
alter policy "templates_delete_admin" on session_templates to authenticated;

alter policy "announcements_select_member" on announcements to authenticated;
alter policy "announcements_insert_admin" on announcements to authenticated;
alter policy "announcements_update_admin" on announcements to authenticated;
alter policy "announcements_delete_admin" on announcements to authenticated;

alter policy "reads_select_own" on announcement_reads to authenticated;
alter policy "reads_insert" on announcement_reads to authenticated;

alter policy "notifications_select_own" on notifications to authenticated;
alter policy "notifications_update_own" on notifications to authenticated;
alter policy "notifications_insert_own" on notifications to authenticated;

alter policy "price_views_insert_own" on price_views to authenticated;
alter policy "price_views_select_own" on price_views to authenticated;

alter policy "stamp_purchases_select_admin" on stamp_purchases to authenticated;

alter policy "transfer_records_admin_select" on transfer_records to authenticated;
