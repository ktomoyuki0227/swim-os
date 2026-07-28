-- notifications テーブルに、マイグレーション履歴にない重複ポリシー(過去に直接本番へ適用されたと
-- 思われる日本語名のポリシー)が存在し、multiple_permissive_policies警告(anon/authenticated等
-- 複数ロール分)の原因になっていた。
-- notifications_select_own / notifications_update_own (00006で作成、00047でauth.uid()を最適化済み)
-- と条件が完全に同一(user_id = auth.uid())であることを pg_policy で確認済みのため、
-- 重複側を削除して1本化する。認可ロジックへの影響はない。
drop policy if exists "ユーザーは自分の通知を参照できる" on notifications;
drop policy if exists "ユーザーは自分の通知を既読にできる" on notifications;
