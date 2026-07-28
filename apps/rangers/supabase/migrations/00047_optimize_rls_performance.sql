-- Supabase Performance Advisor 対応
-- 1. auth_rls_initplan: RLSポリシー内の auth.uid() を (select auth.uid()) でラップし、
--    行ごとの再評価ではなく1クエリにつき1回の評価（InitPlan化）にする。
--    認可ロジック（誰が何を読み書きできるか）は一切変更しない。
-- 2. multiple_permissive_policies: 同一ロール/アクションに複数のpermissiveポリシーが
--    存在するテーブルのうち、安全にOR結合できるものだけを1本化する。
--    （結合後の条件は元のポリシー群のORそのものであり、可視/操作可能な行は変わらない）
-- 3. unindexed_foreign_keys: FKにカバリングインデックスがない5件を追加。
-- 4. duplicate_index: membership_fees の重複インデックスを1本化。
--
-- 対象外（DEPRECATED・0行・アプリ未参照のため今回は触らない）:
--   lessons, bookings, reviews, schedule_requests のRLSポリシー本体
--   （schedule_requests.lesson_id の FK インデックスのみ、他のFKと合わせて追加する）
--
-- 変更していないもの（既にsecurity definer関数 get_my_team_ids() / get_my_admin_team_ids()
-- 経由でauth.uid()を呼んでおり、advisorの直接検出パターンに該当しないため対象外）:
--   team_members_select / team_members_update / team_members_delete
--   session_templates の全ポリシー, stamp_purchases の全ポリシー
--   session_registrations の insert/update/delete, transfer_records の全ポリシー

-- ============================================================
-- profiles
-- ============================================================
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "自分のプロフィールのみ更新可" on profiles;
create policy "自分のプロフィールのみ更新可"
  on profiles for update using ((select auth.uid()) = id);

-- ============================================================
-- teams
-- select_own と select_external は共に permissive な select ポリシーのため、
-- 可視性を変えずに1本化する（結果は元のORと同一）
-- ============================================================
drop policy if exists "teams_select_own" on teams;
drop policy if exists "teams_select_external" on teams;
create policy "teams_select_own" on teams for select
  using (
    coach_id = (select auth.uid())
    or id in (select get_my_team_ids())
    or exists (
      select 1 from practice_sessions ps
      where ps.team_id = teams.id and ps.is_external = true and ps.status = 'published'
    )
  );

drop policy if exists "teams_insert" on teams;
create policy "teams_insert" on teams for insert
  with check (coach_id = (select auth.uid()));

drop policy if exists "teams_update" on teams;
create policy "teams_update" on teams for update
  using (
    coach_id = (select auth.uid())
    or exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.swimmer_id = (select auth.uid())
        and team_members.role = 'admin'
        and team_members.status = 'active'
    )
  )
  with check (
    coach_id = (select coach_id from teams where id = teams.id)
  );

drop policy if exists "teams_delete" on teams;
create policy "teams_delete" on teams for delete
  using (coach_id = (select auth.uid()));

-- ============================================================
-- team_members
-- team_members_insert のみ auth.uid() を直接呼んでいるため修正
-- ============================================================
drop policy if exists "team_members_insert" on team_members;
create policy "team_members_insert" on team_members for insert
  with check (
    swimmer_id = (select auth.uid())
    and coalesce(stamp_remaining, 0) = 0
    and (
      role = 'member'
      or (role = 'admin' and team_id in (select id from teams where coach_id = (select auth.uid())))
    )
  );

-- ============================================================
-- practice_sessions
-- select_member と select_external は共に permissive な select ポリシーのため1本化
-- ============================================================
drop policy if exists "sessions_select_member" on practice_sessions;
drop policy if exists "sessions_select_external" on practice_sessions;
create policy "sessions_select_member" on practice_sessions for select
  using (
    team_id in (select team_id from team_members where swimmer_id = (select auth.uid()))
    or (is_external = true and status = 'published')
  );

drop policy if exists "sessions_insert" on practice_sessions;
create policy "sessions_insert" on practice_sessions for insert
  with check (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "sessions_update" on practice_sessions;
create policy "sessions_update" on practice_sessions for update
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "sessions_delete" on practice_sessions;
create policy "sessions_delete" on practice_sessions for delete
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

-- ============================================================
-- session_registrations
-- select_own と select_admin は共に permissive な select ポリシーのため1本化
-- ============================================================
drop policy if exists "registrations_select_own" on session_registrations;
drop policy if exists "registrations_select_admin" on session_registrations;
create policy "registrations_select_own" on session_registrations for select
  using (
    swimmer_id = (select auth.uid())
    or session_id in (
      select ps.id from practice_sessions ps
      join team_members tm on tm.team_id = ps.team_id
      where tm.swimmer_id = (select auth.uid()) and tm.role = 'admin'
    )
  );

-- ============================================================
-- membership_fees
-- select_own と select_admin は共に permissive な select ポリシーのため1本化
-- ============================================================
drop policy if exists "fees_select_own" on membership_fees;
drop policy if exists "fees_select_admin" on membership_fees;
create policy "fees_select_own" on membership_fees for select
  using (
    swimmer_id = (select auth.uid())
    or team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "fees_insert_admin" on membership_fees;
create policy "fees_insert_admin" on membership_fees for insert
  with check (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "fees_update_admin" on membership_fees;
create policy "fees_update_admin" on membership_fees for update
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

-- ============================================================
-- price_views
-- select_own と select_admin は共に permissive な select ポリシーのため1本化
-- ============================================================
drop policy if exists "price_views_insert_own" on price_views;
create policy "price_views_insert_own" on price_views for insert
  with check (viewer_id = (select auth.uid()));

drop policy if exists "price_views_select_admin" on price_views;
drop policy if exists "price_views_select_own" on price_views;
create policy "price_views_select_own" on price_views for select
  using (
    viewer_id = (select auth.uid())
    or session_id in (
      select ps.id from practice_sessions ps
      join team_members tm on tm.team_id = ps.team_id
      where tm.swimmer_id = (select auth.uid()) and tm.role = 'admin'
    )
  );

-- ============================================================
-- announcement_reads
-- select_own と select_admin は共に permissive な select ポリシーのため1本化
-- ============================================================
drop policy if exists "reads_select_own" on announcement_reads;
drop policy if exists "reads_select_admin" on announcement_reads;
create policy "reads_select_own" on announcement_reads for select
  using (
    user_id = (select auth.uid())
    or announcement_id in (
      select a.id from announcements a
      join team_members tm on tm.team_id = a.team_id
      where tm.swimmer_id = (select auth.uid()) and tm.role = 'admin'
    )
  );

drop policy if exists "reads_insert" on announcement_reads;
create policy "reads_insert" on announcement_reads for insert
  with check (user_id = (select auth.uid()));

-- ============================================================
-- notifications
-- ============================================================
drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications for select
  using (user_id = (select auth.uid()));

drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update
  using (user_id = (select auth.uid()));

drop policy if exists "notifications_insert_own" on notifications;
create policy "notifications_insert_own" on notifications for insert
  with check (user_id = (select auth.uid()));

-- ============================================================
-- announcements
-- ============================================================
drop policy if exists "announcements_select_member" on announcements;
create policy "announcements_select_member" on announcements for select
  using (
    team_id in (select team_id from team_members where swimmer_id = (select auth.uid()))
  );

drop policy if exists "announcements_insert_admin" on announcements;
create policy "announcements_insert_admin" on announcements for insert
  with check (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "announcements_update_admin" on announcements;
create policy "announcements_update_admin" on announcements for update
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "announcements_delete_admin" on announcements;
create policy "announcements_delete_admin" on announcements for delete
  using (
    team_id in (
      select team_id from team_members
      where swimmer_id = (select auth.uid()) and role = 'admin'
    )
  );

-- ============================================================
-- join_requests
-- 「申請者は自分の申請を参照できる」と「管理者は自チームへの申請を参照できる」は
-- 共に permissive な select ポリシーのため1本化
-- ============================================================
drop policy if exists "ログインユーザーは申請を作成できる" on join_requests;
create policy "ログインユーザーは申請を作成できる" on join_requests for insert
  with check (swimmer_id = (select auth.uid()));

drop policy if exists "申請者は自分の申請を参照できる" on join_requests;
drop policy if exists "管理者は自チームへの申請を参照できる" on join_requests;
create policy "申請者は自分の申請を参照できる" on join_requests for select
  using (
    swimmer_id = (select auth.uid())
    or team_id in (select get_my_admin_team_ids())
  );

-- ============================================================
-- messages
-- ============================================================
drop policy if exists "自分が送受信したメッセージのみ閲覧可" on messages;
create policy "自分が送受信したメッセージのみ閲覧可"
  on messages for select using (
    sender_id = (select auth.uid()) or receiver_id = (select auth.uid())
  );

drop policy if exists "ログインユーザーはメッセージ送信可" on messages;
create policy "ログインユーザーはメッセージ送信可"
  on messages for insert with check (sender_id = (select auth.uid()));

drop policy if exists "受信者のみ既読更新可" on messages;
create policy "受信者のみ既読更新可"
  on messages for update using (receiver_id = (select auth.uid()));

-- ============================================================
-- unindexed_foreign_keys: カバリングインデックスがない5件を追加
-- ============================================================
create index if not exists idx_announcements_author on announcements(author_id);
create index if not exists idx_join_requests_swimmer on join_requests(swimmer_id);
create index if not exists idx_notifications_team on notifications(team_id);
create index if not exists idx_schedule_requests_lesson on schedule_requests(lesson_id);
create index if not exists idx_transfer_records_registration on transfer_records(registration_id);

-- ============================================================
-- duplicate_index: membership_fees の重複インデックスを1本化
-- membership_fees_stripe_invoice_id_key（00032で意図的に追加された部分インデックス、
-- webhookの冪等性キーとしてコード上想定されている正規のもの）を残し、
-- マイグレーション履歴にない重複の _unique を削除する
-- ============================================================
drop index if exists membership_fees_stripe_invoice_id_unique;
