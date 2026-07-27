-- webhook の handleInvoicePaid は stripe_invoice_id のユニーク制約で
-- リトライ時の二重INSERTを防ぐ前提で実装されているが、実際にはこの制約が
-- 存在していなかった（(team_id, swimmer_id, type, period) のみ）。
-- 同一月に複数の請求（比例配分等）が発生した場合に正規の2件目が
-- "duplicate" として握りつぶされてしまうため、正しい冪等性キーを追加する。
create unique index if not exists membership_fees_stripe_invoice_id_key
  on membership_fees (stripe_invoice_id)
  where stripe_invoice_id is not null;
