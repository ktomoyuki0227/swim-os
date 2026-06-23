-- profiles に Stripe Customer ID を追加（cus_xxx 形式）
alter table profiles
  add column if not exists stripe_customer_id text;

-- team_members に Stripe Subscription ID を追加（sub_xxx 形式: 年会費・月謝用）
alter table team_members
  add column if not exists stripe_subscription_id text;

-- teams に Stripe Price ID を追加（年会費・月謝の繰り返し課金に使用）
alter table teams
  add column if not exists stripe_monthly_price_id text,
  add column if not exists stripe_annual_price_id text;
