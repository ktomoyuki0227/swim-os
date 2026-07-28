-- 本番スキーマには存在するが、マイグレーション履歴のどのファイルにも
-- 定義が存在しなかったStripe Connect / Subscription関連カラムを正式に記録する。
-- (00029〜00032番台でローカルファイルと本番の適用履歴に名称ズレが見つかったのとは別に、
--  以下のカラムは本番・ローカルの双方に一切定義が存在しない純粋な欠落だった)
-- ALL文はIF NOT EXISTSで冪等化しており、既に本番に存在するカラムに対して実行しても無害。

alter table teams
  add column if not exists stripe_product_id text,
  add column if not exists stripe_monthly_price_id text,
  add column if not exists stripe_annual_price_id text,
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_completed boolean not null default false,
  add column if not exists fee_members_exempt_session boolean not null default false;

comment on column teams.stripe_product_id is 'Stripe Product ID (月謝商品、チームごとに1つ)';
comment on column teams.stripe_account_id is 'Stripe Connected Account ID (acct_xxx)';
comment on column teams.stripe_onboarding_completed is 'Stripe Connect のオンボーディング完了フラグ（charges_enabled = true）';
comment on column teams.fee_members_exempt_session is '年会費・月謝会員のセッション参加費免除フラグ。trueの場合、membership_type が annual または monthly のメンバーはセッション参加費が無料になる。';

alter table team_members
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text
    check (subscription_status in ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing'));

comment on column team_members.subscription_status is 'Stripe Subscription のステータス (active/past_due/canceled/unpaid)';

-- Webhookハンドラ(app/api/stripe/webhook/route.ts)がこれらのカラムを等価検索するため、
-- 検索性能と一意性制約の両方を兼ねたユニークインデックスを追加する。
create unique index if not exists idx_teams_stripe_account
  on teams(stripe_account_id) where stripe_account_id is not null;

create unique index if not exists idx_team_members_stripe_subscription
  on team_members(stripe_subscription_id) where stripe_subscription_id is not null;
