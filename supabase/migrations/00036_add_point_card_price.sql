-- teams テーブルに point_card_price カラムを追加
-- 型定義には既に存在するが、マイグレーションが未適用だったため追加
-- IF NOT EXISTS で冪等性を確保

alter table teams add column if not exists point_card_price integer;

comment on column teams.point_card_price is '回数券のパック価格（円）。point_card_count 枚分の合計金額';
