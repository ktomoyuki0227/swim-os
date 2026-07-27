-- HIGH-11: handle_new_user（auth.users INSERTトリガー）と
-- update_instructor_rating（reviews INSERT/UPDATE/DELETEトリガー）が
-- SECURITY DEFINER でありながら search_path を固定しておらず、
-- search_path hijacking（同名オブジェクトを先に解決させる攻撃）のリスクがある。
-- increment_stamp_by（CRIT-4）等と同様に search_path を固定する。

alter function handle_new_user() set search_path = public, pg_temp;
alter function update_instructor_rating() set search_path = public, pg_temp;
