-- 2026-08-15 全体コードレビューでの調査結果を受けての対応。
-- (docs/for-reviewer/FULL_APP_REVIEW_2026-08-15.md 「Supabase Advisor L-9」参照)
--
-- lessons / bookings / reviews / schedule_requests は、Rangersが個人レッスン
-- 予約マーケットプレイスだった初期構想(00001, 00004, 00005)の残骸。
-- 00043で「アプリコードからの参照は0件、本番DBの行数も全テーブル0件」と
-- 確認された上で、00058で anon/authenticated からの権限も剥奪済み。
-- 今回の調査で改めて以下を確認し、削除して問題ないと判断した:
--   - apps/rangers 全体のコード・SQLに生存参照なし(grep確認済み)
--   - 本番DB(project: rangers / jeosqnkeyiwapeeujrml)で現在も全テーブル0行
--   - 同一モノレポ内の他アプリ(school-boost-ai)は別のSupabaseプロジェクト・
--     別スキーマであり無関係と確認済み
--
-- 万一の切り戻しに備え、実行前にSupabaseダッシュボードでバックアップ/PITRの
-- 取得を推奨する。
drop table if exists schedule_requests cascade;
drop table if exists reviews cascade;
drop table if exists bookings cascade;
drop table if exists lessons cascade;
