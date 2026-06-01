-- practice_sessions の type CHECK 制約を拡張（camp, competition を追加）
alter table practice_sessions
  drop constraint if exists practice_sessions_type_check;

alter table practice_sessions
  add constraint practice_sessions_type_check
  check (type in ('practice', 'camp', 'competition', 'event', 'meeting'));

-- competition_fields カラムが存在しない場合は追加
alter table practice_sessions
  add column if not exists competition_fields jsonb;
