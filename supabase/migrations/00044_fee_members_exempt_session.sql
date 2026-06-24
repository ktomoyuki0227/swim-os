-- 年会費・月謝会員のセッション参加費免除フラグ
-- チームごとに「年会費または月謝を支払っているメンバーはセッション参加費を免除する」設定を追加

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS fee_members_exempt_session boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN teams.fee_members_exempt_session IS
  '年会費・月謝会員のセッション参加費免除フラグ。trueの場合、membership_type が annual または monthly のメンバーはセッション参加費が無料になる。';
