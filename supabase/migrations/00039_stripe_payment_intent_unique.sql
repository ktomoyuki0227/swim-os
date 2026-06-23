-- session_registrations.stripe_payment_intent_id への部分ユニークインデックス
-- NULL 値（現金払いなど）は複数許容しつつ、同一 PaymentIntent ID の重複登録を防ぐ。
-- Webhook ハンドラの冪等性を DB レベルで担保する。
create unique index if not exists session_registrations_stripe_pi_id_unique
  on session_registrations (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
