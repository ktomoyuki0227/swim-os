-- M-11: 00008_performance_indexes.sql は idx_announcements_team を
-- (team_id, created_at DESC) の複合インデックスとして再作成する意図だったが、
-- CREATE INDEX IF NOT EXISTS は名前だけを見て存在チェックするため、
-- 00006 で作成済みの単一カラム版(team_id のみ)がサイレントに温存され、
-- 意図した複合インデックスは一度も作られていなかった（本番DBで確認済み）。

drop index if exists idx_announcements_team;
create index idx_announcements_team on announcements(team_id, created_at desc);
