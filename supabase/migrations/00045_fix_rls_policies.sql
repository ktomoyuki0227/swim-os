-- ============================================================
-- RLS ポリシーの修正: raw team_members サブクエリを SECURITY DEFINER 関数に統一
-- ============================================================
-- 問題: PostgREST のネスト JOIN コンテキストで `team_members` に直接サブクエリを
-- 発行するポリシーが、SECURITY DEFINER 関数経由ではないため評価に失敗する場合がある。
-- コーチ(coach_id = auth.uid()) のみが teams を直接読めるため、
-- 非コーチユーザーはネスト JOIN で team = null となりすべての支払い履歴が消える。
--
-- 修正: 既存の get_my_team_ids() / get_my_admin_team_ids() を全ポリシーで使用する。
-- ============================================================

-- practice_sessions
drop policy if exists "sessions_select_member" on practice_sessions;
create policy "sessions_select_member" on practice_sessions for select
  using (
    team_id in (select get_my_team_ids())
    or (is_external = true and status = 'published')
  );

drop policy if exists "sessions_insert" on practice_sessions;
create policy "sessions_insert" on practice_sessions for insert
  with check (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "sessions_update" on practice_sessions;
create policy "sessions_update" on practice_sessions for update
  using (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "sessions_delete" on practice_sessions;
create policy "sessions_delete" on practice_sessions for delete
  using (
    team_id in (select get_my_admin_team_ids())
  );

-- session_registrations
drop policy if exists "registrations_select_admin" on session_registrations;
create policy "registrations_select_admin" on session_registrations for select
  using (
    session_id in (
      select ps.id from practice_sessions ps
      where ps.team_id in (select get_my_admin_team_ids())
    )
  );

drop policy if exists "registrations_update" on session_registrations;
create policy "registrations_update" on session_registrations for update
  using (
    swimmer_id = auth.uid()
    or session_id in (
      select ps.id from practice_sessions ps
      where ps.team_id in (select get_my_admin_team_ids())
    )
  );

-- membership_fees
drop policy if exists "fees_select_admin" on membership_fees;
create policy "fees_select_admin" on membership_fees for select
  using (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "fees_insert_admin" on membership_fees;
create policy "fees_insert_admin" on membership_fees for insert
  with check (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "fees_update_admin" on membership_fees;
create policy "fees_update_admin" on membership_fees for update
  using (
    team_id in (select get_my_admin_team_ids())
  );

-- session_templates
drop policy if exists "templates_select_admin" on session_templates;
create policy "templates_select_admin" on session_templates for select
  using (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "templates_insert_admin" on session_templates;
create policy "templates_insert_admin" on session_templates for insert
  with check (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "templates_update_admin" on session_templates;
create policy "templates_update_admin" on session_templates for update
  using (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "templates_delete_admin" on session_templates;
create policy "templates_delete_admin" on session_templates for delete
  using (
    team_id in (select get_my_admin_team_ids())
  );

-- announcements
drop policy if exists "announcements_select_member" on announcements;
create policy "announcements_select_member" on announcements for select
  using (
    team_id in (select get_my_team_ids())
  );

drop policy if exists "announcements_insert_admin" on announcements;
create policy "announcements_insert_admin" on announcements for insert
  with check (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "announcements_update_admin" on announcements;
create policy "announcements_update_admin" on announcements for update
  using (
    team_id in (select get_my_admin_team_ids())
  );

drop policy if exists "announcements_delete_admin" on announcements;
create policy "announcements_delete_admin" on announcements for delete
  using (
    team_id in (select get_my_admin_team_ids())
  );

-- announcement_reads (admin select)
drop policy if exists "reads_select_admin" on announcement_reads;
create policy "reads_select_admin" on announcement_reads for select
  using (
    user_id = auth.uid()
    or announcement_id in (
      select a.id from announcements a
      where a.team_id in (select get_my_admin_team_ids())
    )
  );
