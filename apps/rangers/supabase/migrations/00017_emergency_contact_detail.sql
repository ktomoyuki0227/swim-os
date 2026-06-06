-- 緊急連絡先: 氏名・続柄カラム追加

alter table profiles
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_relation text;
