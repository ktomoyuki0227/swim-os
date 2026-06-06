-- プロフィール: スイマー向けフィールド追加
-- マスターズ水泳チーム管理に必要な個人情報・登録情報

alter table profiles
  add column if not exists furigana text,
  add column if not exists gender text check (gender in ('male', 'female', 'other')),
  add column if not exists birthday date,
  add column if not exists address text,
  add column if not exists emergency_contact text,
  add column if not exists swimwear_size text,
  add column if not exists masters_registered boolean not null default false,
  add column if not exists masters_number text,
  add column if not exists jsa_registered boolean not null default false,
  add column if not exists jsa_number text;
