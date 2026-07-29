-- 6回目の全体レビュー(Stripe深掘り): charge.dispute.createdイベントを
-- ハンドリングするため、session_registrations.payment_statusに"disputed"を追加する。
-- 従来はチャージバックが発生してもDB上は"paid"のままで、管理者がStripe
-- ダッシュボードを個別に確認しない限り一切気づけなかった。

alter table session_registrations drop constraint session_registrations_payment_status_check;
alter table session_registrations
  add constraint session_registrations_payment_status_check
  check (payment_status = any (array['pending', 'paid', 'failed', 'refunded', 'free', 'disputed']));
