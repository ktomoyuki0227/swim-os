-- LOW（2026-08-03 独立レビュー）: transfer_records.stripe_payment_intent_id には
-- 非ユニークインデックス(idx_transfer_records_pi)しかなく、同一PaymentIntentに対して
-- 誤って複数回INSERTされることを防ぐDB制約がなかった。現在の呼び出し経路
-- (chargeSessionRegistrationStripe)は新規PI作成のたびに1回だけINSERTしており
-- 実害はないが、将来のリトライ経路の実装ミスで二重INSERTされた場合に検知できるよう、
-- 安全網としてユニーク制約を追加する。既存の非ユニークインデックスは
-- ユニークインデックスで代替されるため削除する。

drop index if exists idx_transfer_records_pi;

alter table transfer_records
  add constraint transfer_records_stripe_payment_intent_id_unique unique (stripe_payment_intent_id);
