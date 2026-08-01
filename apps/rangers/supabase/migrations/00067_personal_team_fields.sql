-- パーソナル(team_type='personal')の自己紹介・経歴実績・指導対象年齢を、
-- profilesではなくteams自身のカラムとして持つよう変更する。
-- 従来はteams作成時にprofiles.career/bioへ書き戻す設計だったが、
-- 1人が複数のパーソナルを持つ場合に経歴が共有されてしまう問題があるため、
-- パーソナルごとに独立したデータとして持つ設計に変更する。

alter table teams add column if not exists bio text;
alter table teams add column if not exists career text;
alter table teams add column if not exists target_ages text[] not null default '{}';

comment on column teams.bio is 'パーソナルの自己紹介。team_type=personalのみ使用。teams固有でprofilesとは非連携。';
comment on column teams.career is 'パーソナルの経歴・実績(統合)。team_type=personalのみ使用。teams固有でprofilesとは非連携。';
comment on column teams.target_ages is 'パーソナルの指導対象年齢。team_type=personalのみ使用。';

-- 旧「肩書き」欄。career/bioへの置き換えでコード参照が完全になくなったため削除する
alter table teams drop column if exists instructor_title;
