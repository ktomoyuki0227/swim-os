-- 7回目の全体レビュー(LOW): platform_settings_read ポリシー(00039)が
-- `to` 句なしで定義されており、デフォルトの public ロール(= anon含む全ロール)に
-- 適用されていた。teams.invite_code(00048)・practice_sessions(00057)の漏洩と
-- 同型のパターンであり、現状の値(手数料率等)は非機微だが一貫性のため
-- authenticated 限定に絞る。

drop policy if exists "platform_settings_read" on platform_settings;
create policy "platform_settings_read" on platform_settings for select
  to authenticated
  using (true);
