# Rangers 独立レビュー結果(2026-08-03)

作成者: Claude Code(4エージェント並列レビュー: security-reviewer / database-reviewer / Stripe決済専門 / typescript-reviewer)
対象コミット: c8c016d 時点
方式: 各エージェントに `docs/for-reviewer/RELEASE_REVIEW_BRIEF.md` と直近修正コミットの内容を伝えた上で、修正の裏取り+独立した新規指摘の両方を依頼。担当領域は一部重複させ、クロスバリデーションできるようにした。

## サマリー

| 重大度 | 件数 |
|--------|------|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 8 |
| LOW | 7 |

CRITICALはなし。過去7回の自己レビューサイクルは効いており、直近コミット(c8c016d)で謳われた修正(Webhook冪等性・cancelSession原子性・Connect送金のPaymentIntent一次情報源化・Subscription自動キャンセル・N+1解消など)は4エージェントとも実コードで裏取りでき、いずれも実際に機能していることを確認した。

最も重要な発見は HIGH-1(回数券の二重消費)。決済専門エージェントとDB専門エージェントが、互いの回答を見ずに独立に同じ結論に達しており、信頼度が高い。

---

## HIGH

### HIGH-1: 回数券(スタンプ)の二重消費が可能(決済エージェント・DBエージェント双方が独立検出)

- 該当: `actions/sessions/registration.ts:109`(登録時は残高チェックのみ)、`supabase/migrations/00040_fix_stamp_functions_authz.sql`(`decrement_stamp`)、`actions/sessions/lifecycle.ts:193`(`confirmSession`)
- 何が起きるか: 登録時は `stamp_remaining > 0` を確認するだけで、実際の消費(decrement)は各セッションの `confirmSession` 実行時に個別に行われる。`decrement_stamp` は `greatest(0, stamp_remaining - 1)` で残高をクランプするだけで、消費前残高が0だったかどうかをチェックせず例外も出さない。
  - 具体例: 残高1枚の会員が、未確定の回数券制セッションA・Bに登録(どちらも登録時点では残高>0なので通る)。管理者がAを確定 → 残高1→0、`paid`。後日Bを確定 → `decrement_stamp` は0のままクランプして成功、Bも`paid`になる。会員は1枚の回数券で2回分参加できてしまう。さらにBが後でキャンセルされると `increment_stamp` で残高が付与され、支払っていない回数券が実質発行される。
- 修正方針: `decrement_stamp` が消費前残高が0以下の場合に `RAISE` するようにする、または登録時点(`register_for_session`内)で原子的に残高を予約(decrement)する設計に変更する。

### HIGH-2: チャージバック(dispute)発生時にConnect送金が回収されない

- 該当: `app/api/stripe/webhook/route.ts:74`(`handleChargeDisputeCreated`)
- 何が起きるか: 現状は `payment_status = "disputed"` に更新し管理者に通知するだけ。destination charge の場合、dispute発生時はStripeが争議額をプラットフォーム残高から引き落とす一方、コーチへの送金分はそのまま残る。
  - 具体例: ゲストがConnectセッションに3,000円決済 → 2,700円がコーチへ送金済み。ゲストがチャージバックを申し立てる → Stripeはプラットフォームから3,000円+係争手数料を引き落とすが、コーチは2,700円を保持したまま。プラットフォームが約3,000円を単独で負担する。過去に「返金時に送金分をプラットフォームが被る」という同種バグが指摘・修正されているが、dispute経路には同じ穴が残っている。
- 修正方針: dispute発生時(または `charge.dispute.closed` で `lost` 確定時)にConnect送金のreversalを実行し、`transfer_records` にも反映する。

### HIGH-3: 退会済みメンバーが同じチームに再参加できない(新規発見)

- 該当: `actions/teams/members.ts:77-85`(`joinTeamByCode`)、`actions/join-requests.ts:166-176`(`approveJoinRequest`)
- 何が起きるか: `removeMember` はレコードを削除せず `status: "inactive"` にするソフトデリート。一方 `joinTeamByCode` の既存メンバーチェックは `status` を見ずに存在確認しているため、退会済み(inactive)の行がヒットして「既にこのグループに参加しています」で弾かれる。`approveJoinRequest` 側も単純な `INSERT` のため、`team_members` の `unique(team_id, swimmer_id)` 制約(migration 00006)に既存のinactive行が衝突し、承認のたびに失敗する(申請はpendingに差し戻されるだけで、リトライしても永久に成功しない)。
  - 具体例: シーズン制のスイミングクラブでよくある「一度退会して翌シーズンに復帰したい」というケースが、招待コード経由でもチーム側の承認経由でも一切通らない。
- 修正方針: `joinTeamByCode` の存在チェックに `status = "active"` 条件を追加し、両経路とも既存のinactive行を再アクティブ化(upsert)する処理に変更する(role/membership_type/joined_atをリセット)。

---

## MEDIUM

1. **Connect未有効チームへの誤課金がサイレントに発生しうる** — `actions/sessions/lifecycle.ts:123`。チームのConnect口座が未設定/無効な状態で確定処理すると、`transfer_data` なしで全額プラットフォームに課金される。顧客からは正常に見えるが、コーチへの送金が発生せず、かつどの決済が「誤って全額プラットフォーム行き」になったかを識別する仕組みがない。`account.updated` の通知はあるが個別課金への紐付けがない。
2. **`charge.refunded` Webhookが実際の送金取消を確認せず `transfer_records` を "reversed" にする** — `app/api/stripe/webhook/route.ts:150`。Stripeダッシュボードから返金した場合、`reverse_transfer` が明示指定されていなければ実際には送金は取り消されないが、DB上は「取消済み」と記録されてしまう。
3. **RLSポリシーの `to authenticated` 未指定が約20ポリシーに残存(セキュリティ・DB両エージェントが指摘)** — `teams`/`team_members`/`session_registrations`/`membership_fees`/`notifications`/`announcements`/`session_templates`/`stamp_purchases`/`transfer_records` など。現時点では `auth.uid()` がanonではNULLになるため実害はないが、このコードベースでは同種の見落とし(`to authenticated`忘れ)が過去に2回実際の情報漏洩インシデントを起こしている(00048・00057で修正済み)。将来の条件変更で再発するリスクがある構造的な穴。全ポリシーに `to authenticated` を一括付与する予防的マイグレーションを推奨。
4. **金額カラムにCHECK制約がない** — `membership_fees.amount` / `stamp_purchases.amount` / `transfer_records.amount` 等が素の `integer` で非負制約なし。特に00059/00068でこれらのテーブルは書き込みが `service_role` 限定になっており、RLSでは弾けなくなっているため、DB制約かアプリ検証のみが最後の砦になっている。
5. **ESLintエラーが1件未解消のまま残存** — `app/(auth)/register/sent/resend-confirmation-form.tsx:21-24`。`react-hooks/set-state-in-effect` ルール違反(useEffect内での同期的setState)。CI未整備のため検知されずに残っている。
6. **`app/(app)/payments/page.tsx` のデータ取得が直列8回のawaitでウォーターフォール化** — 独立なクエリ(`sessionRegs`/`membershipFees`/`adminMemberships`など)が `Promise.all` 化されておらず、通帳ページ(頻繁にアクセスされる)の応答が不必要に遅い。`app/teams/[id]/page.tsx` では既に並列化パターンが使われており、同様の適用を推奨。
7. **APIルートがmiddlewareの認証セーフティネットの外にある** — `lib/supabase/middleware.ts:49,70,79` で `/api/**` は認証リダイレクト処理から除外されており、各ルートハンドラが個別に `auth.getUser()` を呼ぶ設計。現状の4ルートは正しく実装されているが、将来新しいAPIルートを追加する際にこのチェックを書き忘れると無防備になる。共通ヘルパー(`requireApiUser()`)化を推奨。
8. **400〜800行の推奨上限に近い/超えるファイルが複数** — `app/(app)/payments/page.tsx`(478行)、`app/api/stripe/webhook/route.ts`(467行)、`actions/teams/crud.ts`(473行)、`actions/teams/members.ts`(424行)、`actions/sessions/crud.ts`(421行)。特に`payments/page.tsx`はデータ取得・集計ロジック・JSXが混在しており分割の価値が高い。

---

## LOW

1. セッション用PaymentIntent作成にIdempotency-Keyがない(`lib/stripe-payment-helpers.ts:42`)。Subscription作成には既にある。ステータスクレームで二重課金は防げているが、多重防御として追加推奨。
2. `startMonthlySubscription` が支払い方法未登録のまま `default_incomplete` でサブスクを開始し、`incomplete` 状態が `LAPSED_SUBSCRIPTION_STATUSES` に含まれていないため、カード未登録の会員が一時的に「会費免除」扱いになる約23時間の窓がある。
3. `account.*` イベントと通常イベントが同一Webhookエンドポイント/署名シークレットを共有している前提が未確認(Connect用に別エンドポイントが設定されている場合、署名検証が失敗する)。
4. `transfer_records.stripe_payment_intent_id` にユニーク制約がない(現状は事故なしだが将来の二重INSERTを防ぐ安全網として推奨)。
5. `getSessionRegistrations`/`exportSessionRegistrations`(`actions/sessions/reporting.ts`)にLIMITがなく、他のクエリで徹底されている上限設定パターンと不整合。
6. `lib/notifications.ts:54-59` のリトライフォールバックが `for` + `await` の直列処理(独立行の挿入なので並列化余地あり)。
7. `handle 'app/(app)/payments/page.tsx'` 以外にも同様のシリアルawaitパターンが散見(優先度低)。

---

## 検証で「実際に直っていた」と確認できたもの(再指摘不要)

- Stripe Webhookの冪等性ガード(`payment_intent.succeeded`が`pending/failed`からのみ`paid`に遷移、`refunded`/`disputed`後の巻き戻り防止)
- `cancelSession`/`confirmSession`/`retryPayment`/`approveJoinRequest`/`rejectJoinRequest`の原子的ステータス遷移
- `gender_filter`/`target_members`のサーバー側検証
- `bulkCreateFees`のadminクライアント統一
- Connect送金のPaymentIntent一次情報源化(アプリ起点の返金経路については解決済み。dispute経路はHIGH-2として別途未解決)
- メンバー削除・会員種別変更時のStripeサブスクリプション自動キャンセル
- ダッシュボードN+1クエリの解消
- タイムゾーン(JST)関連の申込締切バリデーションバグ
- 個人チームbioへの一元化後の不整合
- migration 00029の順序バグ
- `teams`/`practice_sessions`のanon漏洩(00048/00057で修正済み、現在も有効)
- `無防備なstartTransition`パターンの横展開修正(再発なし)
- JPY金額は全箇所で整数円として一貫処理(誤った*100/100なし)

---

## テストが存在しない前提での最優先テスト候補

1. 回数券残高の整合性(HIGH-1) — Stripe不要、DB/RPCロジックのみでテスト可能。ROI最大。
2. Webhookの`payment_status`状態遷移(冪等性) — テーブル駆動テストで`succeeded`が`pending/failed`からのみ遷移すること、dispute/refundが不変であることを検証。
3. `confirmSession`/`cancelSession`の原子的クレーム — 同時実行で二重課金/二重返金/二重ポイント付与が起きないことを検証。
4. `joinTeamByCode`/`approveJoinRequest`の再参加フロー(HIGH-3) — 退会→再参加のシナリオ。
5. `lib/format-date.ts`のJST境界値 — 過去に一度リグレッションした領域。
6. `registration.ts`の`gender_filter`/`target_members`ゲーティング — 壊れても画面上は気づきにくいため。

---

## 補足(コードレビュー外の運用面、ブリーフィングより)

以下はコードの修正では解決しない、運用上の既知課題(ブリーフィング記載のまま、今回のレビューで新規指摘なし):
- 自動テスト・CIパイプラインが皆無
- Stripeのtest/live モードが未確定
- 監視・アラート(Sentry等)未導入、Webhookハンドラの例外が本番で気づかれないリスク
- ロールバック・バックアップ運用の未文書化
- 特定商取引法ページがプレースホルダーのまま
