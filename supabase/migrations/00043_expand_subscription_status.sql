-- subscription_status の CHECK 制約を Stripe の全ステータスに拡張する
-- 既存: active / past_due / canceled / unpaid
-- 追加: incomplete / incomplete_expired / trialing
-- 理由: handleSubscriptionUpdated が subscription.status をそのまま書き込むため、
--       Stripe が incomplete / trialing 等を返すと check_violation (23514) でエラーになり
--       webhook が永続的に 500 を返し続ける問題を防ぐ

alter table team_members
  drop constraint if exists team_members_subscription_status_check;

alter table team_members
  add constraint team_members_subscription_status_check
  check (subscription_status in (
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'incomplete',
    'incomplete_expired',
    'trialing'
  ));
