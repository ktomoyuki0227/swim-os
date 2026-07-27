-- M-10: lessons / bookings / reviews / schedule_requests は teams・
-- practice_sessions モデルに置き換えられた初期アーキテクチャの残骸。
-- 00018_unify_roles.sql で lessons/bookings の INSERT ポリシーが代替なく
-- 削除され、アプリコードからの参照も現在は0件（本番DBの行数も全テーブル0件を
-- 確認済み）。実データはないため破壊的な DROP は行わず、将来の開発者が
-- 迷わないようテーブルコメントで非推奨であることを明記するに留める。

comment on table lessons is
  'DEPRECATED: teams/practice_sessions モデルに置き換え済み。アプリコードから未参照(0行)。';
comment on table bookings is
  'DEPRECATED: session_registrations に置き換え済み。アプリコードから未参照(0行)。';
comment on table reviews is
  'DEPRECATED: lessons/bookings 廃止に伴い未使用。アプリコードから未参照(0行)。';
comment on table schedule_requests is
  'DEPRECATED: メッセージ機能に置き換え済み。アプリコードから未参照(0行)。';
