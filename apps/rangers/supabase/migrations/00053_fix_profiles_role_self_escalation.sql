-- MEDIUM: profiles の UPDATE ポリシーが with check を明示していないため、
-- using句がそのままwith checkにも適用され role カラムの変更を一切制限していない。
-- team_members には00034で同種の自己昇格防止(with check)が既に入っているが、
-- profiles.role にはまだ入っていなかった。
--
-- 現時点でアプリコード・他のRLSポリシーのどこも profiles.role = 'super_admin' を
-- 権限判定に使っていないため実害はないが、将来プラットフォーム管理機能を
-- 実装した瞬間に自己昇格の穴になるため、今のうちに塞いでおく。
-- (role以外のカラム変更は従来通り許可。roleは現在値からの変更のみ拒否する)

drop policy if exists "自分のプロフィールのみ更新可" on profiles;
create policy "自分のプロフィールのみ更新可"
  on profiles for update
  using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and role = (select p.role from profiles p where p.id = (select auth.uid()))
  );
