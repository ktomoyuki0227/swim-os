-- 6回目の全体レビュー: 決済関連テーブルのRLS書き込みポリシーのうち、
-- アプリコードから一切使われていないものを削除する。
--
-- 検証方法: actions/**配下を全文grepし、session_registrations/membership_fees/
-- stamp_purchases への INSERT/UPDATE/DELETE が全て adminClient(service_role) または
-- SECURITY DEFINER RPC(register_for_session / add_stamp_purchase、いずれも
-- service_role限定)経由であることを確認済み。以下のポリシーは対応する呼び出しが
-- コード上に存在しない「未使用の直接書き込み経路」であり、万一 authenticated の
-- JWTが漏洩・悪用された場合に、Stripe決済やRPCのロック・冪等性チェックを完全に
-- バイパスして支払い状態(payment_status/charged_amount/stamp_remaining等)を
-- 直接改ざんできてしまう。service_role は RLS を常にバイパスするため、
-- これらのポリシーを削除してもアプリの正規動作には一切影響しない。

-- session_registrations: INSERT は register_for_session RPC のみ、
-- UPDATE/DELETE は全箇所 adminClient 経由(actions/sessions/{crud,payments}.ts,
-- actions/sessions/reporting.ts)
drop policy if exists "registrations_insert" on session_registrations;
drop policy if exists "registrations_update" on session_registrations;
drop policy if exists "registrations_delete" on session_registrations;

-- membership_fees: UPDATE は全箇所 adminClient 経由(actions/fees.ts)。
-- INSERT(fees_insert_admin)は bulkCreateFees が通常クライアントで使用しているため維持。
drop policy if exists "fees_update_admin" on membership_fees;

-- stamp_purchases: INSERT は add_stamp_purchase RPC のみ、DELETE の呼び出しはコード上ゼロ
drop policy if exists "stamp_purchases_insert_admin" on stamp_purchases;
drop policy if exists "stamp_purchases_delete_admin" on stamp_purchases;
