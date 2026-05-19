-- profiles テーブル拡張（コーチプロフィール充実化）
alter table profiles
  add column if not exists bio text,
  add column if not exists career text,
  add column if not exists achievements text,
  add column if not exists specialties text[] default '{}',
  add column if not exists prefecture text,
  add column if not exists target_ages text[] default '{}',
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists review_count integer not null default 0;

-- lessons テーブル拡張
alter table lessons
  add column if not exists lesson_type text not null check (lesson_type in ('individual', 'group')) default 'individual',
  add column if not exists specialty text,
  add column if not exists target_age text,
  add column if not exists target_level text;

-- インデックス
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_prefecture on profiles(prefecture);
create index if not exists idx_lessons_lesson_type on lessons(lesson_type);
create index if not exists idx_lessons_specialty on lessons(specialty);
