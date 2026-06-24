-- notifications テーブルの差分適用
-- 既存テーブル（id, user_id, type, title, body, link, is_read, created_at）に
-- team_id と metadata カラムを追加し、RLS ポリシーを設定する

alter table notifications
  add column if not exists team_id uuid references teams(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}';

-- RLS が未有効なら有効化
alter table notifications enable row level security;

-- ポリシーが既にあれば再作成しない
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications'
      and policyname = 'ユーザーは自分の通知を参照できる'
  ) then
    execute $p$
      create policy "ユーザーは自分の通知を参照できる"
        on notifications for select
        using (user_id = auth.uid())
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications'
      and policyname = 'ユーザーは自分の通知を既読にできる'
  ) then
    execute $p$
      create policy "ユーザーは自分の通知を既読にできる"
        on notifications for update
        using (user_id = auth.uid())
        with check (user_id = auth.uid())
    $p$;
  end if;
end
$$;

-- 挿入はサービスロール（adminClient）からのみ許可
-- ユーザーは直接通知を作成できない
