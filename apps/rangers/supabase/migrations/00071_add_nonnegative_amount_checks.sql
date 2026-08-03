-- MEDIUM-4（2026-08-03 独立レビュー）: 金額を保持するカラムに非負のCHECK制約が
-- 一切なく、アプリ側のバリデーション(bulkCreateFeesのamount > 0チェック等)のみが
-- 最後の砦になっていた。session_registrations/membership_fees/stamp_purchases/
-- transfer_recordsは00059/00068でRLS書き込みがservice_role限定になっており、
-- 通常のRLSでは不正な値を弾けなくなっているため、DB制約による多層防御を追加する。
-- 各列はNULL許容のものがあるが、CHECK制約はNULLに対して自動的に真と評価されるため
-- (annual_fee_amount等の未設定時)問題ない。

alter table teams
  add constraint teams_default_member_price_nonneg check (default_member_price >= 0),
  add constraint teams_default_guest_price_nonneg check (default_guest_price >= 0),
  add constraint teams_annual_fee_amount_nonneg check (annual_fee_amount >= 0),
  add constraint teams_monthly_fee_amount_nonneg check (monthly_fee_amount >= 0),
  add constraint teams_point_card_price_nonneg check (point_card_price >= 0);

alter table practice_sessions
  add constraint practice_sessions_member_price_nonneg check (member_price >= 0),
  add constraint practice_sessions_guest_price_nonneg check (guest_price >= 0);

alter table session_templates
  add constraint session_templates_member_price_nonneg check (member_price >= 0),
  add constraint session_templates_guest_price_nonneg check (guest_price >= 0);

alter table membership_fees
  add constraint membership_fees_amount_nonneg check (amount >= 0);

alter table session_registrations
  add constraint session_registrations_charged_amount_nonneg check (charged_amount >= 0);

alter table stamp_purchases
  add constraint stamp_purchases_amount_nonneg check (amount >= 0);

alter table transfer_records
  add constraint transfer_records_amount_nonneg check (amount >= 0),
  add constraint transfer_records_platform_fee_nonneg check (platform_fee >= 0),
  add constraint transfer_records_net_amount_nonneg check (net_amount >= 0);
