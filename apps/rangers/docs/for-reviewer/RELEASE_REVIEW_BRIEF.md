# Rangers リリース前レビュー ブリーフィング

作成日: 2026-07-30
作成者: 開発担当（久保友幸）+ Claude Code
対象読者: 今回リリース前の最終チェックを依頼する社外エンジニア

## このドキュメントの位置づけ

Rangers のコードベースは AI（Claude Code）を主開発者として構築されており、社内では毎回の変更後に AI エージェントによるコードレビュー・セキュリティレビューを実施してきた（後述、計7回）。今回さらに人間のプロのエンジニアの目で最終チェックをしてもらいたい。

このドキュメントは、レビュアーが初見でコードベースに触れる際に必要な前提知識（プロダクト概要・技術スタック・設計上の要注意ポイント・過去の指摘履歴・現状の既知課題）を1箇所にまとめたもの。実装の詳細は各ソースコードとインラインコメント、[README.md](../../README.md)・[AGENTS.md](../../AGENTS.md)・[DESIGN.md](../../DESIGN.md) を参照。

まずどのドキュメントから読むべきかは [docs/for-reviewer/INDEX.md](./INDEX.md) を参照。

シークレットの値そのものはこのドキュメントに含まれていない（変数名の一覧のみ）。

---

## 1. プロダクト概要

Rangers は、スイミングチーム・スイミングスクール運営者向けの管理プラットフォーム。

- チーム（スイミングクラブ・スクール）の作成・メンバー管理・招待
- 練習/大会/イベント（セッション）の作成・参加登録・出欠管理
- 年会費・月謝（Stripe Subscription）・回数券（ポイントカード）・都度参加費の決済
- Stripe Connect によるコーチ/チームへの送金分配
- お知らせ・DM メッセージ・通知
- 公開ページ（チーム紹介・コーチプロフィール）経由の問い合わせ・参加申請

想定利用者はコーチ・チーム管理者（お金を扱う側）とスイマー・保護者（参加・支払いをする側）の2ロール。

重要: 本番 Supabase プロジェクト（`jeosqnkeyiwapeeujrml`）には実在のチーム・会員データが入っており、回数券残高を保有する実利用者も存在する。開発中のデモ環境ではなく、実データが乗った状態でのレビューになる。

---

## 2. 技術スタック

| 領域 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js（App Router, Turbopack） | 16.2.11 |
| UI | React | 19.2.4 |
| 言語 | TypeScript | ^5 |
| DB / Auth / Storage | Supabase（Postgres + Row Level Security） | supabase-js 2.105.4 |
| 決済 | Stripe（Card決済・Subscription・Stripe Connect） | stripe 22.1.1 |
| バリデーション | Zod | 4.4.3 |
| スタイリング | Tailwind CSS 4 + shadcn/ui（radix-ui） | - |
| ホスティング | Vercel | swim-os-seven.vercel.app |
| パッケージ管理 | pnpm（monorepo, `pnpm-workspace.yaml`） | - |

補足: Next.js 16 は比較的新しいメジャーバージョンで、破壊的変更が含まれる。プロジェクト側の [AGENTS.md](../../AGENTS.md) に「学習データの古い Next.js の知識と挙動が異なる場合がある。`node_modules/next/dist/docs/` の同梱ドキュメントを参照すること」という注意書きがある。AIだけでなく人間のレビュアーも、Next.js 16 特有の挙動（App Router のキャッシュ戦略・Server Actions 等）については念のため公式ドキュメントを確認することを推奨。

---

## 3. アーキテクチャ / ディレクトリ構成

```
apps/rangers/
├── app/                    # Next.js App Router
│   ├── (public)/           # 未ログインでも見れる公開ページ（LP, チーム紹介, 規約等）
│   ├── (auth)/              # ログイン・登録・オンボーディング
│   ├── (app)/               # ログイン必須のメインアプリ（ダッシュボード・チーム・セッション・会費・支払い等）
│   └── api/stripe/          # Stripe Webhook / Connect callback / setup-intent
├── actions/                 # Server Actions（DB書き込みの実体はほぼ全てここ）
│   ├── teams/                # crud / members / fee-stats
│   ├── sessions/              # crud / lifecycle / registration / payment-recovery / reporting
│   └── *.ts                    # announcements / fees / messages / notifications / onboarding / payments / profile / stamps / subscriptions / templates
├── lib/
│   ├── supabase/              # client.ts / server.ts（RLSあり）/ admin client（RLSバイパス）/ middleware.ts
│   ├── auth/                   # require-team-admin.ts（isTeamAdmin / isTeamMember）
│   ├── stripe*.ts               # Stripe 関連ヘルパー（4ファイルに分割）
│   ├── rate-limit.ts
│   └── validations.ts           # Zod スキーマ集約
├── types/
│   ├── database-generated.ts    # Supabase CLI 自動生成（手で編集しない）
│   └── database.ts               # アプリ独自の型・定数
├── supabase/migrations/        # 連番SQL、現在 00001〜00064
├── components/                  # UIコンポーネント（shadcn/ui ベース）
└── instrumentation.ts            # 本番起動時の必須環境変数チェック
```

規模の目安: `app/**/page.tsx` 39ページ、Server Action ファイル群、API Route 4本、DB migration 64ファイル、テーブル21（後述）。

`app/(app)/teams` 配下等が管理者・スイマー共用で、ロールによって表示を出し分ける設計（かつては `/instructor` 配下に別ルートがあったが、6月中に統合・削除済み。git log にその変遷が残っている）。

---

## 4. データモデル

`supabase/migrations/` に21テーブル定義がある。

現役（アプリから実際に読み書きされる）:
`teams` / `team_members` / `practice_sessions` / `session_registrations` / `session_templates` / `membership_fees` / `stamp_purchases` / `transfer_records` / `announcements` / `announcement_reads` / `join_requests` / `messages` / `notifications` / `profiles` / `price_views` / `platform_settings` / `system_tags`

レガシー（コードから未参照、DBに残存しているだけ）:
`lessons` / `bookings` / `reviews` / `schedule_requests`

これらは初期の「レッスン予約」モデル時代の名残で、現行のチーム/セッションモデルに移行済み。社内レビューで「実コードから完全に未参照」であることを grep で確認済み。Supabase advisor がこれらに対して RLS initplan の警告を出すが、使われていないテーブルなので実害なしと判断し放置している（削除するかは今回のレビュー観点の1つとしてもよい）。

外部の生SQLクエリからの改ざんを防ぐため、`session_registrations` / `membership_fees` / `stamp_purchases`（お金が動くテーブル）はアプリの通常の書き込み経路（RLS適用ロール）を意図的に閉じ、Server Action からの `service_role`（RLSバイパス）経由のみで書き込む設計にしている（migration `00059`）。

---

## 5. 認証・認可・RLS まわりの設計と注意点（レビュー時に必読）

このコードベースで最も踏み抜きやすい罠として、[README.md](../../README.md) に明記されている自己参照RLSの問題がある。

> `teams` / `practice_sessions` / `team_members` は互いを参照し合う RLS ポリシーになっており、通常の `createClient()`（RLS適用あり）で操作すると自己参照ループでブロックされる（エラーを返さず0件更新のまま成功扱いになることもあり、原因の切り分けが難しい）。

対応方針として、これら3テーブルと決済系テーブルに触れる Server Action は `createAdminClient()`（service role, RLSバイパス）を使い、認可は `lib/auth/require-team-admin.ts` の `isTeamAdmin()` / `isTeamMember()` で**アプリ側コードが手動チェック**する設計に統一している。

レビュー観点としては、
- 新規/変更された Server Action が `createAdminClient()` を使っているのに `isTeamAdmin`/`isTeamMember` の呼び出しを漏らしていないか（＝RLSもアプリ側チェックも両方ない状態）
- 逆に通常クライアント（RLSあり）を使うべき箇所で誤って admin client を使い、RLSでの防御を失っていないか

が事故の起きやすいポイント。

その他、認証・認可で過去に実際に踏んだ問題（すべて修正済みだが、類似パターンが今後も混入しうる箇所として）:
- RLSポリシーに `to authenticated` を付け忘れ、匿名（anon key）が REST API 経由で非公開カラムを直接取得できていた事例が複数回発生（`practice_sessions`、`platform_settings` 等）
- `SECURITY DEFINER` 関数の `STABLE`/`VOLATILE` 宣言ミスにより RLS ポリシー評価が壊れていた事例
- `REVOKE ... FROM anon` だけでは Postgres のデフォルト `PUBLIC` 疑似ロール経由の実行権限が残ってしまう罠

---

## 6. 決済（Stripe）設計

- カード決済（都度払い）: Stripe Elements + PaymentIntent
- 月謝: Stripe Subscription
- 回数券: アプリ内DB残高管理（`stamp_purchases` / `increment_stamp` / `decrement_stamp` RPC）。Stripe とは直接連携せず、管理者が購入記録を手動登録する運用
- Stripe Connect: チーム（コーチ側）への送金分配。`transfer_records` テーブルで送金状態を追跡
- Webhook: `app/api/stripe/webhook/route.ts` で署名検証・冪等性チェックを実施。ハンドリング対象イベントは支払い成功/失敗、Subscription更新、`charge.dispute.created`（チャージバック）、`charge.refunded`（アプリ外での返金）など

過去のレビューで見つかった代表的な問題（修正済み）:
- Connect送金の成否をローカルDBの記帳（`transfer_records`）だけに頼っていたため、記帳漏れがあると返金時に送金分の資金がコーチ側に残ったままプラットフォームが返金額を丸かぶりする経路があった → 現在は Stripe 側の PaymentIntent を一次情報源として判定する方式に変更済み
- Idempotency Key 未設定による二重サブスクリプション作成の可能性
- Connect口座が後から無効化された場合に静かに非Connect決済へフォールバックしていた問題

要確認事項（このドキュメント作成時点で未確認）: 現在 Stripe が **test mode と live mode のどちらのキーで動いているか**。過去のステータスメモには「テストモード接続済み」という記載があるが、直近のレビューで実際の回数券購入履歴（現金決済相当）が本番相当DBに存在する旨の記述もあり、リリース前チェックの一環としてこの点はともくんに直接確認することを推奨する。

---

## 7. 環境変数・シークレット（値は本ドキュメントに含めない）

| 変数名 | 用途 | 備考 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | クライアント公開 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | クライアント公開 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | **サーバー専用・RLSバイパス**。露出厳禁 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | クライアント公開 |
| `STRIPE_SECRET_KEY` | Stripe secret key | サーバー専用。本番では必須 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 署名検証用 | サーバー専用。本番では必須 |
| `NEXT_PUBLIC_APP_URL` | Stripe Connect リダイレクト先等 | クライアント公開 |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` | デモログインボタン表示切替 | - |

`instrumentation.ts` が起動時に `SUPABASE_SERVICE_ROLE_KEY` / `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` の存在をチェックし、`NODE_ENV=production` かつ未設定なら起動自体を失敗させる（fail-fast設計）。

---

## 8. これまでの社内レビュー履歴（AIエージェントによる自己レビュー、計7回）

「実装 → tsc/eslint/Supabase advisors 確認 → security-reviewer / database-reviewer / typescript-reviewer 等のエージェントによる並列レビュー → 指摘の実コード裏取り → 修正 → 本番DB migration適用」というサイクルを、コミット単位で7回繰り返している（git log 参照、`eeaf4c2` 3回目 〜 `672ee43` 7回目）。

各回で見つかった CRITICAL/HIGH/MEDIUM/LOW 指摘はその都度修正しており、直近7回目（2026-07-30, commit `672ee43`）ではHIGH2件・MEDIUM3件・LOW4件を修正済み。詳細な指摘内容と修正内容は [docs/status.md](../../../../docs/status.md)（プロジェクト横断のステータスファイル）に全履歴が残っている。

この経緯を踏まえたレビュー時の留意点:
- 「よくある脆弱性パターン」（RLSの anon 漏洩、TOCTOU、権限昇格等）は一通り自己チェック済みなので、それらの再確認よりも**AIによる自己レビューでは見落としやすい観点**（ビジネスロジックの整合性、UXエッジケース、実運用でのスケール、外部サービス連携の運用面）を重点的に見てもらえると価値が高い
- とはいえ「見つけたつもり」で実は見落としているケースも十分あり得るため、指摘済み項目を鵜呑みにせず独立した視点で再検証してもらって構わない

### 現時点の Supabase advisor スナップショット（2026-07-30 確認）

セキュリティ:
- `public_profiles` ビューが `SECURITY DEFINER`（ERROR判定）→ 意図的な設計（退会済みユーザーを除外した安全カラムのみ公開するビュー）と内部で確認済みだが、レビュー時に設計意図と実装の一致を再確認してほしい
- `get_my_team_ids` 等5つの `SECURITY DEFINER` 関数が authenticated ロールから実行可能（WARN）→ RLSポリシー内部で使用するため意図的に許可
- Leaked Password Protection が無効（WARN）→ 未着手のバックログ、Supabase Dashboard側の設定でコード変更不要

パフォーマンス:
- レガシーテーブル（`lessons`/`bookings`/`reviews`/`schedule_requests`）に対する RLS initplan 警告多数 → 未使用テーブルのため実害なしと判断し放置
- 未使用インデックス多数（INFO） → 実運用データ量がまだ少ないための可能性あり、経過観察

### 未着手のバックログ（優先度低・意図的に後回し）

- Supabase Dashboard で「Leaked Password Protection」を有効化（手動操作のみ、未実施）
- Sentry 等の構造化エラー監視の未導入（Webhookハンドラ等の例外が本番で誰にも気づかれないリスクが残る）
- WCAG コントラスト比の一部未達（`status-warning` トークンの色）
- 見出し構造（h1）欠如ページが9件、`loading.tsx` 欠如が6ルート
- 通知文言が各 Server Action に散在（カタログ化されていない）
- Zod バリデーションを適用すべき基準の明文化が未整備
- 特定商取引法ページがプレースホルダーTODOのまま（事業者情報待ち）

---

## 9. テスト・CI/CD の現状（正直な状態）

- 自動テスト（unit / integration / E2E）は**存在しない**。品質担保は tsc（型チェック）・ESLint・AIエージェントによるコードレビュー・Playwright を使った都度の手動ブラウザ確認に依存している
- GitHub Actions 等の CI パイプラインは**未設定**。push 前の `tsc --noEmit` / `pnpm eslint .` / `pnpm build` はローカルで手動実行している
- したがって、リグレッションの検知は人間（またはAI）が気づくかどうかに依存している状態

このプロジェクトのリリース判断において、レビュアーに「自動テストの充実度」を評価してもらうのは的外れ（ゼロなので）。むしろ「テストがない状態でどこまでリスクを許容できるか」「最低限どこにテストを入れるべきか」の判断材料としてコードを見てもらうのが実態に即している。

---

## 10. デプロイ・運用

- ホスティング: Vercel（`swim-os-seven.vercel.app`）
- Supabase 本番プロジェクト: `jeosqnkeyiwapeeujrml`（実データ入り）
- DB migration の適用は Supabase CLI（`npx supabase db push --linked`）または MCP 経由で個別実行。適用漏れ・`migration repair`（履歴だけ更新してSQLは実行しない）の取り違えが過去に問題になった経緯があり、README にも注意書きがある
- ロールバック手順・バックアップ運用については明文化されたドキュメントが現時点でない（レビュー観点として指摘してもらえると助かる）

---

## 11. 今回のレビューで特に見てほしい観点（提案）

社内でのAI自己レビューが手薄になりがちな領域を中心に、以下を重点観点として提案する。レビュアーの判断で範囲は調整してもらって構わない。

1. お金が絡む処理全体のエンドツーエンドの整合性（Stripe Webhook の失敗・リトライ・冪等性、返金・チャージバック時のConnect送金整合性、回数券残高の整合性）
2. 自動テストが存在しない前提での、リグレッションリスクが特に高い箇所の特定（優先的にテストを書くべき箇所の提言も歓迎）
3. スケール時の懸念（現状データ量は小さいが、N+1・無制限クエリ・レートリミットの妥当性など）
4. RLS設計全体の整合性の独立検証（社内チェックはAI起点のため、第三者の目で見た抜け漏れ）
5. Next.js 16 / React 19 という比較的新しいバージョンでの、非推奨・破壊的変更の踏み抜きの有無
6. 本番運用の観点での不足（監視・アラート・ロールバック手順・障害対応フロー）

---

## 12. 参照ドキュメント

- [README.md](../../README.md) — セットアップ手順・データアクセス規約・環境変数
- [AGENTS.md](../../AGENTS.md) — Next.js 16 固有の注意点
- [DESIGN.md](../../DESIGN.md) — デザイントークン・UIルール
- [docs/status.md](../../../../docs/status.md) — 全レビュー履歴・作業ログ（プロジェクト横断、量が多いので必要な回のセクションを検索推奨）
- [MANUAL_OPERATIONS.md](../MANUAL_OPERATIONS.md) — 手動運用チェックリスト（一部内容が古い可能性あり、README記載内容を優先）
