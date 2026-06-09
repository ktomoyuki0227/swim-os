-- stamp_purchases に支払いステータスと支払い方法を追加
-- 現金前払い（既存レコード）はすべて paid/cash として扱う
-- Stripe 実装時は payment_method='stripe' でレコードを作成し、
-- コールバックで status を paid/failed に更新する

ALTER TABLE stamp_purchases
  ADD COLUMN status TEXT NOT NULL DEFAULT 'paid'
    CHECK (status IN ('paid', 'unpaid', 'failed')),
  ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'stripe'));

-- 既存レコードは現金前払いで受け取り済みとして扱うため、DEFAULT のまま（paid/cash）で問題なし

-- 検索用インデックス（支払い状況ドーナツグラフ・未払い一覧で使用）
CREATE INDEX idx_stamp_purchases_status ON stamp_purchases(team_id, status);
