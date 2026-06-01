-- セキュリティ修正: RLSポリシーとCHECK制約の修正

-- ============================================================
-- HIGH #8: teams_update RLS を coach_id のみ → admin メンバーも許可
-- ============================================================
drop policy if exists "teams_update" on teams;

create policy "teams_update" on teams for update
  using (
    coach_id = auth.uid()
    or exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.swimmer_id = auth.uid()
        and team_members.role = 'admin'
        and team_members.status = 'active'
    )
  );

-- ============================================================
-- HIGH #9: notifications INSERT ポリシー追加
-- サーバー側からの通知insert（service_role）とRLS整合性のため
-- システムがany userへ通知を送れるよう service_role を前提とするが、
-- anon/authenticated での直接insertは本人宛のみ許可する
-- ============================================================
create policy "notifications_insert_own" on notifications for insert
  with check (user_id = auth.uid());

-- ============================================================
-- HIGH #10: practice_sessions type CHECK に camp / competition を追加
-- ============================================================
alter table practice_sessions
  drop constraint if exists practice_sessions_type_check;

alter table practice_sessions
  add constraint practice_sessions_type_check
  check (type in ('practice', 'camp', 'competition', 'event', 'meeting'));
