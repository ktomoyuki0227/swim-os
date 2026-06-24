-- 月謝 Stripe Subscription サポート
-- membership_fees に Subscription/Invoice トレーサビリティを追加
-- team_members に Subscription ステータスを追加
-- teams に Stripe Product ID を追加

-- membership_fees に Stripe 関連カラム追加
alter table membership_fees
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_invoice_id text;

-- team_members に Subscription ステータス追加
alter table team_members
  add column if not exists subscription_status text
    check (subscription_status in ('active', 'past_due', 'canceled', 'unpaid'));

-- teams に Stripe Product ID 追加（月謝商品を 1 チーム 1 Product で管理）
alter table teams
  add column if not exists stripe_product_id text;

-- invoice_id の重複挿入を防ぐユニークインデックス（Webhook リトライ対策）
create unique index if not exists membership_fees_stripe_invoice_id_unique
  on membership_fees (stripe_invoice_id)
  where stripe_invoice_id is not null;

comment on column membership_fees.stripe_subscription_id is 'Stripe Subscription ID (月謝自動請求の場合)';
comment on column membership_fees.stripe_invoice_id is 'Stripe Invoice ID (冪等性チェック用)';
comment on column team_members.subscription_status is 'Stripe Subscription のステータス (active/past_due/canceled/unpaid)';
comment on column teams.stripe_product_id is 'Stripe Product ID (月謝商品、チームごとに1つ)';
