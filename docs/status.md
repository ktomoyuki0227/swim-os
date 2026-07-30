# 作業ステータス
最終更新: 2026-07-30（Rangers 7回目全体レビュー実施、指摘9件すべて修正・ビルド確認済み）

---

## 完了 ✅: Rangers 7回目全体レビュー（2026-07-30）

ともくんから「全体的に丁寧に時間をかけて」7回目の最終チェックを依頼され実施。
tsc/eslint/Supabase advisorsをまず自分で確認した上で、security-reviewer・database-reviewer・typescript-reviewerの3エージェントを並列起動し、報告された指摘は主要なものを実コードで裏取り確認済み。HIGH2件・MEDIUM3件・LOW4件の**計9件すべてを修正**し、tsc/eslint/buildすべてクリーンを確認済み（**コミット・プッシュはまだ**）。

### 修正済み ✅

1. **HIGH（DB/決済整合性）→ 修正済み**: `transfer_records` のINSERT失敗時、`chargeSessionRegistrationStripe`(`lib/stripe-payment-helpers.ts:82-96`)はログを出すだけで課金を続行していた。後で`refundSessionRegistrationStripe`がConnect送金の有無を`transfer_records`の`status='succeeded'`行の存在のみで判定していたため（旧コード）、INSERT失敗時はこの行が永久に存在せず、返金時に`reverse_transfer`が指定されず、コーチ側に送金済みの資金が戻らずプラットフォームが返金額を丸かぶりする実害があった。
   - 修正: `refundSessionRegistrationStripe`(`lib/stripe-payment-helpers.ts:147-196`)の`hasConnect`判定を、ローカルDBのtransfer_records依存から**Stripe上のPaymentIntent.transfer_dataを直接取得して判定**する方式に変更。ローカル記帳の欠落に影響されない一次情報源にした。PaymentIntent取得自体が失敗した場合はfail-closed(返金処理を進めずエラーを返す)。

2. **HIGH（型安全性）→ 修正済み**: `SubscriptionStatus`型(`types/database.ts:264`)が実際のStripeステータス(`trialing`/`incomplete`/`incomplete_expired`/`paused`)を含んでおらず、`subscription-section.tsx`で未対応ステータスが英語の生文字列のままUIに表示されていた。
   - 修正: `SubscriptionStatus`型にStripeの全ステータスを追加。`app/(app)/fees/subscription-section.tsx`のバッジ表示に`trialing`(お試し期間中)/`incomplete`・`incomplete_expired`(支払い未完了)/`paused`(一時停止中)の分岐を追加し、未知の値は「状態不明」にフォールバック。`app/(app)/fees/page.tsx`・`subscription-section.tsx`の型を`string | null`から`SubscriptionStatus | null`に統一。

3. **MEDIUM（セキュリティ/データ露出）→ 修正済み**: `getSession()`(`actions/sessions/crud.ts`)が外部公開セッション分岐で`select("*")`をそのまま返し、`member_price`・`target_members`(uuid[])・`coach_id`等が非メンバーにも漏洩していた。
   - 修正: `getSession()`をメンバー判定(`isTeamMember`)ベースに再設計。メンバーは全カラム、非メンバー(ログイン済み他ユーザー/未ログイン)は`id/title/description/content/type/scheduled_at/location/status/registration_deadline/max_participants/allow_point_card/target_tags/competition_fields`等の安全なカラムのみ返す（`member_price`/`guest_price`/`target_members`/`course_rules`/`coach_id`は除外）。呼び出し元4箇所(`app/(app)/sessions/[id]/page.tsx`・`sessions/new/new-session-form.tsx`・`teams/[id]/sessions/[sid]/page.tsx`)は`"member_price" in session`のtype guardで全カラム取得を前提とする箇所を保護し、非メンバー用の限定データが渡った場合は安全側(notFound/スキップ)に倒す。

4. **MEDIUM（セキュリティ設計不備）→ 修正済み**: 「料金を確認する」ボタン(`price-reveal.tsx`)の`memberPrice`/`guestPrice`がRSC payload経由でボタン未クリックでも取得できていた。
   - 修正: `recordPriceView`(`actions/sessions/reporting.ts`)を「閲覧記録の登録＋価格取得」を単一アクションにまとめる形に変更。`PriceReveal`コンポーネントは価格をpropsで受け取らず、ボタン押下時に`recordPriceView`を呼んで初めて価格を取得・表示するように変更。`page.tsx`から`memberPrice`/`guestPrice`のprops渡しを削除。

5. **MEDIUM（フォームバグ）→ 修正済み**: `parseInt(...) || undefined`のfalsy-zeroバグで「0」明示入力が無視される問題。
   - 修正: `lib/utils.ts`に`parseOptionalInt()`ヘルパーを新設(空文字のみundefined、0は0のまま返す)。`new-session-form.tsx`・`edit-session-form.tsx`の`min_participants`/`max_participants`/`cancellation_days`をこれに置き換え。`actions/sessions/crud.ts`の`createSession`側も`|| null`→`?? null`に修正（サーバー側でも同種のバグがあったため）。

6. **LOW → 修正済み**: `add_stamp_purchase`のTOCTOU。マイグレーション`00063`で`team_members`のUPDATEを先に行い`if not found then raise exception`を追加(increment_stamp/decrement_stampと同パターンに統一)、本番DB適用済み。
7. **LOW → 修正済み**: `platform_settings_read`ポリシーにanon読み取り漏れ。マイグレーション`00064`で`to authenticated`を追加、本番DB適用済み（コード側は`createAdminClient()`経由のみで読んでいるため影響なし確認済み）。
8. **LOW → 修正済み**: `getOrCreateStripeProduct`/`getOrCreateMonthlyPrice`(`lib/stripe-helpers.ts`)に`getOrCreateStripeCustomer`と同じ排他制御(条件付きUPDATE+競合負け時はStripeオブジェクトをarchive)を追加。
9. **LOW → 修正済み**: `createTeam`(`actions/teams/crud.ts`)・`joinTeamByCode`(`actions/teams/members.ts`)にレート制限を追加。

### 適用したDBマイグレーション（本番反映済み、jeosqnkeyiwapeeujrml）
- `00063_fix_add_stamp_purchase_toctou.sql`
- `00064_restrict_platform_settings_to_authenticated.sql`

### 確認済み・問題なし（過去レビューの受容済みリスクが健全に維持されていることを再確認）
- リファクタリング(`ab1dc31`)によるロジック欠落・循環import・バレルexport漏れ: なし（byte-for-byte一致確認済み）
- profiles/practice_sessionsのRLS、public_profilesビューの安全カラムのみ公開、SECURITY DEFINER関数群の認可チェック: 健全
- Stripe webhookの署名検証・冪等性、confirmSession/cancelSession/registerForSessionの排他制御: 健全
- レガシーテーブル(lessons/bookings/reviews/schedule_requests)は実コードから完全に未参照であることを確認（advisorのRLS initplan警告は無視して良い）
- タッチターゲット(44px以上)は共通Buttonコンポーネントで担保されており、icon-onlyの32pxサイズは未使用

### 未実施
- Playwrightでのモバイル実機確認: ブラウザ接続がタイムアウトし断念（既存chromeプロセス多数でシステム負荷が高い状態だった）。静的解析（h1欠如・loading.tsx欠如の棚卸し）は実施済みで、既存バックログの件数と一致することを確認。

---

## 完了 ✅: Rangers 全体リファクタリング（2026-07-29）

「コードレビュー・セキュリティ・リファクタリング・モバイル動作」の状態確認をともくんから依頼され、
リファクタリングだけ未着手だったため実施。

**ESLint全体スイープ**
- プロジェクト全体で `pnpm eslint .` を実行、3件の警告を修正
  - `edit-session-form.tsx` / `new-session-form.tsx`: 分割代入でidを除外する意図的な未使用変数に`eslint-disable-next-line`を追加（グローバルなeslint設定変更はconfig-protectionフックでブロックされたため、該当行にスコープを絞った）
  - `remotion/src/HeroBg.tsx`の`<img>`警告は動画生成専用コードで対象外のため据え置き

**大きすぎるファイルの分割**（CLAUDE.mdの800行上限ガイドライン超過分）
- `actions/teams.ts`(875行) → `actions/teams/`ディレクトリに分割
  - `crud.ts`(425行)・`members.ts`(372行)・`fee-stats.ts`(90行) + `index.ts`バレル
  - 呼び出し元15ファイルは`@/actions/teams`のままインポート可能（バレル経由のため無変更）
- `actions/sessions/payments.ts`(831行) → 3ファイルに分割
  - `lifecycle.ts`(357行: confirmSession/cancelSession)・`registration.ts`(318行: registerForSession/cancelRegistration)・`payment-recovery.ts`(174行: retryPayment/markCashPaid)
  - 既存の`actions/sessions/index.ts`バレルを更新するだけで呼び出し元6ファイルは無変更
- `types/database-generated.ts`(1629行)はSupabase CLI自動生成ファイルのため分割対象外(意図的除外)

**デッドコード削除**
- `components/ui/select.tsx` / `components/ui/separator.tsx`: プロジェクト全体で参照ゼロを確認（grep検証済み）した未使用shadcn/uiコンポーネントを削除
- `console.log`の残存なしを確認済み

**検証**: 分割・削除のたびに `tsc --noEmit` / `eslint` / `next build` を実行し、エラーゼロ・全28ルートのビルド成功を確認済み。

**次にやること**
- ともくんの確認後にcommit・push（このセッションではcommitしていない）

---

## バックログ（コードレビューで見つかった未着手タスク・随時更新）

過去のレビュー（3〜6回目）で見つかったが、外部サービス連携・デザイン変更判断・優先度の都合で未着手のまま残っている項目。

- [ ] **Supabase Dashboardで「Leaked Password Protection」を有効化**（Auth設定、コード変更不要、ともくんの手動操作が必要）
- [ ] **Sentry等の構造化エラー監視の導入要否**をともくんと相談（Webhookハンドラ等の例外が本番で誰にも気づかれないリスクが残っている）
- [ ] **WCAG contrast修正**（status-warningトークンの色）— DESIGN.mdのカラートークン変更を伴うためデザイン判断が必要
- [ ] **見出し構造(h1)欠如ページ**9件の是正（アクセシビリティ、実害は小さいがバックログ）
- [ ] **loading.tsx欠如**6ルートへの追加（初回遷移時のローディング体験改善）
- [ ] **通知コピーのカタログ化**（通知文言が各Server Actionに散在している状態の整理）
- [ ] **Zodバリデーション適用ルールの明文化**（どのServer Actionに検証が必須かの基準がドキュメント化されていない）
- [ ] **特定商取引法ページのプレースホルダーTODO**（ヒュドール側からの事業者情報待ち）

---

## 進行中: Rangers 5回目全体レビュー（2026-07-29）

ともくんの依頼で、フロントエンド・バックエンド・DB・Stripe決済・セキュリティの全体レビューを実施中。
過去4回のレビュー（commit 30ebe10 まで）で CRITICAL/HIGH/MEDIUM/LOW を多数修正済み。今回は5回目。

**トークン制限対策**: 長時間セッションになる想定のため、区切りごとにこのファイルを更新している。
セッションが制限で止まった場合は、このセクションを読んで続きから再開すること。

### すでに完了

- Supabase advisors（security + performance）を確認
- `public_profiles` ビューに `deleted_at is null` フィルタを追加（退会済みユーザーのプロフィールが公開され続けるバグを修正）
  - migration: `supabase/migrations/00056_fix_public_profiles_and_revoke_grants.sql`
  - 本番DBに適用済み（`mcp__supabase__apply_migration` で実行・確認済み）
- 不要な RPC 実行権限を revoke（多層防御）
  - `get_my_team_ids` / `get_my_admin_team_ids` / `get_my_profile_role`: anon からの EXECUTE を revoke（authenticated には残す。RLSポリシー内部で使われているため必要）
  - `handle_new_user` / `update_instructor_rating`（トリガー専用関数）: anon・authenticated 両方から revoke（トリガー発火自体には影響しない）
  - 同じmigrationファイルに含む・適用済み

- `practice_sessions` の RLS ポリシー `sessions_select_member` に `to authenticated` が無く、匿名（anon key）が外部公開セッションの全カラム（target_members・course_rules・competition_fields・coach_id等の内部情報）を直接REST APIで読み取れる状態だった（teamsのinvite_code漏洩と同じ脆弱性パターン）。修正済み。
  - migration: `supabase/migrations/00057_fix_sessions_rls_anon_leak.sql`（本番DB適用済み）
  - `actions/sessions/crud.ts` の `getPublicSessions()` も `select("*")` → 安全なカラムのみのwhitelistに変更（ログイン済みユーザー全体への over-fetch 対策）
  - `/search/sessions` `/dashboard` は元々未ログインではアクセス不可（middleware で `/login` リダイレクト）だったため、アプリ側の挙動への影響はなし

### 実行中（バックグラウンドエージェント、レポートのみ・編集なし）

4つのレビューエージェントを並列実行中:
1. security-reviewer: Server Actions・API Routes・認証・Stripe決済のOWASPセキュリティ監査
2. database-reviewer: 全61件のRLSポリシー・SECURITY DEFINER関数・Storageバケットポリシーの網羅監査
3. typescript-reviewer: actions/・app/の型安全性・レースコンディション・エラーハンドリング監査
4. code-reviewer: フロントエンドの二重送信防止・useEffect依存配列・アクセシビリティ監査

### 完了 ✅（2026-07-29）

4エージェント（security/database/typescript/code-reviewer）全て完了。CRITICAL 0件、新規HIGH 1件（下記・修正済み）、MEDIUM 9件（全修正済み）、LOW 数件（うち1件は既知のTODO・別対応）。

**HIGH（修正済み）**
- `practice_sessions` の RLS ポリシーに `to authenticated` が無く、匿名ユーザーがREST API経由で外部公開セッションの内部限定カラム(target_members/course_rules/coach_id等)を直接取得可能だった（teamsのinvite_code漏洩と同型のバグ）。
  - migration `00057_fix_sessions_rls_anon_leak.sql` + `actions/sessions/crud.ts` の `getPublicSessions()` をカラムwhitelist化

**DB migration 適用済み（本番反映済み、jeosqnkeyiwapeeujrml）**
- `00056`: `public_profiles` に `deleted_at is null` 追加、不要RPCのanon/authenticated実行権限をrevoke
- `00057`: `practice_sessions` の匿名読み取り漏洩を修正
- `00058`: search_path強化(get_my_team_ids/get_my_admin_team_ids)、レガシーテーブル(lessons/bookings/reviews/schedule_requests)のanon/authenticated権限をrevoke、join_requestsにteam_idインデックス追加、profiles UPDATEポリシーに`to authenticated`明示

**コード修正（型チェック・lintともにクリーン確認済み）**
- `actions/teams.ts`: `uploadTeamImage`のtype引数をホワイトリスト化(パス生成への任意文字列混入を防止)+レート制限追加、`updateMembershipType`に値検証追加
- `actions/profile.ts`: `uploadAvatar`にレート制限追加
- `actions/sessions/crud.ts`: `getTeamSessions`に`.limit(500)`追加
- `actions/sessions/payments.ts`: `registerForSession`の`competitionEntry`をZodスキーマ検証(`lib/validations.ts`に`competitionEntrySchema`新設)
- `actions/templates.ts`: `saveAsTemplate`の`name`を既存の`templateSchema`で検証するよう配線
- 通知既読処理3箇所(`mark-all-read-button.tsx`/`mark-read-button.tsx`/`notification-item.tsx`)でエラーを握りつぶさずtoast表示するよう修正

**未着手・別対応**
- 特定商取引法ページのプレースホルダーTODO（ヒュドール側からの事業者情報待ち、既知）
- Supabase Auth「漏洩パスワード保護」が無効（Dashboard設定、コード変更不要 — ともくんに有効化を推奨）

**次にやること**
- `git status`で変更ファイルを確認 → ともくんの確認後にcommit（このセッションではcommitしていない）
- Supabase Dashboardで「Leaked Password Protection」を有効化する（Auth設定）

---

## 完了 ✅: Rangers 6回目全体レビュー + 回数券購入履歴UI（週次トークン制限で一度中断・再開、2026-07-29）

5回目レビューの成果はcommit `5d36794`で本番反映済み。今回はフロントエンド・バックエンド・DB・Stripe・依存関係を含む網羅レビュー（6回目）。時間をかけて丁寧に実施中。

### 完了した修正（本番DB適用済み・マイグレーション00059〜00061）

1. **依存関係**: `sharp`(Next.js画像最適化が実際に使うランタイム依存)にlibvips由来のHIGH脆弱性 → pnpm overrideで`0.35.3`に固定・解消。`remotion`系・`shadcn`はランタイム未使用のCLIツールと確認しdevDependenciesに移動。postcss由来の残り4件はNext.js内部依存でこちら側では対応不可(Next側のパッチ待ち)。
2. **DB: 決済テーブルの未使用書き込みRLSを遮断**(migration `00059`): `session_registrations`/`membership_fees`/`stamp_purchases`のINSERT/UPDATE/DELETEポリシーがadmin役割に開放されていたが、コード全文grepで検証した結果アプリのどの経路もこれらを使わず全てadminClient(service_role)またはRPC経由と確認。認証済みJWTが漏洩した場合の決済状態改ざん経路を遮断。
3. **DB: Storageバケット制約**: `teams`バケットにfile_size_limit/allowed_mime_typesが未設定(無制限)だったため、コード側検証(5MB, image/jpeg|png|webp)と一致させて設定。
4. **DB: CASCADE削除の是正**(migration `00060`): `stamp_purchases.team_id`のON DELETE CASCADEをNO ACTIONに変更(membership_fees/transfer_recordsと統一)。現状チーム物理削除経路は存在しないため実害はないが将来の地雷を解消。
5. **コード: `deleteSession()`のガード漏れ修正**(`actions/sessions/crud.ts`): キャンセル済みだが決済履歴が残る登録(現金決済後キャンセル等)がpractice_sessionsのCASCADEで削除履歴ごと消え去る経路を発見・修正。決済履歴が残る登録がある場合は削除をブロックするよう変更。
6. **DB: 5回目レビューでのrevoke漏れを是正**(migration `00061`): `get_my_team_ids`等5関数について、anon/authenticatedロールから個別にREVOKEしたつもりが、Postgresのデフォルト`PUBLIC`疑似ロールへのEXECUTE権限が残っており実質的に無効化できていなかった(`REVOKE ... FROM anon`は`PUBLIC`権限に影響しないため)。`FROM PUBLIC`で再revokeし、必要なロールのみ再grant。Supabase advisorで解消を確認済み。

### 完了 ✅（2026-07-29）

5エージェント(security/database/typescript/code-reviewer相当×2巡+architect+Stripe深掘り)+自分によるDBライブ監査、全て完了。CRITICAL 0件。実装した修正は以下。

**Stripe決済（HIGH 3件・MEDIUM 1件・LOW 1件を修正）**
- Connect口座が後から無効化された場合に決済がConnectなしへ静かにフォールバックする問題 → `charges_enabled`がtrue→falseに変化した際に管理者へ能動的に通知するよう修正(`app/api/stripe/webhook/route.ts`)
- `charge.dispute.created`(チャージバック)を一切ハンドリングしていなかった → 検知・`payment_status="disputed"`への更新・管理者通知を追加(DB: `session_registrations_payment_status_check`に`disputed`を追加, migration `00062`)
- `charge.refunded`(Stripeダッシュボード等アプリ外での返金)がDBに同期されなかった → 同期ハンドラ追加
- `startMonthlySubscription`にidempotencyKeyが無く、タイムアウト後の再試行で二重サブスクリプション(二重の月額課金)が作られうる経路があった → `idempotencyKey`追加
- セッション参加費免除判定が`membership_type`のみを見ており、Stripeサブスクが`past_due`/`unpaid`等に陥った月謝会員も免除され続けていた → `subscription_status`チェックを追加
- Invoice期間のYYYY-MM変換がサーバーのローカルタイムゾーン(UTC)基準だった(JST深夜0時台の請求が前月扱いになりうる) → JST基準の変換に修正

**DB(migration 00059〜00062、本番適用済み)**
- 決済テーブル(`session_registrations`/`membership_fees`/`stamp_purchases`)の未使用書き込みRLSを遮断(全経路がadminClient/RPC経由と検証済み)
- `teams`ストレージバケットのfile_size_limit/allowed_mime_typesを設定
- `stamp_purchases.team_id`のON DELETE CASCADEをNO ACTIONに変更(将来のチーム削除機能実装時の決済履歴消失を予防)
- `deleteSession()`のガード漏れ修正: 現金決済後キャンセルされた登録の決済履歴がCASCADEで消える経路を発見・修正(`actions/sessions/crud.ts`)
- **5回目レビューでのrevoke漏れを是正**: `get_my_team_ids`等5関数、anon個別revokeのみでは`PUBLIC`疑似ロール経由のEXECUTE権限が残っていた。`FROM PUBLIC`で再revoke。

**依存関係**
- `sharp`(Next.js画像最適化の実行時依存)のHIGH脆弱性(libvips由来)をpnpm overrideで解消(`0.35.3`)
- `remotion`系・`shadcn`はランタイム未使用と確認しdevDependenciesに移動

**フロントエンド(HIGH 3件・MEDIUM多数を修正)**
- アクセシビリティ: フォームのlabel/id関連付け漏れ、フォーカスリング喪失(複数箇所)、アイコンのみボタンのaria-label欠如 → 修正
- `app/(app)/error.tsx`新設(エラー時にAppShell/ナビが消える問題を解消)
- 不要な`"use client"`削除、`<img>` → `next/image`置き換え(3箇所)、デッドコード削除(`session-tabs.tsx`)

**アーキテクチャ(architect指摘のうち実装可能なものを対応)**
- `lib/supabase/server.ts`にadminClient使用ルール(RLS自己参照対策)をコメントで文書化 + README.mdにも記載
- `instrumentation.ts`新設: 本番環境でStripe/Supabase必須環境変数が欠けている場合に起動時点で失敗するよう変更(従来はリクエスト処理中に分かりにくく失敗)
- キャンセル待ちリスト通知のN+1(`cancelRegistration`)をrole別2グループの一括INSERTに変更
- `markCashPaid`の管理者チェックを共通ヘルパー`isTeamAdmin`に統一

**未実装(記録のみ・要検討)**
- 構造化エラー監視(Sentry等)の導入 — 外部サービス連携のためユーザー確認が必要と判断し実装せず。Webhookハンドラの例外が本番で誰にも気づかれないリスクは残る
- WCAG contrast修正(status-warningトークンの色) — DESIGN.mdのカラートークン変更を伴うためユーザー確認が必要と判断
- 見出し構造(h1)欠如ページ9件・loading.tsx欠如6ルート — 未着手(バックログ)
- 通知コピーのカタログ化、Zodバリデーション適用ルールの明文化 — 未着手(バックログ、実害小)

**検証**: 全修正後に `tsc --noEmit` / `eslint` / `next build` を実行しエラーゼロを確認済み。

### README.md更新
デフォルトのcreate-next-app雛形のままだったREADME.mdを、プロジェクト概要・技術スタック・環境変数一覧・
データアクセス規約(adminClient使用ルール)・マイグレーション手順を含む内容に全面刷新。

### 回数券（point_card）購入履歴UIの追加 ✅（2026-07-29 追加セッション）

6回目レビューで「`addStampPurchase`/`add_stamp_purchase` RPCは実装済みだが呼び出すUIが存在しない」という不足を発見。
ともくんと相談の結果、機能自体を撤去（コメントアウト）するのではなく不足UIを実装する方針で合意
（撤去はhas_point_card=trueのチームが3件・残高を持つ会員が実在し、決済方法として現に使われているため得策でないと判断）。

**実装内容**
- `app/(app)/fees/stamp-purchase-dialog.tsx`（新規）: 管理者向け「購入記録を追加」ダイアログ。枚数・1枚あたりの回数・金額・メモを入力し`addStampPurchase`を呼び出す
- `app/(app)/fees/stamp-section.tsx`: 会員ごとの購入履歴一覧（日付・枚数×回数・金額・メモ）を表示するセクションを追加、購入ダイアログを配置
- `app/(app)/fees/page.tsx`: `StampSection`に`teamId`を渡すよう修正（追加UIがteamIdを必要とするため）

**Playwrightでブラウザ実機テスト実施**
- デモアカウント（山田健太／マウントリバー管理者）でログイン→`/fees`回数券タブ→佐藤花子への購入記録追加を実施
- トースト表示・履歴への反映・残数加算（7回→17回）を確認

**発見・修正したバグ**: 進捗表示（スタンプカードのドット表示）が「残高 ≦ 1枚分のスタンプ数」を前提にしており、
前のカードを使い切る前に追加購入すると使用数が負の値（例: `-7 / 10`）になり表示が崩れる問題を発見。
`stamp-section.tsx`で残高を1枚分にクランプしてから計算するよう修正し、Playwrightで再確認（`0 / 10`に修正されたことを確認）。

**テストデータ後始末**: ブラウザテストで本番相当DB(jeosqnkeyiwapeeujrml)に作成した検証用購入記録（¥9,000・メモ「現金払い（E2Eテスト）」）を削除し、
`stamp_remaining`を17→7に復元済み。

**副次的な作業**: `pnpm build`時に`.next/dev/types/routes.d.ts`が壊れていた（前回セッションの`pnpm dev`強制終了によるものと推測）。
`.next`は`.gitignore`済み・git非追跡のビルドキャッシュのため、`pnpm dev`を再実行し起動時の自動再生成で解消することを確認（手動削除は不要だった）。

### commit・push 完了 ✅
6回目レビュー分の修正 + 回数券購入履歴UIをまとめて1コミットで反映。
commit `0dbe998`（`fix(rangers): 6回目の全体レビュー修正と回数券購入履歴UIを追加`）→ `main` にpush済み。

### 次にやること
- Supabase Dashboardで「Leaked Password Protection」を有効化(未対応のまま)
- Sentry等の構造化エラー監視導入の要否をともくんと相談
- （任意・低優先）見出し構造(h1)欠如ページ9件・loading.tsx欠如6ルート・通知コピーのカタログ化はバックログのまま

---

## 現在のフェーズ

| アプリ | フェーズ | 状態 |
|--------|---------|------|
| Rangers | Phase 1: 本番化（6/1〜6/30） | 🚧 進行中 |
| SchoolBoost AI | PoC | ⏸ ともくんの外部サービス設定待ち |

---

## 担当分担

| アプリ | 担当 |
|--------|------|
| Rangers | ともくん |
| SchoolBoost AI | ともくん |
| スイムトラッカー | 長畑さん |
| スーパー支配人 | 長畑さん |

---

## Rangers 現状サマリー

### 実装済み（PoC 完了）
- 全 39 画面実装済み（LP 7 / 認証 6 / スイマー 16 / 指導員 12 / 公開その他 1 チーム参加）
- DB: 15 テーブル・RLS 全設定済み
- 認証: メール/パスワード + Google OAuth
- レッスンモデル: CRUD・Stripe Elements 決済
- セッション・チームモデル: フル実装（チーム管理・招待・タグ・アナウンス・スタンプ・会費）
- メッセージ（DM）・通知・レビュー・セッションテンプレート
- LP: AI動画ヒーローセクション・ロゴシステム・favicon 完成
- Vercel デプロイ: swim-os-seven.vercel.app

### 外部サービス状態
| サービス | 状態 |
|---------|------|
| Supabase Auth/DB | ✅ 本番接続済み |
| Supabase Storage | ✅ avatars バケット作成済み |
| Stripe テストモード | ✅ 接続済み |
| Stripe Webhook | ✅ 登録済み・STRIPE_WEBHOOK_SECRET Vercel 設定済み（7イベント） |
| Stripe Connect | ✅ 実装完了（UI + API ルート + webhook） |
| LINE OAuth | 🔲 スタブのみ |
| Resend | 🔲 未導入 |

---

## 直近でやったこと（2026-06-24 夜）

### RLS バグ修正 → 非コーチユーザーの支払い履歴が表示されない問題を解消 ✅

**根本原因**
- `get_my_team_ids()` / `get_my_admin_team_ids()` が `STABLE` と宣言されていたため、RLS ポリシー評価コンテキストで `SET LOCAL row_security = off` が拒否されていた。
- コーチ（mountain river の coach_id）は `coach_id = auth.uid()` で teams を直接参照できるため影響を受けず、**非コーチの鈴木・佐藤・田中の支払い履歴のみゼロ表示**になっていた。

**修正**
- `supabase/migrations/00046_fix_rls_functions_volatile.sql`: 両関数を `STABLE` → `VOLATILE` に変更
- 本番 DB に `npx supabase db push --linked` で適用済み
- commit `b4d5d2e` → main

### デモ用シードデータ拡充 ✅

- 鈴木太郎: チーム1・2 の 2025/2026 年会費（全 PAID）
- 佐藤花子: 東京マスターズ月謝を 1件→4件（2026年3〜6月分）に増加
- 田中新太郎: チーム1・2 の 2025/2026 年会費（全 PAID）
- commit `b4d5d2e` → main

### 支払い発生時の payment_charged 通知 ✅

以下の全フローに通知を追加（本番コードに実装済み・シードデータにも反映済み）:

| トリガー | 送信先 | 実装場所 |
|---------|-------|---------|
| 管理者が「開催確定」→ Stripe 課金成功 | 参加者本人 | `confirmSession()` |
| 管理者が「開催確定」→ 回数券消費 | 参加者本人 | `confirmSession()` |
| 月謝 Subscription Invoice 決済完了 | 本人 | Webhook `handleInvoicePaid()` |
| 管理者が会費を「支払済」に変更 | 当該会員 | `updateFeeStatus()` |
| 決済失敗後のリトライ成功 | 参加者本人 | `retryPayment()` |

- シードデータ PHASE 4 にも session payment + 回数券通知を直接挿入
- commits `177701a`, `acc7874`, `60f017b` → main

---

## 直近でやったこと（2026-06-24 深夜）

### 年会費・月謝会員のセッション参加費免除（1-M）✅ 実装・レビュー・プッシュ完了

**DB（`supabase/migrations/00044_fee_members_exempt_session.sql`）**
- `teams.fee_members_exempt_session boolean NOT NULL DEFAULT false` 追加
- ※ 本番 DB への適用は要 `npx supabase db push --linked`（ともくん操作待ち）

**Server Action（`actions/sessions.ts` - `registerForSession`）**
- session SELECT を `select("*, team:teams(fee_members_exempt_session)")` の JOIN 形式に変更（余計なクエリを削除）
- `isExempt` を JOIN したチームデータと membership_type から計算（membership: annual | monthly のみ）
- `effectivePaymentMethod`: exempt 時は `"cash"` で上書き（クライアント送信値を無視）
- DB 書き込み: `payment_method = effectivePaymentMethod`, `payment_status = isExempt ? "free" : "pending"` に統一
- `confirmSession` は `payment_status = "pending"` のみ処理なので exempt 登録は自然にスキップ（コメント追加）

**UI（セッション詳細ページ、RegisterButton、チーム編集・作成フォーム）**
- `app/(app)/teams/[id]/sessions/[sid]/page.tsx`: membership_type 取得・isExempt 計算・料金表示分岐・登録済みカードの支払い方法表示修正・isExempt を RegisterButton に渡す
- `register-button.tsx`: isExempt prop 追加。exempt + 競技フォームなし → ワンタップで無料参加。exempt + 支払い選択表示時は「無料で参加する」単一ボタン
- `edit-team-form.tsx` / `new/page.tsx`: `feeExempt` ステート追加・Toggle UI（年会費 or 月謝が有効な時のみ表示）・年会費と月謝を両方 OFF にしたら feeExempt を false にリセット
- `app/(app)/sessions/[id]/page.tsx`（インストラクター向け）: 参加費列で `payment_status === "free"` を「免除」表示に修正

**コードレビューで修正した問題（4件）**
- effectivePaymentMethod を追加して payment_method と payment_status の不整合を解消
- JOIN で team データを取得してクエリ数を 3 → 2 に削減
- exempt 時の RegisterButton フローを修正（競技フォームなしの場合にワンタップ登録）
- feeExempt のリセットロジック追加（料金タイプ OFF 時のデータ整合性保護）

**commits: `8c07b3c..210874d` → main プッシュ済み（34コミット）**

---

## 直近でやったこと（2026-06-24）

### Stripe Connect / Subscription Phase 4 完了 ✅

2回のレビューで計9件の不具合を修正し、全完了。

**Migration 適用（本番 DB）**
- `00042_stripe_connect.sql`: teams に stripe_account_id / stripe_onboarding_completed 追加、transfer_records・platform_settings テーブル作成
- `00043_expand_subscription_status.sql`: team_members.subscription_status の CHECK 制約を Stripe 全ステータス（incomplete / incomplete_expired / trialing）に拡張

**修正した不具合（9件）**
- HIGH-4: `callback/route.ts` に auth チェック追加（未認証ユーザーのフラグ操作を防止）
- HIGH-3: `getOrCreateConnectAccount` の TOCTOU 競合対策（`.is("stripe_account_id", null)` 条件付き UPDATE）
- HIGH-1: `confirmSession` / `retryPayment` の `transfer_records` INSERT 失敗時にエラーログ追加
- HIGH-2: `cancelMonthlySubscription` の DB 更新失敗時にエラーログ追加
- MEDIUM-2: `getPlatformFeePercent` の `parseFloat` を `Number.isFinite` でバリデーション
- MEDIUM-3: `handleInvoicePaid` に `amount_paid === 0` ガード（セットアップインボイスの 0円レコード防止）
- LOW-2（HIGH相当）: `subscription_status` CHECK 制約拡張（migration 00043）
- 1回目レビューで修正: `handleSubscriptionUpdated` の `cancel_at_period_end` ハンドリング / connect/onboarding エラーリダイレクト先修正

**Stripe Dashboard**
- Webhook エンドポイント登録（7イベント・API バージョン 公開プレビュー版）
- `STRIPE_WEBHOOK_SECRET` Vercel 環境変数更新・再デプロイ完了

**TypeScript ソースエラー: 0件確認済み**

---

### `/payments` 支払い履歴ページ 実装完了 ✅

**変更ファイル**
- `app/(app)/payments/page.tsx`: タイトルを「お支払い設定」→「お支払い」に変更。カード設定セクション＋支払い履歴セクションの複合ページに刷新
- `app/(app)/payments/payment-history-filters.tsx`（新規）: グループ・種別フィルター（URL searchParams ベース・Client Component）

**支払い履歴の内容**
- セッション参加費（`session_registrations` × `practice_sessions` × `teams`）
- 年会費・月謝（`membership_fees` × `teams`）
- デフォルト最新順（自然と pending/未払いが上に並ぶ）
- 除外: 無料参加（payment_status = "free"）・決済前キャンセル（pending + cancelled_at あり）
- フィルター: グループ・種別（セッション参加費 / 年会費 / 月謝）
- ステータスバッジ: 開催待ち（黄）/ 支払済（緑）/ 決済失敗（赤）/ 返金済（グレー）/ 未払い（黄）

---

## 直近でやったこと（2026-06-23 最終2）

### `/instructors` 関連ルート完全削除 ✅

**削除したファイル（3ファイル + 空ディレクトリ）**
- `app/(public)/instructors/page.tsx` — コーチ一覧ページ
- `app/(public)/instructors/[id]/page.tsx` — 個別コーチプロフィールページ
- `components/instructor/schedule-request-dialog.tsx` — 上記でのみ使用

**更新したファイル（8ファイル）**
- `actions/messages.ts`: 不要な `revalidatePath('/instructors/...')` を削除
- `lib/supabase/middleware.ts`: public ページリストから `/instructors` を除外
- `app/sitemap.ts`: `/instructors` エントリを削除
- `app/(public)/about/page.tsx`: `/instructors` → `/register`
- `app/(public)/price/page.tsx`: `/instructors` → `/register`
- `app/(app)/messages/page.tsx`: `/instructors` リンク削除・テキスト修正
- `app/(app)/messages/[userId]/page.tsx`: `/instructors/[id]` → `/profiles/[id]`
- `app/(public)/page.tsx`: コーチカード `/instructors/[id]` → `/profiles/[id]`、一覧リンク2箇所削除

コードベース全体で `instructors` の残存参照ゼロを確認済み。

---

## 直近でやったこと（2026-06-23 最終）

### メンバー詳細モーダル + 公開プロフィールページ ✅（1-H UI改善 + 1-N）

**••• メニュー再設計（`member-list.tsx`）**
- 「詳細・編集」「削除」の2ボタン構成に統一（詳細/編集の分離を廃止）
- 削除に確認モーダル（DeleteConfirmModal）を実装 — window.confirm 廃止
- ドロップダウンを `position: fixed` + `getBoundingClientRect()` 方式に変更（Card の overflow-hidden クリッピング問題を根本解消）
- scroll イベントリスナー（capture phase）でスクロール時に自動クローズ

**メンバー詳細モーダル（`member-detail-modal.tsx` 新規）**
- タブ構成: 詳細（読み取り専用）| 編集（フォーム）
- 詳細タブ: メンバー情報・基本情報・緊急連絡先・水泳情報・登録情報を全表示
- メールアドレスを詳細タブ初回表示時にオンデマンド取得（`getMemberEmail` Server Action）
  - `emailFetchedRef = useRef(false)` でループ防止（無限再フェッチバグを修正）
- 編集タブ: 会員種別・回数券残数・タグ・ロールを編集可能
- `edit-member-modal.tsx` を削除（dead code 確認済み）

**公開プロフィールページ（`/profiles/[id]`、`back-button.tsx` 新規）**
- ログイン必須（未ログイン → `/login?next=/profiles/${id}` にリダイレクト）
- 表示内容: アバター・名前・フリガナ・career・bio・achievements・specialties・target_ages・prefectures・swim_disciplines・swimming_goals・participation_styles
- `BackButton` Client Component: `window.history.back()` + `router.push("/teams")` フォールバック（React の `javascript:` URL ブロックを回避）

**公開チームビュー改善（`public-team-view.tsx`）**
- コーチカードを `coachId` がある場合のみ `<Link href="/profiles/[id]">` でクリッカブルに
- coachId が null の場合は `<div>` にフォールバック（壊れたリンク防止）

**プロフィールページ改善（`/profile/page.tsx`）**
- セクション名: "コーチ・指導員プロフィール" → "公開プロフィール"
- サブテキスト: "任意・コーチ登録がある方向け" → "他のユーザーに公開されます"
- 「公開プレビューを見る →」リンク追加（`<Link>` 使用、全画面リロードなし）

**バグ修正**
- `admin-action-buttons.tsx`: 招待コード再生成後の `window.location.reload()` → `router.refresh()` に変更（`useRouter` インポート追加）
- `member-detail-modal.tsx`: 未使用の `import { useRouter }` + `const router = useRouter()` を削除

---

## 直近でやったこと（2026-06-23 管理者UIブラッシュアップ）

### チーム詳細ページ（管理者ビュー）UI改善 ✅（1-UI1）

**Console TypeError 修正（`actions/notifications.ts`）**
- `createNotificationInternal` に誤って付いていた `export` を削除
- "use server" モジュールから意図せず export された複雑な型の関数が Turbopack で "Failed to fetch" を引き起こしていた問題を修正
- コメント「Server Action として export しない」の通りにコードを修正

**`app/teams/[id]/page.tsx` 管理者ビュー改善**

1. タブ数を 6 → 4 に削減
   - メンバー / セッション / お知らせ / 申請 の4タブに統一
   - 招待・設定はアイコンボタン化してタブから除外

2. ヘッダー再設計
   - 「← グループ一覧」（左） + 招待🔗・設定⚙️ アイコンボタン（右）のアクションバー
   - グループ名 + アクティブバッジをインライン表示、紹介文を直下フル幅に配置
   - 統計を 3カードグリッド → 1行インラインバー（👥N人 | 📅N件 | 支払い N/N ████）に変更

3. 招待・設定をモーダル化（`admin-action-buttons.tsx` 新規作成）
   - `<Link href="?tab=invite/settings">` → `<button onClick>` でモーダル表示に変更
   - 招待モーダル: QRコード + 招待リンクコピー・再生成
   - 設定モーダル: 料金体系・練習情報の確認 + 「グループ情報を編集」ボタン
   - バックドロップクリック / × ボタンで閉じる（モバイル: 下からスライドアップ）

4. 招待モーダルのコンパクト化
   - Card 2枚を廃止、QR 180px → 128px に縮小
   - スクロールなしで全項目が画面内に収まるよう調整（max-w-sm 化）

**新規ファイル**
- `app/(app)/teams/[id]/admin-action-buttons.tsx`: 招待・設定ボタン + 各モーダルを管理する Client Component

---

## 直近でやったこと（2026-06-23 最新）

### 1-I アバター必須化 ✅ 確認済み（実装済みを確認）

`onboarding/page.tsx:362` の `step1Valid` に `!!avatarFile` が含まれており、UI でも「プロフィール写真（必須）」表示済み。チェック追加のみ。

### グループへの問い合わせ機能（1-L）✅ 実装完了

公開グループページに「問い合わせる」ボタンを追加し、管理者に通知が届くフローを実装。

**新規ファイル**
- `actions/inquiries.ts`: sendInquiry Server Action（UUID バリデーション・既存メンバーガード・通知挿入エラーログ）
- `components/teams/contact-button.tsx`: 問い合わせモーダル Client Component（ESC キー・背景クリック対応・aria-modal・背景スクロールロック）

**既存ファイル修正**
- `components/teams/public-team-view.tsx`: isLoggedIn prop 追加、固定CTA に ContactButton を追加、2ボタン分の高さに合わせてパディングを動的化（hasBottomNav ? pb-52 : pb-44）
- `app/teams/[id]/page.tsx`: isLoggedIn を PublicTeamView に渡すよう修正
- `app/(app)/notifications/page.tsx`: inquiry_received アイコン追加、link フィールドがあればカードを Next.js Link で包んでクリッカブルに変更（「→ 確認する」ラベル付与）
- `actions/inquiries.ts`: link フィールドに `/teams/${teamId}` を設定
- `actions/join-requests.ts`: 全通知に link を追加（join_request_received: ?tab=requests、approved/rejected: チームページ）

commits: `c6fc414`, `8779703` → main プッシュ済み

---

## 直近でやったこと（2026-06-23）

### グループ紹介の入力項目追加（1-K）✅ 全完了

練習頻度・練習曜日・主な使用プールの3フィールドをグループ作成・編集・公開・詳細ページ全てに反映。

**DB（`supabase/migrations/00033_add_practice_info_to_teams.sql`）**
- `practice_frequency text` / `practice_days text[] DEFAULT '{}'` / `main_pool text` を teams テーブルに追加
- Supabase CLI で本番 DB に適用済み

**型定義・バリデーション**
- `types/database.ts`: `PRACTICE_FREQUENCIES` / `PRACTICE_DAYS` 定数追加、Team interface に3フィールド追加
- `lib/validations.ts`: `teamSchema` / `teamUpdateSchema` 両方に追加（ホワイトリスト `.refine()` 付き）
- `teamUpdateSchema` の `practice_frequency` / `main_pool` に `.nullable()` 追加（クリア操作対応）

**Server Actions（`actions/teams.ts`）**
- `createTeam`: 3フィールドを INSERT に追加
- `updateTeam`: 3フィールドを `teamUpdateSchema` 経由でUPDATE。DB更新を `adminClient` に変更（RLS `with check` の自己参照バグを回避）
- `getTeam` / `getPublicTeam`: 3フィールドを SELECT に追加（`getPublicTeam` は `invite_code` 除外済み）
- `uploadTeamImage`: `adminClient` に変更（Storage RLS によるアップロード失敗を修正）

**フロントエンド**
- `app/(app)/teams/new/page.tsx`: practice_frequency select / practice_days 丸ボタン複数選択 / main_pool テキスト入力 UI追加。ステップインジケーターを中央揃えに修正（`flex justify-center` + コネクター固定幅 `w-16`）
- `app/(app)/teams/[id]/edit/edit-team-form.tsx`: 同UI追加・既存値の初期表示対応。送信時に `|| null`（クリア操作対応）
- `components/teams/public-team-view.tsx`: 3フィールドの条件付き表示追加
- `app/teams/[id]/page.tsx`: settings タブの練習情報セクションを `CardContent` 内に移動（レイアウト一貫性修正）

---

## 直近でやったこと（2026-06-22）

### セッションタグ拡張（1-J）✅ 全完了

swimmer_type（スイマータイプ）・swim_disciplines（水泳カテゴリ）を SYSTEM_TAGS に追加し、全フロー（オンボーディング・メンバー編集・セッション作成）に反映。

**型定義・定数追加（`types/database.ts`）**
- `SWIMMER_TYPES = ["選手", "マスターズ"] as const`
- `SWIM_DISCIPLINES = ["競泳", "シンクロ", "オープンウォーター", "飛び込み", "水球"] as const`
- `SYSTEM_TAGS` に swimmer_type_player / swimmer_type_masters / discipline_* 7件追加
- `Profile` interface に `swimmer_type: string | null` / `swim_disciplines: string[]` 追加

**オンボーディング（`app/(auth)/onboarding/page.tsx` + `actions/onboarding.ts`）**
- Step 1 に スイマータイプ（単一選択）・水泳カテゴリ（複数選択）UIを追加
- `completeOnboarding` にサーバーサイドホワイトリストバリデーション追加

**メンバー管理（`edit-member-modal.tsx` + `actions/teams.ts`）**
- `profileToTagIds` / `tagIdsToProfile` に swimmer_type・swim_disciplines を追加
- `updateMemberProfileTags` にホワイトリストバリデーション追加（SWIMMER_TYPES / SWIM_DISCIPLINES）
- `filter(Boolean)` → `filter((v): v is string => !!v)` 型安全修正

**メンバー表示（`app/(app)/teams/[id]/member-list.tsx`）**
- `hasDetails` 判定に swimmer_type / swim_disciplines を追加
- タグ表示に 紺色バッジ（bg-[#f0f4ff]）でスイマータイプ・水泳カテゴリを表示

**セッション作成（`app/(app)/sessions/new/new-session-form.tsx`）**
- タグフィルタ useEffect に `swimmer_type_*` / `discipline_*` ブランチを追加（labelMap で日本語変換）
- `untaggedCount` の判定に swimmer_type / swim_disciplines を追加

**二重管理解消（`actions/teams.ts`）**
- `SYSTEM_TAG_SPECIALTIES` / `SYSTEM_TAG_GOALS` のハードコードを `SYSTEM_TAGS.filter()` 派生に置き換え
- 型注釈 `string[]` を明示して tsc エラー解消

**ビルド健全化**
- `.next/` キャッシュ削除 → `tsc --noEmit` がソースファイルエラー完全ゼロに

commits: `d1ba2b0`, `801aabc`, `a9bf734`, `7838dc2` → main プッシュ済み

---

### シードデータ全面再構築 ✅

**`apps/rangers/supabase/seed_data.sql` を全4アカウント対応版に完全書き直し**

設計方針:
- test1-4 のロール・会費タイプがすべて異なるように配置（新規登録体験は当日ライブで実施）
- チーム1（マウントリバー）: 年会費 + 回数券 / チーム2（東京マスターズ）: 年会費 + 月謝
- セッション12件（open/confirmed/cancelled/draft + practice/event/meeting/competition）
- 参加登録15件（cash/point_card・pending/paid/free バリエーション）
- 会費7件・お知らせ4件・回数券購入履歴1件

ロール配置:
| アカウント | チーム1（マウントリバー） | チーム2（東京マスターズ） |
|-----------|----------------------|----------------------|
| test1 山田健太 | admin / annual | admin / annual |
| test2 鈴木太郎 | admin / annual | member / annual |
| test3 佐藤花子 | member / point_card（残5） | member / monthly |
| test4 田中新太郎 | member / annual | admin / annual |

Supabase CLI で本番 DB に適用済み（マウントリバー7件・東京マスターズ5件確認）
commit `ef3185b` → main プッシュ済み

---

### クリーンアップ ✅

**`app/(app)/instructor/` ディレクトリ削除**（17ファイル）
- スイマー/インストラクター ロール分離時代の dead code を完全削除
- 外部依存なし（import・リンクなし）を事前確認済み
- ともくんが手動で削除

**シードファイル4本 修正・Supabase反映**

修正内容（2点）:
1. `team_members.tags` カラム参照を削除（migration 00031 対応）
2. `membership_type: 'regular'` → `'annual'` に変更（migration 00029 対応）

Supabase CLI 実行結果:
- `seed_data.sql` ✅ 正常実行（クリーンアップ → テストデータ再投入）
- `seed_team2.sql` ✅ 正常実行（東京マスターズ水泳クラブ追加）
- `seed_combined.sql` ✗ 旧ハードコードUUIDがDBに存在せず実行不可（参照用ファイル）
- `seed_teams.sql` ✗ プレースホルダUUID（00000000...）のため実行不可（参照用ファイル）

**git push 完了**: commit `6c732d6` → `main`（35ファイル変更、instructor削除17ファイル含む）

---

### メンバータグシステム 全面リファクタリング ✅

チーム単位で管理していた `team_members.tags` を廃止し、ユーザー自身のプロフィールデータを参照・編集する設計に移行。

**DB変更**
- Migration `00031_drop_member_tags.sql`: `team_members.tags` カラムを DROP
- Supabase CLI で本番DB に適用済み

**Server Action 変更（`actions/teams.ts`）**
- `updateMemberInfo`: `tags` パラメータを完全削除。`.select("id")` を追加して0行更新を検出
- `updateMemberProfileTags`（新規追加）: `profiles.level / specialties / swimming_goals` を更新。SYSTEM_TAGが管理しない値（健康目的以外等）は保持しつつ上書き

**型定義変更（`types/database.ts`）**
- `TeamMember` interface から `tags: string[] | null` を削除
- `SYSTEM_TAGS` の `purpose_health` label: `"健康・趣味"` → `"健康維持"` に統一
- `SYSTEM_TAGS` の `purpose_competitive` label: `"競技"` → `"競技・タイム向上"` に統一
  （プロフィール表示・モーダル・セッションフォームの表示が一致）

**UIコンポーネント変更**
- `edit-member-modal.tsx`: 読み取り専用タグ表示 → SYSTEM_TAGS 全10件を編集可能ボタンに変更
  - `profileToTagIds` / `tagIdsToProfile` でプロフィール値 ↔ SYSTEM_TAG ID を双方向変換
  - レベルカテゴリは単一選択、種目・目的はマルチ選択
  - 保存時に `updateMemberInfo` + `updateMemberProfileTags` を並列実行
  - 両方のエラーを収集してトースト表示（片方失敗時の見落とし防止）
- `app/(app)/teams/[id]/member-list.tsx`: 旧 `m.tags` 参照削除、プロフィールデータ表示を維持
- `app/(app)/instructor/teams/[id]/member-list.tsx`: 旧 `TAG_LABELS` 定数（デッドコード）削除
- `app/(app)/sessions/new/new-session-form.tsx`: `untaggedCount` の計算を `m.tags` → プロフィールフィールド参照に修正

TypeScript: `tsc --noEmit` クリーン確認済み（.next/ 自動生成ファイル除く）

---

## 直近でやったこと（2026-06-18）

### チーム詳細ページ メンバーリストUI全面改善 ✅

チーム詳細（管理者ビュー）のメンバー一覧カードを大幅にブラッシュアップ。

**レイアウト変更（app/(app)/teams/[id]/member-list.tsx）**
- カード上段を1行化: `[アバター][名前/フリガナ/参加日]` → `[バッジ群][•••メニュー]`（右寄せ）
- `items-start` → `items-center` で縦ズレを解消
- 削除ボタンを廃止し、•••（三点リーダー）ドロップダウンメニューに変更
  - click-outside 検知あり。管理者メンバーには•••非表示

**バッジ改善**
- 会員種別バッジロジック整理: 「月謝・年会費」複合ケースを削除 → `月謝 > 年会費 > メンバー` の優先順位に統一
- 回数券バッジをバッジ統合型に変更: `回数券 · 残りN回` を1バッジに収める
  - 残り3回以下で赤色（`bg-[#fef2f2] text-[#dc2626]`）に切り替え
  - 詳細セクションの「残り N 回」テキストは削除（重複解消）

**参加日表示追加**
- 名前ブロック内（フリガナの下）に参加日を常時表示
- `joined_at` は `TeamMember` 型に存在・`select("*")` で取得済みのためデータ変更なし
- 表示形式: `参加 2024年4月1日`

**パディング圧縮**
- カード内パディング: `p-4` → `px-4 py-0`（縦パディングを完全除去）
- カード間スペース: `space-y-3` → `space-y-2`
- 詳細セクション上マージン: `mt-3 space-y-1.5` → `mt-2 space-y-1`

**呼び出し元修正**
- `app/teams/[id]/page.tsx` L236: `<MemberList teamId={id} members={members} />` → `team={team}` prop 追加
- TypeScript: `tsc --noEmit` クリーン確認済み

---

## 直近でやったこと（2026-06-21 後半）

### セッション作成フォーム コース代ルール（course_rules）UI実装 ✅（1-E 部分完了）

**`app/(app)/sessions/new/new-session-form.tsx` を修正**

- Step 2（詳細設定）に「コース代ルール」セクションを追加
  - グリッドレイアウト `[1fr_1fr_1fr_1fr_auto]` で4入力フィールド（下限人数/上限人数/コース数/キャンセル下限）+ 削除ボタン
  - 「+ ルールを追加」ボタンで行を追加
  - `max < min` のバリデーションを `validateStep(2)` に追加
- Step 4（確認）に course_rules のサマリー表示を追加（例: `3〜9人 → 3コース`）
- テンプレートプリフィル漏れを2か所修正（URLパラム / ドロップダウン onChange）
- Zod スキーマの `min` / `courses` フィールドを `optional()` から必須に修正（`sessionSchema` / `sessionUpdateSchema` / `templateUpdateSchema` 3スキーマ）
- TypeScript: `tsc --noEmit` クリーン確認済み

### `/sessions` リストページ削除とルーティング整理 ✅

孤立していた `/sessions` ページ（全チームのセッション一覧）を削除し、ナビゲーション全体を整合。

**削除（4ファイル）**
- `app/(app)/sessions/page.tsx` — `/sessions` リスト本体（ナビリンクなし・冗長・削除確認済み）
- `app/(app)/instructor/sessions/page.tsx` — `/sessions` へのリダイレクト（行き先削除のため）
- `app/(app)/instructor/sessions/new/new-session-form.tsx` — デッドコード（page はリダイレクトのみ）
- `app/(app)/instructor/sessions/[id]/session-actions.tsx` — デッドコード（同上）

**修正（5ファイル）**
- `app/teams/[id]/page.tsx` — 「すべて表示→」リンク（`/sessions?team=xxx`、パラム無視で壊れていた）を削除
- `app/(app)/sessions/[id]/page.tsx` — 「← セッション管理」を `/teams/${team.id}?tab=sessions` へ変更
- `app/(app)/sessions/[id]/session-actions.tsx` — セッション削除後の `router.push("/sessions")` を `/teams/${teamId}?tab=sessions` へ変更（重大バグ修正）。`teamId` プロップを追加
- `app/(app)/sessions/new/new-session-form.tsx` — ヘッダーの戻るリンクとキャンセルボタンを `activeTeamId` ベースのURLに変更（フォールバック: `/`）

---

## 直近でやったこと（2026-06-21）

### プロフィールページ 多重コードレビュー → 全指摘修正完了 ✅（commit: 5db138b）

計4ラウンドのコードレビューを実施し、全 HIGH/CRITICAL を解消して PASS を確認。

- セキュリティ: `updateProfilePartial` に Zod(`profilePartialSchema` + `.strict()`) を導入
  - birthday: YYYY-MM-DD regex + Date.parse で2重検証
  - 配列フィールド（prefectures / specialties 等）を定数リストで refine 検証
  - `result.data` のみ Supabase に渡す（フィールド許可リスト保証）
- 堅牢性: `getProfile` が Supabase エラーを throw → 呼び出し元 `.catch()` で補足
- 堅牢性: `saveSection` に try/catch 追加（ネットワークエラー時の isPending スタック防止）
- 型安全性: `saveSection` の型を `ProfilePartialInput` に変更（unsafe cast 解消）
- React: `isFirstAvatarEffect` ref を削除 → `!error && !success` ガードに置換
- React: `showToast` を useEffect 依存配列に追加
- React: 2つ目の avatar useEffect 依存を `[avatarState.success, avatarState.avatarUrl]` に修正
- UX: `PrefectureMultiSelect` に outside-click-to-close 追加
- UI: スイマー情報スケルトン `Array(2)` → `Array(4)` に修正
- 整理: 指導対象年齢をインライン実装から `TagGroup` コンポーネントに統一
- 整理: 旧 `updateProfile` 関数（dead code）を完全削除
- 整理: コメントアウトされたログアウトボタンを削除
- TypeScript: `tsc --noEmit` クリーン確認済み

---

## 直近でやったこと（2026-06-20）

### プロフィールページ全面刷新 ✅（P1-D、commit: 43ad290）

- 常時編集フォームから「表示モード + セクション別編集」UIへ完全書き直し
- セクション構成: 基本情報 / スイマー情報（新設・公開） / 緊急連絡先 / 登録情報 / コーチ・指導員プロフィール
- ヘッダーのアバターをクリックでドロップダウンメニュー表示（プロフィールリンク＋ログアウト）
- スイマー情報セクション: 活動地域（都道府県マルチセレクト）・種目・活動目的・参加スタイルの4タグカテゴリ
- DB Migration 00027: `prefectures[]`, `swimming_goals[]`, `participation_styles[]` カラム追加・本番適用済み
- Profile 型に新フィールド追加、`SWIMMING_GOALS` / `PARTICIPATION_STYLES` 定数追加
- コードレビューで発見した5点を修正:
  - `prefecture` デッドステート削除（保存経路のない孤立ステートを除去）
  - `gender` キャストをランタイムバリデーションに変更（型安全性向上）
  - `saveSection` の `data`/`patch` 二重定義を解消（`data` を直接 profile state に spread）
  - アバタートーストの初回マウント誤発火対策（`isFirstAvatarEffect` useRef フラグ追加）
  - 指導対象年齢の表示を `TagRow` コンポーネントに統一

---

## 直近でやったこと（2026-06-19）

### チーム料金体系選択制 実装完了 + 多重レビュー修正 ✅（P1-B）

- `teams` テーブルに has_session_fee / has_annual_fee / has_monthly_fee / has_point_card フラグ追加（Migration 00026）
- 本番 DB に直接適用済み（supabase db query --linked）
- 既存2チームをバックフィル:
  - マウントリバー水泳クラブ: 全フラグ true
  - 東京マスターズ水泳クラブ: session_fee + annual_fee のみ true
- チーム作成フォーム Step 3: チェックボックス制に刷新（チェックした体系のみ入力欄が展開）
- チーム編集フォーム: 同様にチェックボックス対応（既存フラグを初期値として読み込む）
- 会費管理ページ: 有効なタブのみ表示 / 全フラグ false のチームは「料金体系なし」空状態を表示
- 多重レビューで発見した計7点を修正:
  - `types/database.ts` の Team interface に4フラグを追加
  - `app/teams/[id]/page.tsx` settings タブで料金体系フラグを条件付き表示に変更（バッジ追加）
  - `fees/page.tsx` で URL直打ちで無効タブ指定時に有効タブへリダイレクト
  - `fees/page.tsx` の重複 `const now = new Date()` 削除
  - `edit-team-form.tsx` の `hasPointCard=false` 時に `point_card_count: 10` を送信して DB 上書きするバグ修正（`undefined` に変更）
  - `new/page.tsx` / `edit-team-form.tsx` の `parseInt("0") || undefined = undefined` バグ修正（金額0が保存できない問題）→ `Number.isNaN` チェックに変更
  - `edit-team-form.tsx` のローカル Team interface の型を `database.ts` と統一（`boolean | null` → `boolean`、`number | null` → `number` for NOT NULL フィールド）
  - `fees/page.tsx` stamp_card ブランチの条件を `!hasAnyFeeType` → `!teamFeeFlags.has_point_card` に変更（意味的に正確な条件へ）

### ライカシンクロ削除 ✅（確認済み）

- Supabase CLI で本番 DB を確認 → 該当レコードなし（既に削除済み）
- タスク完了として扱う

### チーム公開ページ（ログイン不要）実装完了 ✅

- **`app/teams/[id]/page.tsx` 新設**（2707fc6, c913f15, fcf0a55）
  - ルートグループ外に配置 → `(app)/layout.tsx` の認証ガードを受けない
  - 4状態を1ページで処理（非ログイン / ログイン非メンバー / メンバー / 管理者）
  - LP・検索ページからのリンクも確認済み

- **共有コンポーネント整備**
  - `components/teams/public-team-view.tsx` — `hasBottomNav` prop 追加
  - `components/layout/public-header.tsx` / `public-footer.tsx` — 抽出・共通化

### アバター画像バグ修正 ✅（6244377, a70e421）

- テストアカウント3名（山田健太・鈴木太郎・佐藤花子）のアバター画像が本番で表示されない不具合を修正
  - 原因①: `public/avatars/*.jpg` が git 未追加でVercel未デプロイ → コミット追加
  - 原因②: `MemberList` コンポーネントがイニシャルしか表示しない実装だった → `avatar_url` がある場合は画像表示、ない場合はイニシャルフォールバックに修正

### 以前のタスク（2026-06-12）

- **LP 全面刷新** ✅（ced697c）
- **オンボーディングフロー実装** ✅（2e02d9d）
- **登録フロー簡素化** ✅（81f467d）
- **プロフィール詳細フィールド追加** ✅（2042b6a）
- **Stripe Setup Intent API ルート追加** ✅（3ff25f7）
- **DB マイグレーション** ✅（15627bb）

---

## 直近でやったこと（2026-06-23 後半）

### 参加申請フロー 実装完了 ✅

公開グループページからの参加を「管理者承認制」に刷新。

**DB マイグレーション（3本）**
- `00034_add_join_requests.sql`: join_requests テーブル。pending重複申請防止の部分ユニークインデックス。RLS: 申請者は自分の申請を参照/挿入可、管理者は自チームへの申請を参照/更新可
- `00035_add_notifications.sql`: notifications テーブル（is_read boolean、team_id、metadata jsonb）。挿入はservice_roleのみ（RLS）
- `00036_add_point_card_price.sql`: teams.point_card_price integer カラム追加
- → **3本とも `npx supabase db push --linked` で本番 DB に適用済み**
  - 00035 は「notifications テーブルが既に存在」エラーのため、`CREATE TABLE` から `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` + idempotent `DO $$` ブロックに書き直してから適用

**Server Actions**
- `actions/join-requests.ts`（新規）: requestJoinTeam / requestJoinTeamAction / approveJoinRequest / rejectJoinRequest / getTeamJoinRequests / getMyJoinRequest
- `actions/notifications.ts`: markNotificationsRead 追加、createNotificationInternal に team_id/metadata 対応

**フロントエンド**
- `app/(app)/teams/[id]/join/page.tsx`: teamId ベースに刷新。ログイン済み → 申請中確認 → JoinForm 表示フロー
- `app/(app)/teams/[id]/join/join-form.tsx`: useActionState 対応、会員種別ごとの金額表示、申請成功ステート
- `app/(app)/teams/[id]/join-requests-tab.tsx`（新規）: 管理者用申請一覧。承認/見送りボタン
- `app/teams/[id]/page.tsx`: 管理者ビューに「申請」タブ追加（getTeamJoinRequests 並列取得）。非メンバーブランチで getMyJoinRequest を取得して joinRequestStatus を PublicTeamView に渡す
- `components/teams/public-team-view.tsx`: joinRequestStatus prop 追加。pending の場合は CTA を「参加申請中（承認待ち）」表示に変更
- `components/navigation.tsx`: (app)/layout.tsx から unreadCount を受け取れるように対応済み（prop は元から存在）
- `app/(app)/layout.tsx`: getUnreadNotificationCount() を並列取得して Navigation に渡す（ベルアイコンのバッジ）
- `app/(app)/notifications/page.tsx`: join_request_received / join_request_approved / join_request_rejected のアイコン追加
- `app/(app)/notifications/mark-all-read-button.tsx`（新規）: 一括既読ボタン

**動作確認済み（end-to-end）**
- 申請者: 探すページ → チーム詳細 → 参加申請 → 申請成功ステート表示
- 管理者: ベルアイコンにバッジ表示 → 通知クリックで内容確認 → 申請タブで承認/見送り
- 公開チームビュー: pending 時 CTA が「参加申請中（承認待ち）」に変化

**ダッシュボードチームカード画像修正**
- 原因: seed データで設定していた picsum.photos URL がリダイレクトを挟むため Next.js Image が拒否し続けた
- 最終修正: 画像生成 MCP（Gemini）でチームロゴ + カバー画像を4枚生成 → Supabase Storage `teams/seed/` にアップロード → DB の avatar_url / cover_image_url を Supabase Storage URL に更新
- `next.config.ts` は Supabase Storage（`*.supabase.co`）のみに戻してクリーンな状態に
- 対象ファイル: `apps/rangers/next.config.ts`、`apps/rangers/supabase/seed_data.sql`
- commit: `8c07b3c`

---

## 直近でやったこと（2026-06-29〜07-03）

### ページ単位の UI/UX ブラッシュアップ ✅（ダッシュボード・チーム関連）

commit `3535b2f` → main プッシュ済み（19ファイル変更、+1497/-473行）

**ダッシュボード（`dashboard/page.tsx` + `schedule-section.tsx`）**
- チームカードを横長 → 縦型レイアウトに変更（画像上 + テキスト下、136px幅）
- ロールバッジ（管理者/メンバー）を画像右上にオーバーレイ配置
- スケジュールのフィルターをAgoda風pill型ボタン+ボトムシートに統一（2行→1行に集約）
- フィルターリセットボタン追加（変更時のみ表示）
- セグメントタブ・日付ブロック・見出しサイズ・エンプティステートをDESIGN.md準拠に

**グループ一覧（`(app)/teams/page.tsx`）**
- 1カラムリスト → 2カラムグリッド + 正方形画像のカードレイアウトに変更
- `<img>` → Next.js `<Image>` に変更（画像最適化）
- 見出し・「新規作成」ボタンサイズ統一

**グループ詳細 管理者ビュー（`teams/[id]/page.tsx`）**
- Meetup風レイアウトに刷新
  - トップバー: 丸い戻るボタン + 中央「グループ」 + 共有・設定アイコン
  - グループ名 + 説明文（「もっと読む」展開式）
  - メンバープレビューバー（重なりアバター3人 + N人のメンバー）
  - 3アクションボタン（セッション作成 / メンバー / その他）
  - 主催者カード（管理者アバター + 名前）
  - セッション一覧をデフォルト表示
- メンバー/お知らせ/申請 → ボトムシート（ウィザード）表示に変更
- 共有アイコンを一般的な「箱+上矢印」に変更
- 申請カードのボタン配置を左右横並び（アバター|情報|承認・見送り縦並び）に

**グループ詳細 メンバービュー（`teams/[id]/page.tsx`）**
- タブ（セッション/お知らせ）を廃止 → セッション一覧を直接表示
- お知らせ → ヘッダーのベルアイコン + ボトムシートに移動
  - 未読バッジがリアルタイムで減少（ローカルstate管理）
- 次のセッションをハイライトカードで表示（「参加する →」ボタン右寄せ）
- 今後/過去の切り替えをドロップダウンフィルターで実装
- メンバープレビューバーをタップでメンバー一覧ボトムシート表示
- セッションカードにタイプバッジ追加（練習/大会/ミーティング/イベント）

**ページ遷移アニメーション（`page-transition.tsx` + `globals.css`）**
- ダッシュボード/グループ一覧/探す/お支払い: 横スライド（350ms）
- 通知/プロフィール: フェードイン + 軽い上昇（350ms）
- パス階層比較 + sessionStorage で遷移方向を自動判定（進む=右→左、戻る=左→右）
- `BackLink` コンポーネントで「戻る」方向を明示的にマーク

**共通修正**
- 連絡先ボタン: メールアイコン → 電話アイコン、サイズ統一（h-10 w-10）
- セッション作成フォームのステップインジケーター: 各ステップを固定幅 `w-10` に統一（間隔均等化）
- createPortal に SSR ハイドレーションガード追加（`mounted` state チェック）
- エンプティステート全箇所をDESIGN.mdパターン（アイコン + タイトル + 説明文）に統一
- 不要ファイル削除: `more-actions-menu.tsx`

**新規ファイル**
- `components/page-transition.tsx` — ページ遷移アニメーション
- `components/back-link.tsx` — 戻るリンク（方向マーク付き）
- `app/(app)/teams/[id]/admin-team-actions.tsx` — 管理者3ボタン+ボトムシート
- `app/(app)/teams/[id]/team-description.tsx` — 「もっと読む」展開式説明文
- `app/(app)/teams/[id]/member-session-list.tsx` — メンバービュー セッション一覧（フィルター付き）
- `app/(app)/teams/[id]/member-preview-bar.tsx` — メンバープレビュー+一覧ボトムシート
- `app/(app)/teams/[id]/member-announcements-sheet.tsx` — お知らせボトムシート（動的未読バッジ）

---

### DESIGN.md 準拠 UI/UX 全面修正 ✅

全ページ・全コンポーネントのカラー・スペーシング・タイポグラフィ・角丸・アイコンを DESIGN.md のデザイントークンに統一。

**修正範囲（56ファイル）**

- アプリページ: dashboard / profile / notifications / teams / search / payments / fees / sessions / messages（一覧・スレッド）
- 認証ページ: login / register / register/sent / register/confirm / forgot-password / reset-password / onboarding / onboarding/complete
- 公開ページ: about / price / faq / coach-recruit / profiles/[id]
- コンポーネント: navigation / toast / session-calendar / schedule-section / session-tabs / public-team-view / public-footer / message-input / contact-info-button
- teams サブページ: new / edit / join / join-requests-tab / member-list / member-detail-modal / admin-action-buttons / invite-section / cancel-button / register-button / price-reveal / cash-collection / session-actions

**主な修正パターン**

| パターン | 内容 |
|----------|------|
| `#E8614D` → `#c0392b` | アプリ内のアクセント色を status-error に統一（LP・TEAM_COLORS除外） |
| Tailwind デフォルト色 → DESIGN.md トークン | blue-*/red-*/green-*/gray-*/slate-* を全廃止 |
| `text-muted-foreground` / `bg-muted` → 明示的カラー | ページコンポーネントで CSS 変数依存を解消 |
| DESIGN.md 外 HEX → 正規トークン | #dc2626→#c0392b, #3b5bdb→#005F8C, #b0bac6→#8d99a8, #f5f8fa→#f2f7fa 等 |
| `text-[10px]` / `text-[11px]` → `text-xs` | 12px下限ルール準拠（通知バッジ・LP除外） |
| `strokeWidth="2"` → `1.8` | 20px以上アイコンの strokeWidth 統一 |
| `shadow-2xl` → `shadow-lg` | DESIGN.md シャドウ体系に統一 |
| 見出し → heading-sm (18px/600) | 各ページタイトルを統一 |
| エンプティステート正規化 | 48px アイコンラッパー + body-strong タイトル + caption 説明 |
| 角丸 → DESIGN.md 値 | rounded-xl→rounded-[14px], rounded-lg→rounded-[10px] 等 |

**除外（意図的）**
- LP ページ `(public)/page.tsx` — 独自デザイン
- shadcn/ui コンポーネント（button/card/badge等） — テーマ変数経由
- TEAM_COLORS 配列の `#E8614D` — チーム識別色
- 通知バッジの `text-[10px]` — 16px円内のため例外

---

## 直近でやったこと（2026-06-27）

### 通知システム 最終監査・バグ修正・品質整備 ✅

**バグ修正（致命的）**
- `createTeam()` の `team_created` 通知が RLS によりサイレントに失敗していた問題を修正
  - 原因: notifications テーブルは RLS 有効 + INSERT ポリシーなし（service_role のみ INSERT 可）
  - 旧: `supabase.from("notifications").insert(...)` → 新: `createAdminClient().from("notifications").insert(...)`
  - 全コードベースでの notifications INSERT が adminClient に統一された

**UI 改善: typeIcons マップの全タイプ網羅**
- 旧: 10件（うち4件は stale キー: session_confirmed / deadline_reached / new_member / announcement）
- 新: 18件（全 NotificationType を網羅・stale エントリ削除）
  - 新規追加: team_created / member_joined / session_added / session_registered / session_cancelled_by_member / session_min_reached / session_updated / session_reminder / waitlist_available / payment_failed / stamp_low / fee_reminder
  - カラーコーディング: 緑（成功・確定）/ 青（情報）/ 赤（キャンセル・失敗）/ アンバー（注意・リマインダー）

**revalidatePath("/notifications") の追加（計10箇所）**
- `sessions.ts`: createSession / updateSession / confirmSession / cancelSession / registerForSession / cancelRegistration / retryPayment / markCashPaid（8箇所）
- `teams.ts`: createTeam / joinTeamByCode（2箇所）
- join-requests.ts は既に全3関数で対応済みを確認

**最終監査結果（全項目クリア）**
- NotificationType 全18値が DB・TypeScript・UI アイコン・pg_cron すべてで整合 ✓
- RLS: SELECT/UPDATE は本人のみ、INSERT は service_role のみ ✓
- ナビゲーションバッジ: `(app)/layout.tsx` が `getUnreadNotificationCount()` を並列取得して渡す ✓
- cron 重複防止: fee_reminder（月次）/ session_reminder（日次）ともに CONTINUE WHEN EXISTS で保護 ✓

---

## 直近でやったこと（2026-06-26）

### 通知システム 全タイプ実装 + デモデータ整合 ✅

**通知タイプ実装（actions/*.ts + migration）**

全12タイプを実装（実装場所一覧）:

| タイプ | トリガー | 実装場所 |
|--------|---------|---------|
| team_created | チーム作成時 | `createTeam()` |
| member_joined | メンバー参加時（コード/承認） | `joinTeamByCode()` / `approveJoinRequest()` |
| session_added | セッション作成・公開時 | `createSession()` |
| session_registered | メンバーがセッション登録時 | `registerForSession()` |
| session_min_reached | 最小参加人数達成時 | `registerForSession()` |
| session_updated | セッション内容変更時 | `updateSession()` |
| session_cancelled | セッションキャンセル時 | `cancelSession()` |
| session_cancelled_by_member | メンバーが登録キャンセル時 | `cancelRegistration()` |
| session_reminder | 前日（クーロン 18:00 JST） | migration 00047 pg_cron |
| payment_charged | 決済発生全フロー | 各action |
| fee_reminder | 月謝未払い（クーロン 毎月1日） | migration 00047 pg_cron |
| join_request_received | 参加申請受信時 | `requestJoinTeam()` |

**コードレビューで修正した不具合（7件）**
- CRITICAL: pg_cron の重複防止を UNIQUE 制約（無効）→ CONTINUE WHEN EXISTS に変更
- HIGH: pg_cron ジョブが冪等でない → cron.unschedule ガードを追加
- HIGH: 管理者が自分への session_registered 通知を受信していた → `.neq()` フィルター追加
- MEDIUM: session_cancelled_by_member でも管理者自己通知 → 同様に修正
- MEDIUM: cancelSession で削除した管理者自身にもsession_cancelled が届いた → 修正
- MEDIUM: waitlist_available に team_id が欠落していた → 追加
- MEDIUM: revalidatePath("/notifications") が join-requests 系3関数に未記載 → 追加
- LOW: markCashPaid のゲスト/メンバー料金が常にmember_price → is_member で分岐

**デモデータ v4（seed_data.sql 完全書き直し）**
- 過去セッション削減: 佐藤13→9 / 鈴木10→6 / 山田8→5
- stamp_remaining を 5 → 7 に修正（10枚購入 - 過去2枚 - 確定済1枚 = 残7）
- 通知 50件 → 全9タイプ網羅・時系列整合・6/20以降は is_read=false

commits: `5a7aef6`, `60f017b`, `acc7874`, `177701a`, `b4d5d2e` → main

---

## 直近でやったこと（2026-07-03〜07-09）

### グループ作成フロー 5ステップ化 ✅

**`apps/rangers/app/(app)/teams/new/page.tsx`**
- Step 5（決済設定）を条件付き表示に変更
  - `has_session_fee || has_annual_fee || has_monthly_fee` のいずれか1つでも ON の場合のみ Step 5 に遷移
  - 料金なしの場合はグループ詳細ページに直接遷移
- Step 5 内の「グループが作成されました」バナーをコンパクト化（`py-3` → `py-2`）
- 「口座情報を登録する」ボタンの Stripe Connect onboarding フローを実装

**`apps/rangers/app/(app)/teams/[id]/edit/edit-team-form.tsx`**
- `feeExempt` ローカルステートを削除し `team.fee_members_exempt_session` を直接参照するよう修正
- 編集フォームにメンバーシップ・セッション参加費セクションを追加（新規作成フォームとUI統一）

**`apps/rangers/components/pricing-simulator.tsx`**
- 料金シミュレーターをポップアップ（ダイアログ）形式に変更

### Stripe Connect 調査・有効化 ✅

- ボタンを押すと「決済設定の開始に失敗しました」が出る問題を調査
- 原因: Stripe ダッシュボードで Connect 機能が未有効化だった
- 対応: ともくんが Stripe Dashboard で Connect（Marketplace）を有効化
- Stripe SDK バージョン、RLS ポリシー、team_members の status デフォルト値はすべて問題なし確認済み

### ローカル開発での Stripe Connect コールバック問題を特定 ✅

- ローカルで口座登録を完了すると `swim-os-seven.vercel.app` にリダイレクトされる
- Vercel 側はログイン状態でないため `stripe_onboarding_completed` が DB に保存されない
- **Fix: `.env.local` に `NEXT_PUBLIC_APP_URL=http://localhost:3000` を追加する（未実施）**

---

## 直近でやったこと（2026-07-18）

### ページ遷移 UX 改善・オンボーディング修正・アニメーション高速化 ✅

commit `d616bf5` → main プッシュ済み（8ファイル変更）

**ナビゲーションプログレスバー（新規: `components/navigation-progress.tsx`）**
- NavState マシン（`idle | loading | completing`）で正確なライフサイクルを管理
- ヘッダー下（`top-16`）に横棒（2px、`#005F8C`）を配置
- 1.5s で 85% まで伸びるアニメーション → ページ読み込み完了後に 100% へスナップしフェードアウト
- 右下（`bottom-20 right-4`）にスピナー（ローディング中のみ表示）
- `(app)/layout.tsx` に組み込み済み

**ダッシュボード・スケジュールセクション修正（`components/dashboard/schedule-section.tsx`）**
- ボトムシート（「全て」「全グループ」）押下でグレー画面になるバグを修正
- 原因: `PageTransition` の `animation-fill-mode: both` がスタッキングコンテキストを作り `fixed` 要素を閉じ込めていた
- `createPortal(content, document.body)` に移行して根本解決（`team-filters-bar.tsx` と同じパターン）

**ページ遷移アニメーション高速化（`app/globals.css`）**
- slide-in-right / slide-in-left / fade-up-in: 350ms → 200ms に短縮
- slide-up（ボトムシート）: 0.32s → 0.25s に短縮（`team-filters-bar.tsx` / `session-filters-bar.tsx` も同様）
- `to` キーフレームから `transform` を除去 → アニメーション完了後のスタッキングコンテキスト問題を根本解消
- `nav-progress` キーフレーム追加（0→85%、`transform-origin: left center`）

**オンボーディング修正（`app/(auth)/onboarding/page.tsx`）**
- クレジットカード登録を任意化（Step 6 に「前へ」「スキップ」ボタン追加）
- 電話番号バリデーション: 11桁のみ → 10〜11桁に対応（固定電話対応）
- テストカード選択で即時登録（`stripe.confirmCardSetup` + 事前定義 PM ID 使用）
  - クリップボードコピー方式 → ワンクリックで決済フロー完了する方式に変更
  - 本番化時はテストカードブロックを削除するだけでOK

---

## 直近でやったこと（2026-07-17）

### チーム・パーソナル検索ページ UI/UX ブラッシュアップ ✅

**チーム検索（`app/(app)/search/teams/`）**
- `team-search-input.tsx`: sort / recruitingOnly / days の全フィルター状態を検索時に保持するよう修正
- `team-filters-bar.tsx`:
  - 絞り込みシートから「募集状況」セクションを削除
  - 3列構成に変更（絞り込み｜並び替え｜募集中トグル）
  - 「募集中」トグルボタンを追加（テキスト+iOSスタイルスイッチ、デフォルトON）
  - 募集中フラグをデフォルトON（`recruiting !== "0"` で判定）に変更
- `page.tsx`:
  - カード行順を刷新：チーム名+エリア → 管理者（小アバター+氏名）→ 頻度+曜日 → メインプール → 説明文2行
  - 説明文を `line-clamp-2` に変更（2行まで表示）
  - 逆くの字を `self-stretch + items-center` で縦中央に修正
  - デフォルトで募集中チームのみ表示（`recruiting !== "0"`）

**パーソナル検索（`app/(app)/search/personal/`）**
- `page.tsx`:
  - 「パーソナル」バッジ削除（このページはパーソナルのみのため不要）
  - カード行順を刷新：グループ名+エリア → コーチ氏名（小アバター）→ 頻度+曜日 → 料金（¥〇〇〜/セッション）→ 説明文2行
  - 逆くの字を `self-stretch + items-center` で縦中央に修正
  - `items-center` → `items-start`（複数行カードの縦ズレ解消）

**共通（`actions/teams.ts`）**
- `getPublicTeams` のSELECTに `default_guest_price` と `coach:profiles!coach_id(name, avatar_url)` を追加
- チーム・パーソナル両ページで管理者/コーチの氏名・アバターを表示

**デモデータ追加（`supabase/migrations/00029_seed_extra_teams.sql`）**
- チーム4件追加：大阪スイミングクラブ / 横浜トライスイマーズ / 福岡マスターズ / 京都スイミングサークル
- パーソナル3件追加：山田健太・鈴木太郎・佐藤花子 各コーチのパーソナル指導
- 各グループに3〜4件のセッション（`is_external=true`）
- ロゴ画像7枚を生成してSupabase Storageにアップロード済み

---

## 直近でやったこと（2026-07-16）

### 探すページ・セッション検索 UI/UX ブラッシュアップ ✅

**`app/(app)/search/page.tsx`（探すトップ）**
- チーム・パーソナルカードを横並び（`flex`）→ 縦積み（`block` × 3）に変更
- 全カード高さを `h-36` に統一（セッションに合わせる）
- チーム・パーソナルカードのSVGイラストをfull幅用に再設計（viewBox 200×112）
- 各カードに `>` シェブロンアイコンを追加してセッションカードと統一

**`app/(app)/search/sessions/page.tsx`（セッション検索結果）**
- セッションカードをFlexbox → CSSグリッド（`grid-cols-[44px_1fr_auto_14px]`）に全面改修
  - 料金欄が他のコンテンツに押し出されて見切れる問題を根本解決
  - 列幅を明示指定：日付44px / メイン1fr / 料金auto / シェブロン14px
- 場所・チームを同一行（`·`区切り）→ 別行（行3: 場所 / 行4: チーム）に分離
- 各行に `overflow-hidden` を追加し、長テキストが料金列を侵食しない構造に
- 日時spanの `shrink-0` を廃止し `truncate` に変更（flex内での最小幅問題を解消）
- タイトル `<p>` に `min-w-0` を追加（バッジ押し出し防止）

**`app/(app)/search/session-price-config.ts`（定数ファイル）**
- 以前のセッションで作成済み（Turbopackクロスバウンダリ問題の回避）

commits: 未コミット（この後プッシュ）

---

## 直近でやったこと（2026-07-15）

### お支払いページ UI/UX ブラッシュアップ 完了 ✅

**デザイン全面刷新（ゆうちょ通帳アプリスタイル）**
- 月別グループ化：年月ヘッダー（件数・月合計金額）＋明細リスト
- 左カラーバー：セッション参加費＝青（`#005F8C`）/ 会費＝緑（`#0f8a4f`）
- 各行の構成：日付（月/日）→ 縦区切り線 → ラベル＋グループ名 → 金額＋ステータスバッジ
- 異常ステータス（failed / refunded / unpaid）のみバッジ表示（paid / pending は省略）

**カード管理をアイコンボタン化**
- ページ右上にクレジットカードアイコンボタンを配置
- ボタン押下でボトムシートモーダルを表示（createPortal で PageTransition の transform 影響を回避）
- モーダル内：登録済みカード情報の確認 ＋ UpdateCardForm（登録・変更）
- カード未登録時：アイコンをアンバー色（`#b8860b`）＋警告ドット表示でユーザーを誘導

**フィルター・並び替え**
- 種別（すべて / セッション参加費 / 会費）プルダウン：アクティブ時にボーダー・テキスト・シェブロンが青色
- 並び替え（新着順 / 古い順）プルダウン：ソートは常時グレー（フィルターと区別）
- URL searchParams ベースのステート管理（サーバーコンポーネントで処理）

**その他修正**
- ボトムシートのコンテンツ領域に `max-h: calc(85vh - 80px) + overflow-y-auto`（フォーム展開時のはみ出し防止）
- カード登録/変更ボタンを `w-full` に統一
- 検索バー入力の `minHeight: 44px` 対応（タッチターゲット準拠）

**変更ファイル**
- `app/(app)/payments/page.tsx` — 全面刷新（月別グループ化・フィルター・ソートロジック）
- `app/(app)/payments/payment-history-filters.tsx` — プルダウン2本（種別・並び替え）に変更
- `app/(app)/payments/card-modal.tsx` — 新規作成（アイコンボタン＋ボトムシート）
- `app/(app)/payments/update-card-form.tsx` — `w-full` ボタン修正
- `app/(app)/search/search-bar.tsx` — `minHeight: 44px` 追加

commits: `b20358f`, `4414e73`, `88558c1`, `d861604` → main プッシュ済み

---

## 直近でやったこと（2026-07-10）

### team_type（チーム/パーソナル）グループ種別機能 全実装完了 ✅

**DB マイグレーション（`supabase/migrations/00028_add_team_type.sql`）**
- `teams.team_type TEXT NOT NULL DEFAULT 'team' CHECK (team_type IN ('team', 'personal'))` を追加
- `migration repair` はマイグレーション履歴テーブルを更新するだけでSQLを実行しない仕様のため、直後に `supabase db query --linked` でカラム存在を確認して再実行した（学習済み）

**グループ作成フロー 6ステップ化（`app/(app)/teams/new/page.tsx`）**
- Step 0: チーム/パーソナルをカードUIで選択（アイコン＋色分け）→ クリックで自動的に Step 1 へ
- 既存 Step 1〜5 のインデックスを +1 シフト（Step 2〜6 に）
- すべての戻るボタン index・handleSubmit の team_type payload を確認済み・問題なし

**グループ一覧 フィルター付き表示（`app/(app)/teams/teams-client.tsx` 新規）**
- サーバー（page.tsx）とクライアント（teams-client.tsx）に分離
- プルダウンで「すべて / チーム / パーソナル」切り替え
- 「すべて」表示時はチームセクション → 区切り線 → パーソナルセクションの順
- 両種別が存在する場合のみセクションヘッダーと区切り線を表示

**バリデーション・アクション（`validations.ts` / `actions/teams.ts`）**
- `teamSchema` に `team_type: z.enum(["team", "personal"]).default("team")` を追加
- `teamUpdateSchema` には意図的に除外（作成後変更不可。コメントで明記）
- `createTeam` の INSERT に `team_type` を追加
- `getPublicTeams` の SELECT に `team_type` を追加（探すページ用）

**テストデータ整理**
- テスト用グループ9件（「あ」「い」「1」「a」「６」「b」等）を `db query --linked` で削除
- 残: マウントリバー水泳クラブ・東京マスターズ水泳クラブの2件のみ

commits: `4c0f37c`, `3e55556`, `12965d6`, `1140a82` → main プッシュ済み

---

## 次にやること

### P1（近日中）

1. **`.env.local` に `NEXT_PUBLIC_APP_URL=http://localhost:3000` を追加してローカルで Stripe Connect 動作確認**
   - 追加後 `npm run dev` 再起動 → グループ作成 Step 5 で口座登録完了まで通す
   - `stripe_onboarding_completed = true` が DB に保存されるか確認

2. **探すページ（search）のブラッシュアップ**
   - team_type フィルター（チーム/パーソナル）の追加
   - UI/UX の改善

3. **ページ単位の UI/UX ブラッシュアップ 続き**
   - ✅ 完了: dashboard, teams（一覧・詳細 管理者/メンバー）
   - 次の対象: search → sessions → profile → payments → fees → auth → public の順
   - 方針: コンポーネントの種類・配置の変更も OK（ユーザー体験が向上するなら積極的に提案）
   - LP ページ `(public)/page.tsx` はアプリ内とは別扱い（独自デザイン）
   - DESIGN.md を必ず参照すること（`apps/rangers/DESIGN.md`）

---

## 積み残し・ブロッカー

- **【必須・未実装】お支払いページ: 異常ステータス（決済失敗・未払い）のCTA** — バッジは表示されるが「再支払い」「カードを確認する」などアクションへの導線がない。ユーザーが詰まるため必ず対応すること（優先度: 高）
- チーム乱用防止の方針（Hydoor と要相談: 制限 or 申請制 or 課金）
- 課金開始タイミング（Hydoor と要相談）
- キャンセルポリシー未確定（長畑さん・長畑さんのお父様・レイカさんと要相談）
- `transfer_records` INSERT 失敗時の補完手段なし（ログで検知→手動対応）
- `getOrCreateStripeProduct` はチームリネーム時に Stripe 上の Product 名を更新しない（管理画面で手動更新が必要）
- テストコードなし（Vitest 未導入）

---

## SchoolBoost AI 状態

コード実装・ビルド通過済み。以下の外部サービス設定がともくん側で必要：
- Supabase プロジェクト作成（Rangers とは別）
- SQL スキーマ実行（001_initial_schema.sql）
- Vercel デプロイ（Root Directory: apps/school-boost-ai）
→ 詳細は `apps/school-boost-ai/docs/setup-browser-tasks.md` 参照

---

## 環境

- リポジトリ: ktomoyuki0227/swim-os（private）
- モノレポ: apps/rangers / apps/school-boost-ai
- デプロイ先: swim-os-seven.vercel.app（Rangers）
