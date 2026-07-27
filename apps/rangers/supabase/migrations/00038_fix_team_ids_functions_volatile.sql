-- HIGH-2: get_my_team_ids() / get_my_admin_team_ids() が 00011/00012 で STABLE
-- 宣言のまま登録されていた。STABLE のまま関数内で `set local row_security = off` を
-- 実行すると、RLS評価コンテキストでPostgresがこれを拒否し、対象データが
-- サイレントに見えなくなる既知の障害パターンになる。
--
-- 本番DB調査の結果、実際には両関数は既に VOLATILE として稼働していることを確認した
-- （過去に本番へ直接SQLを当てて修正されたが、マイグレーションとして記録されていなかった）。
-- 新規環境構築や `supabase db reset` を行っても同じ状態を再現できるよう、
-- この修正を正式なマイグレーションとして記録する。

alter function get_my_team_ids() volatile;
alter function get_my_admin_team_ids() volatile;
