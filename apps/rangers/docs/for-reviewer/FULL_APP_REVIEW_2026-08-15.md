# アプリ全体コードレビュー（2026-08-15）

## 対応状況(2026-08-15 追記)

このレビュー後、以下をすべて修正・本番適用済み。

- C-1: 本番の test5@example.com のパスワードをローテーション済み。マイグレーションファイル自体は履歴保持のため残置(git履歴からの完全消去は別途要相談)。
- H-1: supabase/migrations/00074_review_2026-08-15_hardening.sql でトリガーを追加し、profiles.stripe_customer_id/stripe_payment_method_id/stripe_account_id を authenticated から直接書き換え不可に。本番で動作確認済み(ロールバック付きテスト)。
- H-2: practice_sessions/session_registrations の外部キーを ON DELETE CASCADE から NO ACTION に変更。チーム削除で決済履歴が道連れで消えなくなった。
- H-3(スキーマドリフト): profiles.phone、teams.practice_frequency/practice_days/main_pool、notifications.team_id/metadata の ALTER TABLE を正式なマイグレーションとして補完。
- H-4: 調査の結果、session_registrations.stripe_payment_intent_id の一意インデックスは実は本番に既に存在(マイグレーション履歴に記録がなかっただけ)と判明。履歴に補完のみ実施。
- H-5: messages にトリガーを追加し、受信者による既読更新(read_at)以外のカラム変更(本文改ざん等)を拒否。本番で動作確認済み。
- H-6: パスワード再設定ページの minLength/文言を8文字に統一。
- H-7: 見送り。@supabase/ssr のブラウザクライアントが document.cookie 経由でセッションを管理する設計のため、httpOnly 化するとトークン自動更新時にセッションが壊れるリスクがあり、ユーザーとも協議の上で今回は対応しないことに決定(現状XSS経路は0件確認済みのため実害は限定的)。
- H-8: getClientIp() を「先頭のIP(偽装可能)」ではなく「末尾のIP(信頼できるプロキシが追記した値)」を採用するよう修正。
- M-1〜M-13, L-1〜L-10: ほぼ全て修正済み(検索フィルタのバグ、Webhookのエラーハンドリング、増加関数の権限剥奪、markCashPaid等の原子性、オンボーディング下書きのTTL化等)。L-3(stamp_purchasesの冪等性制約)のみ、自然なユニークキーが無く安易な制約追加はリスクが高いため見送り(将来的に購入フォーム側でクライアント生成のidempotency keyを持たせる設計が必要)。
- 調査で判明した lessons/bookings/reviews/schedule_requests テーブル: 個人レッスン予約マーケットプレイスだった初期構想の残骸と確認(100%未使用)。本番から削除済み(00075_drop_legacy_marketplace_tables.sql)。Supabase Advisorの関連警告も解消。
- Supabase Advisor「漏洩パスワード保護が無効」は、SQLでは変更できないダッシュボード設定のため、Supabase管理画面(Authentication → Settings)から手動で有効化をお願いしたい。

---


対象: `apps/rangers` 全体 ― フロントエンド / バックエンド(Server Actions) / データベース(Supabase・RLS) / 決済(Stripe) / 認証・セッション

手法: 5つの観点別エージェント（フロントエンド／バックエンド／DB・RLS／Stripe決済／認証セッション）による独立並列レビュー＋Supabase Advisor（本番プロジェクト `rangers` / ref: `jeosqnkeyiwapeeujrml`）の自動診断。すべて実コードを読んで確認した内容のみ記載。裏取りできていない推測は「要検証」と明記。

全体所感を先に書くと、このコードベースは既にAIエージェントによる自己レビューが7回相当（マイグレーション `00033`〜`00071` 等）行われており、多くの典型的な脆弱性（IDOR、TOCTOU、金額のクライアント信頼、Webhook署名検証漏れ等）は既に潰されている。今回の指摘は、その上で残っていた具体的な穴。

## サマリー

| 重大度 | 件数 |
|--------|------|
| CRITICAL | 1 |
| HIGH | 8 |
| MEDIUM | 13 |
| LOW | 10 |

---

## CRITICAL

### C-1. マイグレーションファイルにテストユーザーのパスワードが平文でハードコードされ、git履歴に永久に残っている

- ファイル: `supabase/migrations/00025_test_users_cleanup.sql:51`
- `crypt('Rangers2024!', gen_salt('bf', 10))` として `test5@example.com` のパスワードが直接埋め込まれている。
- 本番プロジェクト（`rangers` / ref `jeosqnkeyiwapeeujrml`）に対してこのマイグレーションが適用されている場合、このアカウントは本番で実際にログイン可能な状態にある。
- **影響**: リポジトリへの読み取りアクセスを持つ人（外部委託先、CIログ、将来のリポジトリ公開・フォーク等）は誰でも `test5@example.com` / `Rangers2024!` で本番にログインできてしまう。git履歴に残るため、ファイルを後で書き換えても解決しない。
- **対応方針（要相談）**:
  1. まず本番DBで `test5@example.com` のパスワードを直ちにローテーション（またはアカウント自体を無効化・削除）する。
  2. 以後のテストユーザー作成はマイグレーションに平文パスワードを書かず、環境変数経由 or Supabaseダッシュボードでの手動作成に切り替える。
  3. git履歴からの完全な除去（BFG Repo-Cleaner等でのhistory rewrite）は破壊的操作のため、実施するかどうかは判断をお願いしたい。

---

## HIGH

### H-1. `profiles` テーブルのRLS更新ポリシーが `stripe_customer_id` / `stripe_payment_method_id` の書き換えを制限していない
- ファイル: `supabase/migrations/00058_hardening_search_path_legacy_tables.sql:27-32`
- `role` 列の自己昇格だけを防ぐ `with check` になっており、`stripe_customer_id` / `stripe_payment_method_id` は素通り。
- これらの値は `lib/stripe-payment-helpers.ts:51-52` / `lib/stripe-helpers.ts:225-231` で「誰のカードに課金するか」を決めるのに使われる。
- **攻撃シナリオ**: 攻撃者が被害者のStripe顧客ID/支払い方法IDを何らかの経路（サポート対応ログ、将来のバグ等）で入手できた場合、自分の `profiles` 行を直接更新（`updatePaymentMethod` を経由せず、公開anonキー＋自分のセッションJWTで直接PostgREST経由）して被害者のIDを設定すれば、次回の会費・回数券課金が被害者のカードに実際に飛ぶ。
- 現時点で他コードが他ユーザーのStripe IDを画面に返す経路は見当たらず即座に悪用できる状態ではないが、`membership_fees`/`stamp_purchases` 等で既に行われている「サービスロール限定」への統一が、この2列だけ漏れている。
- **対応方針**: `membership_fees` 等と同様、`profiles` の `stripe_customer_id`/`stripe_payment_method_id`/`stripe_account_id` への認証ユーザーによる直接UPDATEを禁止し、書き込みは全て `createAdminClient()` 経由（既に実態としてそうなっている）に一本化する `WITH CHECK` 制約を追加する。

### H-2. `teams` テーブルのCASCADE削除が決済監査記録を無条件に消し去る
- ファイル: `supabase/migrations/00006_teams.sql`（`teams_delete` ポリシー、および `practice_sessions`/`session_registrations` の `ON DELETE CASCADE`）
- `teams_delete` ポリシーは `coach_id = auth.uid()` のみで、メンバー・セッション・支払い履歴の有無を一切見ない。
- `actions/sessions/crud.ts` の `deleteSession` は「支払い記録があるセッションは削除不可」と明示的にガードしているのに、チーム自体の削除にはこのガードが存在しない。
- **攻撃/事故シナリオ**: 何らかの経緯（開発ツール、将来の「チーム削除」機能、コーチによる直接API呼び出し）でチームが削除されると、`practice_sessions`/`session_registrations` がCASCADEで消え、`stripe_payment_intent_id` や `charged_amount` を含む決済履歴が跡形もなく消える。チャージバック対応中にコーチがチームを消せば証跡が消滅する。
- **対応方針**: `membership_fees`/`stamp_purchases`/`transfer_records` と同様に `practice_sessions`/`session_registrations` への参照を `NO ACTION` に変更し、アプリ側にも「支払い履歴のあるチームは削除不可」のガードを追加する。

### H-3. マイグレーション履歴だけでは新規環境を再現できない（スキーマドリフト）
- 該当: `profiles.phone`（`00024`で使用開始も`ALTER TABLE`なし）、`teams.practice_frequency`/`practice_days`/`main_pool`（`00029`で使用開始も`ALTER TABLE`なし）、`notifications.team_id`/`metadata`（`00046`/`00047`で使用・インデックス化も`ALTER TABLE`なし）。いずれも `types/database-generated.ts` には存在＝本番には実在するがマイグレーション履歴上は存在しない列。
- 同種の問題は過去に3回（`00037`, `00039`, `00050`）発見・修正されており、今回はそれ以外の残存分。
- **影響**: `supabase db reset` やCI・新規開発者のローカル環境構築でマイグレーションを最初から流すと `00024`/`00029`/`00046` あたりで「column does not exist」エラーになり、本番と乖離した状態で気づかず開発が進む。
- **対応方針**: 不足している `ALTER TABLE ADD COLUMN` を該当時期のマイグレーションとして追加するか、現状のスキーマから `pg_dump` ベースのベースラインを作り直す。CIに「まっさらな状態から全マイグレーション適用」のジョブを入れておくと今後の再発を機械的に検知できる。

### H-4. `session_registrations.stripe_payment_intent_id` にインデックスがない
- ファイル: 該当インデックス定義なし（`transfer_records.stripe_payment_intent_id` には `00039`でインデックス、`00072`でユニーク制約があるのと対照的）
- Stripe Webhook（`app/api/stripe/webhook/route.ts` の `handlePaymentIntentSucceeded`/`handlePaymentIntentFailed`/`handleChargeRefunded`/`handleChargeDisputeCreated`）は全てこの列で検索する。
- **影響**: `session_registrations` がデータ量増加するにつれてWebhookイベントごとにシーケンシャルスキャンが発生し、Stripeのタイムアウト・再送を誘発しやすくなる（冪等性ガード自体はあるので二重処理には直結しないが、応答遅延・タイムアウトのリスクが増す）。
- **対応方針**: `create index on session_registrations (stripe_payment_intent_id)` を追加。

### H-5. `messages` テーブルのUPDATEポリシーに `WITH CHECK` がなく、受信者が本文・送信者を書き換えられる
- ファイル: `supabase/migrations/00047_optimize_rls_performance.sql`（`受信者のみ既読更新可` ポリシー）
- `using (receiver_id = auth.uid())` のみで `with check` を省略しているため、Postgresの仕様上 `using` がそのまま新しい行にも適用され、`content` や `sender_id` には何の制約もかからない。
- **攻撃シナリオ**: 受信者が直接 `supabase.from('messages').update({ content: '...', sender_id: 他人のID }).eq('id', 受信済みメッセージID)` を呼べば、「相手が言った内容」を事後的に捏造できる（トラブル時の証拠捏造等）。
- **対応方針**: `with check (receiver_id = auth.uid() and sender_id = 変更前のsender_id and content = 変更前のcontent)` のように、既読フラグ以外の変更を拒否する `WITH CHECK` を追加する。

### H-6. パスワード再設定ページの最小文字数がサーバー側と食い違っている
- ファイル: `app/(auth)/reset-password/page.tsx:53,69,82`（`minLength={6}` / 「6文字以上」表記） vs `actions/auth.ts:229`（8文字未満を拒否）
- 実は新規登録側（`register/page.tsx`）でも過去に同じ指摘（2026-08-04の登録フローレビュー）が出ていたのと全く同じ食い違いが、パスワード再設定ページ側にも存在する。
- **再現**: パスワード再設定で7文字のパスワードを入力（画面表示・HTML5バリデーション上は通る）→ 送信 →サーバーから「8文字以上」の矛盾したエラーが返る。
- **対応方針**: `minLength` を8に統一し、文言も「8文字以上」に揃える。

### H-7. Supabase認証Cookieに `httpOnly` が明示されておらず、デフォルトでJSから読み取り可能
- ファイル: `lib/supabase/middleware.ts:33-37`, `lib/supabase/server.ts:57-60`, `lib/supabase/client.ts:9-13`
- 3箇所とも `cookieOptions` に `secure`/`sameSite` はあるが `httpOnly` の指定がなく、`@supabase/ssr` のデフォルト（`httpOnly: false`）がそのまま適用されている。
- **影響**: 現状XSSは見つかっていないが（フロントエンドレビューでも `dangerouslySetInnerHTML` 等は未使用と確認済み）、将来どこか1箇所でもXSSが混入した場合、本来ならHttpOnlyで守られるはずのアクセストークン/リフレッシュトークンが `document.cookie` から直接読み取れてしまい、被害が「その場限りの操作」から「トークン持ち出しによる恒久的なアカウント乗っ取り」に拡大する。
- **対応方針**: 3箇所の `cookieOptions` に `httpOnly: true` を追加。ただしブラウザ側（`createBrowserClient`）でセッション情報をJSから読んでいる箇所（`app/(app)/profile/page.tsx` 等）が壊れないか確認してから適用する。

### H-8. レート制限が `X-Forwarded-For` ヘッダーに依存しており、偽装したIPで実質無効化できる
- ファイル: `lib/rate-limit.ts:42-47`（`getClientIp`）／利用箇所: `actions/auth.ts` の `login`/`register`/`resendConfirmationEmail`/`requestPasswordReset`、`actions/teams/members.ts` の `join_team`
- `x-forwarded-for` の先頭値（クライアントが自由に設定できる）をそのままレート制限のキーに使っている。
- **攻撃シナリオ**: `POST /login` にリクエストごとに異なる `X-Forwarded-For: 203.0.113.X` を付けて送るだけで、`isRateLimited` は毎回新しいバケットとして扱い、特定メールアドレスへの総当たり攻撃・登録スパム・メール爆撃・リセットメール爆撃のいずれも回数無制限で実行できてしまう。
- また、インメモリ実装のため複数サーバーレスインスタンス間でカウンタが共有されない点も、この脆弱性を悪化させる一因（こちらは元々MEDIUM相当だが、ヘッダー偽装と組み合わさると実質的な防御が消える）。
- **対応方針**: Vercel環境で改ざん不可能なヘッダー（信頼できるエッジが上書きすることが保証されているものに限定）に切り替えるか、IP単体でも別枠の上限を設ける多層防御を追加する。恒久対応としてはRedis/Upstash等の共有ストアへの移行も検討。

---

## MEDIUM

### M-1. Stripe Webhookの一部ハンドラがAPI失敗時に200を返し、リトライされないまま課金だけ発生する
- ファイル: `app/api/stripe/webhook/route.ts:270-283`（`handleInvoicePaid`）, `:330-337`（`handleInvoicePaymentFailed`）
- 他のハンドラは失敗時に例外を投げて500を返すのに対し、この2箇所は `stripe.subscriptions.retrieve(...).catch(() => null)` で握りつぶし、そのまま200を返してしまう。
- **影響**: Stripe側APIが一瞬不安定なタイミングで `invoice.paid` が届くと、実際にはカードから引き落とされているのに `membership_fees` レコードが作られず、通知も飛ばず、アプリ上は「未払い」のまま自動では復旧しない。
- **対応方針**: 他のハンドラと同様、失敗時は再スロー（または明示的に500を返す）してStripeの再送に任せる。

### M-2. `lib/stripe.ts` にだけ `server-only` インポートがない
- ファイル: `lib/stripe.ts`（`lib/stripe-connect.ts`/`lib/stripe-helpers.ts` は `import "server-only"` あり）
- 現状クライアントから読み込まれている箇所はないが、`STRIPE_SECRET_KEY` を扱う唯一のファイルであり、将来誤ってClient Componentからimportされてもビルドが失敗しない状態は防御として片手落ち。
- **対応方針**: `import "server-only"` を追加してビルド時に強制的に検知できるようにする。

### M-3. `markCashPaid`/`unmarkCashPaid` だけが他の状態遷移と違い、原子的な条件付きUPDATEになっていない
- ファイル: `actions/sessions/payment-recovery.ts:140-181`, `:185-224`
- `confirmSession`/`cancelSession`/`retryPayment` 等は `UPDATE ... WHERE status = 元の状態` の形でTOCTOUを防いでいるが、この2つだけは事前の `SELECT` で状態確認した後、`UPDATE` 側では `id` だけで絞り込んでいる。
- **影響**: 管理者のダブルクリックや2人の管理者が同時操作した場合、DB上のデータは壊れないが「支払い受領」通知が二重送信される可能性がある。
- **対応方針**: 他の関数と同じく `UPDATE` 条件に元の状態（`payment_status = "pending"`）を含める。

### M-4. `getPublicProfile` が退会済みユーザー（`deleted_at`）を除外していない
- ファイル: `actions/profile.ts`
- `public_profiles` ビュー（`00056`で `deleted_at is null` を追加済み）と同じ列を手動で再実装しているが、このフィルタだけ漏れている。
- 現状アカウント削除UIが未実装のため実害はないが、実装された瞬間に `00056` で直した問題が再発する。
- **対応方針**: `deleted_at is null` の条件を追加、またはビュー経由での取得に統一する。

### M-5. 使われていないRPC `increment_stamp_by` が `authenticated` ロールに実行権限を残したまま
- ファイル: `supabase/migrations/00036_fix_increment_stamp_by_authz.sql`（Supabase Advisorでも `authenticated_security_definer_function_executable` として検出）
- `add_stamp_purchase`（`00054`）に完全に置き換えられ、アプリ内に呼び出し箇所は存在しない（grep確認済み）。
- 内部で権限チェックはしているため即座の権限昇格ではないが、任意の符号付き `p_count` を渡せてしまい、`stamp_purchases` の購入履歴と無関係に `stamp_remaining` をズレさせられる余地が残っている。他の未使用の書き込み経路は既に権限剥奪済み（`00059`/`00068`）なので、この1つだけ漏れ。
- **対応方針**: `revoke execute on function increment_stamp_by from authenticated;`

### M-6. `profiles` への外部キーだけ `ON DELETE` の挙動が他と異なる
- ファイル: `join_requests.swimmer_id references profiles(id) on delete cascade`（`00039`）
- 他の全テーブル（`teams.coach_id`, `team_members.swimmer_id` 等）は意図的に `NO ACTION`（プロフィール削除をブロックする設計、`00045`）なのに、`join_requests` だけCASCADEになっている。
- 影響は小さいが、設計方針からの逸脱として記録。

### M-7. `/search?tab=teams` へのディープリンクが機能していない
- ファイル: `app/(app)/dashboard/page.tsx:78,296` vs `app/(app)/search/page.tsx`
- ダッシュボードから2箇所リンクしているが、検索ページ側が `searchParams` を一切見ておらず、常に汎用の3カードハブが表示される。
- **対応方針**: `search/page.tsx` で `tab` パラメータを見て該当タブを直接開くようにする。

### M-8. 「募集中のみ」フィルタが、テキスト検索を送信すると勝手にONへ戻る
- ファイル: `app/(app)/search/teams/team-search-input.tsx:25`, `app/(app)/search/personal/personal-search-input.tsx:27` vs `team-filters-bar.tsx`
- フィルターバー側は「OFF」の状態を `recruiting=0` としてURLに明示するのに、検索ボックス側の `buildParams` は `recruiting=1` の時しかパラメータを付けない（そのため未指定＝ON扱いのロジックと噛み合わない）。
- **再現**: `/search/teams` で「募集中」をOFFにした後、キーワードを入力して検索すると、非募集中チームが再び非表示に戻る。
- **対応方針**: `buildParams` も常に `recruiting=0`/`1` を明示するよう統一する。

### M-9. プロフィールページの `loading.tsx` が実質デッドコード
- ファイル: `app/(app)/profile/page.tsx`, `app/(app)/profile/loading.tsx`
- ページ自体が `"use client"` + `useEffect` でデータ取得しており、ルートレベルの `loading.tsx` が表示される機会がない。サーバーコンポーネント＋Suspenseで書き直せば、初回表示のクライアント側ラウンドトリップも削減できる。

### M-10. オンボーディングの下書きが機微なPIIを無期限・無暗号でlocalStorageに保存し続ける
- ファイル: `app/(auth)/onboarding/draft.ts`, `app/(auth)/onboarding/page.tsx:107-122`
- 電話番号・住所・緊急連絡先・生年月日・本人確認用の顔写真（base64）まで、キー入力のたびに`localStorage`へ保存。`completeOnboarding`成功時にしか消えない。
- **影響**: 共有端末でオンボーディングを離脱すると、次にその端末を使った別人がDevToolsで簡単にPIIを閲覧できる。将来XSSが発生した場合の被害範囲（Cookieだけでなく`localStorage`全体）も広げる。
- **対応方針**: ログアウト時／別アカウントでのログイン検知時に `clearDraft()` を呼ぶ。写真等の重い/機微なデータは下書き対象から外すか、TTL付きの保存に変える。

### M-11〜M-13. Supabase Advisor（セキュリティ）指摘
- `public_profiles` ビューが `SECURITY DEFINER` で定義（ビュー作成者の権限でRLSが評価される）
- `decrement_stamp`/`increment_stamp`/`increment_stamp_by`/`get_my_admin_team_ids`/`get_my_profile_role`/`get_my_team_ids` が `SECURITY DEFINER` 関数として `authenticated` から直接RPC実行可能（DB/バックエンド両レビューで内部の権限チェック自体は確認済みだが、Advisorが機械的に検出する「攻撃対象面」としては残っている）
- 漏洩パスワード保護（HaveIBeenPwned連携）が無効
- 対応方針: 意図的な設計であることをコメントで明記するか、`SECURITY INVOKER` に変更できるものは変更する。漏洩パスワード保護はSupabaseダッシュボードの Authentication 設定からワンクリックで有効化可能。

---

## LOW

### L-1. `markAnnouncementRead` にチーム所属チェックがない
- ファイル: `actions/announcements.ts:121-137`
- 他の関数は全てチーム所属/管理者チェックを行うのに、この関数だけ `upsert` 前のチェックがなく、任意の既存 `announcementId` に対して所属外のユーザーでも既読レコードを作れてしまう。実害は軽微（データ整合性の問題のみ）。

### L-2. 一部のJSONB配列フィールドに件数上限がない
- ファイル: `lib/validations.ts`（`sessionSchema.target_tags`, `course_rules`, `competition_fields`, `teamSchema.practice_days`/`target_ages` 等）
- `competitionEntrySchema` は明示的に30件上限を設けているのに、構造的に似た他のフィールドにはない。管理者権限が必要な操作なので影響は自チームの肥大化程度。

### L-3. `stamp_purchases` に冪等性を担保するユニーク制約がない
- `membership_fees`/`transfer_records` にはあるが、手動入力である回数券購入だけ二重送信対策がない。

### L-4. マイグレーション再現性の脆さが `00029` のコメント内で既に自覚されている
- H-3と関連。CIでの「まっさらな環境からの全マイグレーション適用テスト」があれば機械的に検知できた類のドリフト。

### L-5. ログインページのデモアカウント有効化コメントが実装と食い違う
- `app/(auth)/login/page.tsx:16-21,145` — コメントは `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` 環境変数を参照しているように書かれているが、実際は `NODE_ENV !== "production"` のみで判定（当該環境変数はコードベースに存在しない）。挙動自体はより安全な側だが、コメントが誤解を招く。

### L-6. `/teams/[id]/join` の未ログイン向けUIが到達不能
- ファイル: `lib/supabase/middleware.ts:52-63`（`isPublicPage`）, `app/(app)/teams/[id]/join/page.tsx`
- `isPublicPage` の対象に `/teams/{uuid}/join` が含まれておらず、未ログインでアクセスすると先にmiddlewareが `/login` にリダイレクトしてしまい、ページ内の「未ログイン向け登録導線」が実行される機会がない。さらにログイン/登録ページ側も `redirect` パラメータを見ておらず、ログイン後に参加ページへ戻れない。fail-closedなのでセキュリティ上の実害はないが機能不全。

### L-7. `invite` パラメータが未検証のままリダイレクトパスに連結される
- ファイル: `actions/auth.ts:52-54` — `redirect(\`/teams/join/${invite}\`)` の `invite` がUUID形式かどうか検証されていない。オープンリダイレクトにはならないが、同一オリジン内での意図しないパス誘導を許す余地がある。UUID正規表現での検証を推奨。

### L-8. デモログインの共有パスワードがビルド成果物中のコードにハードコード
- ファイル: `app/(auth)/login/page.tsx:21,50`（`DEMO_ACCOUNT_PASSWORD = "Delta-coach8820!"`）
- `NODE_ENV=production` でのビルド時にツリーシェイキングされる前提に完全依存。CI設定の変更等でこの前提が崩れると本番バンドルに露出するリスクがある。

### L-9. Supabase Advisor（パフォーマンス）: RLSポリシーの `auth.<fn>()` が行ごとに再評価
- `lessons`, `bookings`, `reviews`, `schedule_requests` の各テーブルで `auth.uid()` 等を `(select auth.uid())` でラップしていないポリシーが複数。件数が増えると顕著に遅くなる。
- **確認したいこと**: これらのテーブル名（レッスン予約・口コミ・指導リクエスト）は、今回レビューした「チーム練習管理・会費・回数券」というrangersのドメインと毛色が異なるように見えました。同じSupabaseプロジェクト内に別機能（個人レッスン予約マーケットプレイス等）が同居しているのか、使われなくなった過去機能の残骸かをご確認いただけると、要否判断がしやすいです。

### L-10. Supabase Advisor: 未使用インデックスが複数
- `idx_profiles_role`, `idx_profiles_prefecture`, `idx_lessons_lesson_type`, `idx_lessons_specialty`, `idx_stamp_purchases_status`, `idx_fees_team`, `idx_fees_status`, `idx_announcements_author`, `idx_join_requests_swimmer`, `idx_schedule_requests_lesson`, `idx_join_requests_team`, `idx_messages_sender`, `idx_profiles_onboarding`, `idx_announcements_created`
- 現状のクエリパターンでは使われていない（書き込みコストだけ発生）。データ量が増えてから実際に必要になるクエリもあるため、即削除ではなく「本当に将来使う予定か」の確認を推奨。

---

## 良好だった点（参考・変更不要）

- Stripe Webhookの署名検証は生ボディ＋`STRIPE_WEBHOOK_SECRET`で正しく実装され、なりすまし不可。
- 会費・回数券・セッション登録の金額はすべてDB/サーバー側の値（`charged_amount`, `monthly_fee_amount`等）から取得しており、クライアント入力の金額をそのまま課金する箇所はゼロ。
- `register_for_session` RPCは `SELECT ... FOR UPDATE` + 権限剥奪でTOCTOU・権限昇格の両方を防止済み。
- ほぼ全てのServer Actionで `isTeamAdmin`/`isTeamMember` によるサーバー側権限チェックが徹底されており、UIを隠すだけの対策になっている箇所は見当たらなかった。
- 招待コードは `crypto.randomUUID()` 由来で推測不可能。
- CSVエクスポートは数式インジェクション対策済み、UUID系パラメータはPostgRESTフィルタ注入対策済み。
- `dangerouslySetInnerHTML`・`eval`・ハードコードされたAPIキー等の古典的フロントエンド脆弱性はゼロ件。

---

## 対応の優先順位（提案）

1. **今すぐ**: C-1（パスワードローテーション/アカウント無効化）
2. **リリース前必須**: H-1〜H-8（特にH-7 Cookie、H-8 レート制限、H-2 チーム削除のCASCADE、H-5 messagesポリシーはユーザー影響・悪用しやすさの観点で優先度高）
3. **近いうちに**: M-1〜M-13
4. **余裕があれば**: L-1〜L-10
