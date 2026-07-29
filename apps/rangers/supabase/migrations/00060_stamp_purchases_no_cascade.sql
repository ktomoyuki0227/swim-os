-- 6回目の全体レビュー: stamp_purchases.team_id が teams への ON DELETE CASCADE に
-- なっており、将来チームの物理削除機能が追加された場合に決済履歴(スタンプ購入記録)が
-- 無警告で消え去ってしまう。membership_fees / transfer_records と同じ NO ACTION に揃え、
-- チーム削除の前に決済履歴の扱いを明示的に判断させる。
-- 現状 teams の物理削除経路は createTeam() のロールバック(メンバー登録失敗時、
-- 決済履歴が存在し得ないタイミング)のみのため、この変更による現行動作への影響はない。

alter table stamp_purchases drop constraint stamp_purchases_team_id_fkey;
alter table stamp_purchases
  add constraint stamp_purchases_team_id_fkey
  foreign key (team_id) references teams(id);
