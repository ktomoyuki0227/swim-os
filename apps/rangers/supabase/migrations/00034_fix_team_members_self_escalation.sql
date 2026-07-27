-- CRIT-2: team_members の INSERT/UPDATE ポリシーが self 分岐で role・stamp_remaining
-- 等のカラムを一切制限しておらず、一般ユーザーが直接 PostgREST を叩いて
--   ・自分の role を 'member' -> 'admin' に書き換える（他の全admin専用操作に波及）
--   ・自分の stamp_remaining（回数券残数）を自由に増やす
--   ・任意チームに role='admin' で自己登録する（招待コード不要の管理者乗っ取り）
-- ができてしまう問題を修正する。
--
-- 事前調査（actions/*.ts の全 team_members アクセスを確認）:
--   - UPDATE は例外なく adminClient(service role) 経由で行われており、
--     通常クライアントでの自己UPDATEはアプリのどの機能からも使われていない
--   - INSERT は以下2つの正当な自己登録フローのみ通常クライアントで行われている
--       1. createTeam: 新規作成したチームの coach 本人が role='admin' で自己追加
--       2. joinTeamByCode: 招待コード参加時に role='member' で自己追加
--   - admin が「他人の行」を通常クライアントで INSERT/UPDATE する経路は存在しない
--     （join-requests 承認等は adminClient 経由）

-- UPDATE: 通常クライアント経由の自己更新はアプリのどこにも存在しないため admin のみに限定する
drop policy if exists "team_members_update" on team_members;
create policy "team_members_update" on team_members for update
  using (team_id in (select get_my_admin_team_ids()))
  with check (team_id in (select get_my_admin_team_ids()));

-- INSERT: 自己登録は
--   ・role='member'（招待コード参加）
--   ・role='admin' かつ自分が coach を務めるチームへの登録（新規チーム作成時）
-- のみ許可し、stamp_remaining は常に 0 で固定する。
drop policy if exists "team_members_insert" on team_members;
create policy "team_members_insert" on team_members for insert
  with check (
    swimmer_id = auth.uid()
    and coalesce(stamp_remaining, 0) = 0
    and (
      role = 'member'
      or (role = 'admin' and team_id in (select id from teams where coach_id = auth.uid()))
    )
  );
