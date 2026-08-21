-- 2026-08-15 全体コードレビューで見つかった DB 層の指摘への対応。
-- (docs/for-reviewer/FULL_APP_REVIEW_2026-08-15.md 参照)

-- ============================================================
-- H-1: profiles の Stripe連携ID列を service_role 以外から変更不可にする
-- ============================================================
-- RLSの WITH CHECK では UPDATE前(OLD)の値を直接参照できないため、
-- トリガーで「一般ユーザーによる更新ではStripe連携IDを変更させない」ことを保証する。
-- createAdminClient() (service_role) からの正規の更新は素通しする。
create or replace function public.enforce_profiles_stripe_id_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_payment_method_id is distinct from old.stripe_payment_method_id
     or new.stripe_account_id is distinct from old.stripe_account_id
  then
    raise exception 'profiles: Stripe連携IDはサーバー側処理からのみ更新できます';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_restrict_stripe_id_update on profiles;
create trigger profiles_restrict_stripe_id_update
  before update on profiles
  for each row execute function public.enforce_profiles_stripe_id_immutable();

-- ============================================================
-- H-2: teams 削除時に決済監査記録(practice_sessions/session_registrations)を
-- 無条件に道連れで消さないようにする
-- ============================================================
-- deleteSession アクションが「支払い記録があるセッションは削除不可」を
-- アプリ側で明示的にガードしているのに対し、teams自体の削除にはガードが無く、
-- CASCADEにより Stripe決済ID・課金履歴を含む行が無条件に消えてしまっていた。
-- membership_fees/stamp_purchases/transfer_records と同様、参照側で
-- ブロックされる方向(NO ACTION)に変更する。
alter table practice_sessions
  drop constraint if exists practice_sessions_team_id_fkey,
  add constraint practice_sessions_team_id_fkey
    foreign key (team_id) references teams(id);

alter table session_registrations
  drop constraint if exists session_registrations_session_id_fkey,
  add constraint session_registrations_session_id_fkey
    foreign key (session_id) references practice_sessions(id);

-- ============================================================
-- M-6: join_requests.swimmer_id の ON DELETE も他テーブルと同じ設計(NO ACTION)に揃える
-- ============================================================
-- 他の profiles 参照(teams.coach_id, team_members.swimmer_id 等)は全て
-- 「所属記録があるプロフィールは削除できない」設計(NO ACTION)だが、
-- join_requests だけ ON DELETE CASCADE になっていた(00039)。設計方針に合わせる。
alter table join_requests
  drop constraint if exists join_requests_swimmer_id_fkey,
  add constraint join_requests_swimmer_id_fkey
    foreign key (swimmer_id) references profiles(id);

-- ============================================================
-- H-5: messages の既読更新ポリシーが read_at 以外の書き換えも許してしまう問題
-- ============================================================
-- RLSの UPDATE ポリシーは WITH CHECK を省略すると USING がそのまま新しい行にも
-- 適用されるため、receiver_id さえ一致すれば content や sender_id も
-- 書き換えられてしまっていた。RLSでは OLD の値を参照できないため、
-- トリガーで read_at 以外のカラムの変更を拒否する。
create or replace function public.enforce_messages_read_only_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.sender_id is distinct from old.sender_id
     or new.receiver_id is distinct from old.receiver_id
     or new.content is distinct from old.content
     or new.created_at is distinct from old.created_at
  then
    raise exception 'messages: read_at 以外のカラムは更新できません';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_restrict_receiver_update on messages;
create trigger messages_restrict_receiver_update
  before update on messages
  for each row execute function public.enforce_messages_read_only_update();

-- ============================================================
-- M-5: 未使用RPC increment_stamp_by の authenticated 実行権限を剥奪する
-- ============================================================
-- add_stamp_purchase(00054)に完全に置き換えられ、アプリコードからの
-- 呼び出し箇所は無い(grep確認済み)。任意の符号付きp_countを渡せてしまい、
-- 購入履歴と無関係にstamp_remainingをズレさせる余地が残っていたため、
-- 他の未使用書き込み経路(00059, 00068)と同様に攻撃対象を減らす。
revoke execute on function increment_stamp_by(uuid, integer) from authenticated;

-- ============================================================
-- H-3 相当: スキーマドリフトの補完(本番DBには存在するがマイグレーション履歴に
-- 記録がなかったカラム・インデックス)
-- ============================================================
-- profiles.phone: 00024で使用開始も ALTER TABLE が記録されていなかった
alter table profiles
  add column if not exists phone text;

-- teams.practice_frequency / practice_days / main_pool: 00029で使用開始も
-- ALTER TABLE が記録されていなかった
alter table teams
  add column if not exists practice_frequency text,
  add column if not exists practice_days text[] not null default '{}',
  add column if not exists main_pool text;

-- notifications.team_id / metadata: 00046/00047で使用・インデックス化済みも
-- ALTER TABLE が記録されていなかった
alter table notifications
  add column if not exists team_id uuid,
  add column if not exists metadata jsonb not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_team_id_fkey'
  ) then
    alter table notifications
      add constraint notifications_team_id_fkey
        foreign key (team_id) references teams(id) on delete set null;
  end if;
end $$;

create index if not exists idx_notifications_team on notifications(team_id);

-- H-4 相当: session_registrations.stripe_payment_intent_id の一意インデックスは
-- 本番DBには既に存在していた(Webhookの検索性能・冪等性を担保済み)が、
-- こちらもマイグレーション履歴に記録がなかったため補完する
create unique index if not exists session_registrations_stripe_pi_id_unique
  on session_registrations(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
