-- messages の INSERT ポリシーが sender_id しか検証しておらず、
-- 「送受信者が同じチームに所属している」という業務ルールがアプリ層(actions/messages.ts)にしか
-- 存在しなかった。PostgREST経由で直接INSERTすれば任意ユーザーへ送信できてしまうため、
-- RLS側にも同じ検証を追加する。

drop policy if exists "ログインユーザーはメッセージ送信可" on messages;

create policy "ログインユーザーはメッセージ送信可"
  on messages for insert
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from team_members sender_tm
      join team_members receiver_tm on receiver_tm.team_id = sender_tm.team_id
      where sender_tm.swimmer_id = (select auth.uid())
        and sender_tm.status = 'active'
        and receiver_tm.swimmer_id = messages.receiver_id
        and receiver_tm.status = 'active'
    )
  );
