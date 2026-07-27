-- M-12: profiles を参照する多くのテーブル（team_members, session_registrations,
-- membership_fees, notifications, announcements 等）が ON DELETE 未指定
-- (デフォルト NO ACTION) のため、関連レコードが1件でもあると退会（アカウント
-- 削除）時に FK 違反でトランザクション全体が失敗する。
--
-- 検討の結果、参加登録・会費支払い履歴等の会計記録を物理削除せず保持する
-- 「論理削除」方針を採用する。物理削除(auth.users からの DELETE)を許容する
-- 設計にはしない — 関連レコードがある限り FK 違反で失敗する現状の挙動は
-- 会計記録を誤って消さないための安全装置としてそのまま維持し、
-- アプリの退会フローは本カラムを更新するだけにする。
--
-- 現時点でアプリに退会（アカウント削除）機能自体はまだ実装されていないため、
-- 今回はスキーマの準備のみ行う。将来実装する際は、この deleted_at を
-- 設定するだけの論理削除として実装すること（auth.users / profiles の
-- 物理削除は行わない）。

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.deleted_at IS
  '退会（論理削除）日時。NULL=有効アカウント。物理削除は行わず、退会時はこのカラムのみ更新すること。';
