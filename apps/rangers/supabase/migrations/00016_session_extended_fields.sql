-- セッション拡張フィールド
-- 合宿終了日時、待ち合わせ場所、性別絞り込み

alter table practice_sessions
  add column if not exists end_at timestamptz,
  add column if not exists meeting_point text,
  add column if not exists gender_filter text not null default 'all' check (gender_filter in ('all', 'male', 'female'));
