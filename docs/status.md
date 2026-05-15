# 作業ステータス
最終更新: 2026-05-16 16:00

---

## 現在のフェーズ

Rangers → コード実装完了・外部サービス接続待ち（目標：5月末）
SchoolBoost AI → ドキュメント整備完了・開発は Rangers 後に着手

---

## 担当分担（確定）

| アプリ | 担当 |
|--------|------|
| スイムトラッカー | 長畑さん |
| レンジャーズ | ともくん |
| スクールブースト AI | ともくん |
| スーパー支配人 | 長畑さん |

---

## 次にやること

### Rangers UI 改善（完了）
- [x] mcp-image の動作確認（画像生成テスト）
- [x] レッスン検索画面：各レッスンカードにイメージ画像を表示
- [x] 指導員ページ：先生の似顔絵/アバター画像を生成して表示
- [x] プロフィール画像アップロード機能の実装
  - ⚠️ Supabase Storage `avatars` バケットの作成が必要（Supabase Dashboard > Storage > New bucket）
  - Public bucket で作成し、RLSポリシーで自分のみアップロード可能にする
- [x] ヘッダー修正：ユーザー名テキスト → プロフィール画像（丸アイコン）に変更

### 次にやること（再起動後）
- [ ] Playwright拡張機能インストール済み → Rangers の各ページをブラウザで確認してUI/UX改善を実施

### 外部サービス接続（次セッションで再開）
- [x] Supabase プロジェクト作成
- [x] Supabase マイグレーション実行（00001 → 00002）
- [x] Stripe アカウント作成・APIキー取得
- [x] Vercel デプロイ済み
- [x] 環境変数設定済み（STRIPE_WEBHOOK_SECRET 以外）
- [x] Stripe Webhook 設定済み（URL: https://swim-os-seven.vercel.app/api/webhooks/stripe）
- [x] Vercel 再デプロイ済み（STRIPE_WEBHOOK_SECRET 追加後）
- [x] 動作確認完了（レッスン作成 → 予約 → Stripe決済 → 確定まで全フロー通過）
- SchoolBoost AI：LINE Developers チャネル申請（審査待ちのため早めに）

---

## 積み残し・ブロッカー

- キャンセルポリシー（Rangers）：長畑さん・長畑さんのお父様・レイカさんと要相談
- プラットフォーム手数料率（Rangers）：長畑さんと要相談
- QRコード出席確認の運用方法（SchoolBoost）：要後日確認
- プッシュ通知 vs LINE通知の方針（SchoolBoost）：長畑さん・長畑さんのお父さん・れいこさん・らいかさんと要相談

---

## 環境構築メモ

- リポジトリ: ktomoyuki0227/swim-os（private）
- モノレポ構成: apps/rangers に Next.js アプリ
- GitHub CLI: PATH に `C:\Program Files\GitHub CLI` を追加済み（PowerShellプロファイル経由）
- .env.local.example を apps/rangers/ に配置済み

---

## 作業ログ

### 2026-05-16

**Rangers コード機能追加（完了）**

- 認証フロー修正: Supabaseメールレート制限エラー調査 → Confirm email OFF で解決
- 登録後リダイレクト: /register/confirm → /dashboard に変更
- モックデータ追加: DB空のときサンプルデータを表示（レッスン・予約・ダッシュボード）
- モックレッスン詳細の404修正
- 指導員ルートにロールガード追加
- レッスン一覧にキーワード検索・料金ソート機能追加
- スイマーの予約キャンセル機能追加
- 指導員の予約確定機能（pending → confirmed）追加
- プロフィールページにメール・ロール表示追加
- Stripe未設定時は決済スキップして予約確定するフォールバック追加
- 予約ありのレッスン削除ガード追加
- RLSポリシー修正（指導員が予約ステータスを更新できるように）
- カスタム404・エラーページ追加
- ローディングスケルトン追加
- レッスンの公開・下書き切り替え機能追加
- 指導員ダッシュボードに今月の売上追加
- browser-setup-guide.md を現状に合わせて更新

**外部サービス接続（途中）**

- Supabase・Stripe・Vercel・環境変数（STRIPE_WEBHOOK_SECRET以外）: 設定済み
- Stripe Webhook: 未設定 → 次セッションで再開（「次にやること > 外部サービス接続」参照）

---

**Rangers UI 改善（2026-05-16 完了）**

- mcp-image で画像生成（クロール・平泳ぎ・バタフライ・子ども・田中レイ先生・山本カナ先生）
- レッスン一覧・詳細カードに種別イメージ画像を表示
- ナビゲーションのユーザー名 → アバターアイコン（画像 or イニシャル）に変更
- プロフィール画像アップロード UI を実装（Supabase Storage 連携）
  - ⚠️ Supabase Dashboard で `avatars` バケットの作成が必要（Public）
- next.config.ts に Supabase Storage リモートパターン追加

---

### 2026-05-15（2回目）

- Stripe Elements 決済UI実装完了:
  - @stripe/stripe-js, @stripe/react-stripe-js パッケージ追加
  - components/booking/checkout-form.tsx: PaymentElement を使った決済フォーム
  - components/booking/booking-button.tsx: 予約ボタン → Stripe Elements 表示フローに改修
- トップページ（LP）デザイン強化:
  - Hero セクション（グラデーション背景 + Wave SVG）
  - Features セクション（3カード）
  - How it works セクション（スイマー/指導員別ステップ）
  - CTA セクション + フッター
- レスポンシブ対応（モバイルファースト）:
  - ナビゲーション: ハンバーガーメニュー追加（md 以下で表示）
  - レッスンフォーム: 2カラム → モバイルで1カラム
  - 指導員ダッシュボード・レッスン一覧: カードレイアウト改善
  - 予約履歴: モバイルで縦並びに
- デモ用テストデータ SQL 作成: supabase/seed.sql
- 予約成功メッセージ表示追加（bookings ページ ?success=true パラメータ対応）
- ブラウザ操作ガイド作成: docs/browser-setup-guide.md
- TypeScript 型チェック + ビルド通過確認

### 2026-05-15（1回目）

- GitHub CLI ログイン完了（gh auth login）
- GitHub リポジトリ作成（ktomoyuki0227/swim-os、public → private に変更）
- .gitignore 作成（PDF/PPTX/XLSX を除外）
- Next.js 16 + Tailwind CSS 4 + shadcn/ui 環境構築完了
- パッケージ追加: @supabase/supabase-js, @supabase/ssr, stripe, zod
- Rangers の全ページ・コンポーネント・Server Actions 実装完了:
  - 型定義: types/database.ts
  - Supabase クライアント: lib/supabase/（client, server, middleware）
  - Stripe クライアント: lib/stripe.ts
  - バリデーション: lib/validations.ts（Zod スキーマ）
  - 認証: ログイン、新規登録（ロール選択）、Google OAuth コールバック、ミドルウェア
  - 指導員: ダッシュボード、レッスン管理（CRUD）、予約者一覧
  - スイマー: レッスン検索・一覧、レッスン詳細、予約フロー、予約履歴
  - 共通: プロフィール設定、ナビゲーション（ロール別切替）、トップページ
  - API: Stripe Webhook ルート（payment_intent.succeeded / failed）
- DB スキーマ SQL 作成（supabase/migrations/）:
  - 00001_initial_schema.sql: profiles, lessons, bookings + Auth トリガー
  - 00002_rls_policies.sql: RLS ポリシー
- TypeScript 型チェック通過（エラーなし）

### 2026-05-13

- ミーティング完了
- Rangers・SchoolBoost AI の全ドキュメント整備・ブラッシュアップ完了
- SchoolBoost AI：スクラッチ方針確定、マルチテナント（school_id）設計追加、AI差別化を明記
- 開発順序を決定：Rangers 先行 → SchoolBoost AI（LINE 審査待ち期間を並行活用）
