-- teams テーブルに問い合わせ用連絡先を追加
alter table teams
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
