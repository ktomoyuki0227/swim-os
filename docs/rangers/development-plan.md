# Rangers 開発プラン

最終更新: 2026-06-22

---

## フェーズ概要

| フェーズ | 期間 | 目標 | ステータス |
|---------|------|------|-----------|
| PoC | 5/13 〜 5/31 | 業界有識者に見せられる状態 | ✅ 完了（大幅拡張済み） |
| Phase 1: 本番化 | 6/1 〜 6/30 | デモ仕上げ・キャンセルフロー | 🚧 進行中 |
| Phase 2: 運用強化 | 7/1 〜 7/31 | 月謝自動化・通知・分析 | 未着手 |
| Phase 3: 統合 | 8月〜 | Swim Tracker 統合（Swimmers Pro） | 未着手 |

---

## 現在の実装全容（実ファイル確認済み）

### ページ・ルート一覧（実在確認済み：38 画面）

#### LP・公開ページ（認証不要）

| ルート | 内容 | 備考 |
|-------|------|------|
| `/` | LP トップ | AI動画ヒーロー・機能紹介・CTA |
| `/about` | Rangers について | 実装済み |
| `/price` | 料金ページ | 実装済み |
| `/faq` | よくある質問 | 実装済み |
| `/instructors` | 指導員ディレクトリ | 実装済み |
| `/instructors/[id]` | 指導員公開プロフィール | 実装済み |
| `/coach-recruit` | コーチ募集ページ | 実装済み |

#### 認証ページ

| ルート | 内容 | 備考 |
|-------|------|------|
| `/login` | ログイン | メール/パスワード + LINE ボタン（スタブ） |
| `/register` | 新規登録 | ロール選択：swimmer / instructor |
| `/register/confirm` | メール確認待ち | |
| `/register/sent` | 確認メール送信完了 | |
| `/forgot-password` | パスワードリセット申請 | |
| `/reset-password` | パスワード再設定 | |

#### スイマー側（要ログイン）

| ルート | 内容 | 備考 |
|-------|------|------|
| `/dashboard` | スイマーダッシュボード | ミッション・ステータスグリッド・コーチ CTA |
| `/bookings` | レッスン予約履歴 | |
| `/lessons` | レッスン検索・一覧 | キーワード検索・料金ソート |
| `/lessons/[id]` | レッスン詳細・予約フロー | Stripe Elements 決済 |
| `/teams` | 所属チーム一覧 | |
| `/teams/[id]` | チーム詳細 | アナウンス・セッション一覧 |
| `/teams/[id]/sessions/[sid]` | セッション詳細・参加登録 | 料金表示・キャンセル |
| `/search` | レッスン・指導員検索 | |
| `/messages` | DM 受信箱 | |
| `/messages/[userId]` | DM 会話 | |
| `/notifications` | お知らせ一覧 | 既読/未読管理 |
| `/reviews/[bookingId]` | レッスンレビュー投稿 | |
| `/profile` | プロフィール設定 | アバター画像アップロード |

#### 指導員側（要ログイン・instructor ロール）

| ルート | 内容 | 備考 |
|-------|------|------|
| `/instructor/dashboard` | ダッシュボード | 売上・予約統計 |
| `/instructor/sessions` | 練習セッション管理 | |
| `/instructor/sessions/new` | セッション新規作成 | |
| `/instructor/sessions/[id]` | セッション編集・参加者確認 | |
| `/instructor/teams` | チーム管理一覧 | |
| `/instructor/teams/new` | チーム新規作成 | |
| `/instructor/teams/[id]` | チーム詳細 | メンバー管理・招待・アナウンス |
| `/instructor/teams/[id]/edit` | チーム設定編集 | |
| `/instructor/lessons` | レッスン管理一覧 | |
| `/instructor/lessons/new` | レッスン新規作成 | |
| `/instructor/lessons/[id]` | レッスン編集・削除 | |
| `/instructor/fees` | 会費・スタンプ管理 | |

---

### DB スキーマ（14 マイグレーション・15 テーブル・実確認済み）

| テーブル | 内容 |
|---------|------|
| `profiles` | ユーザー基本情報（role / avatar_url / line_user_id / stripe_customer_id / stripe_account_id） |
| `lessons` | 個別指導レッスン（price / capacity / scheduled_at / status: draft/published/cancelled） |
| `bookings` | レッスン予約（Stripe payment_intent / status: pending/confirmed/cancelled） |
| `teams` | チーム（coach_id / invite_code / member_price / guest_price / 年会費・月会費設定 / ポイントカード設定） |
| `team_members` | チームメンバー（role: admin/member / membership_type: annual/monthly/point_card / stamp_remaining） ※`tags`カラムは廃止・削除済み（2026-06-22） |
| `practice_sessions` | セッション（type: practice/camp/competition/event/meeting / 締切 / 会員・非会員料金） |
| `session_registrations` | セッション参加登録（payment_method: stripe/cash/point_card / payment_status） |
| `membership_fees` | チームの年会費・月会費管理 |
| `notifications` | システム通知（read/unread） |
| `announcements` | チームアナウンス（target_tags / image_url） |
| `announcement_reads` | アナウンス既読トラッキング |
| `session_templates` | 再利用可能なセッションテンプレート（actions あり・UI 未実装） |
| `system_tags` | タグカテゴリ（level: 初心者〜上級 / stroke: 各泳法 / purpose: 健康・競技） |
| `stamp_purchases` | スタンプカード購入履歴 |
| `price_views` | 非会員の料金閲覧トラッキング（DB のみ・管理 UI なし） |

RLS: 全テーブルに Row Level Security 設定済み

---

### Server Actions（13 ファイル・実確認済み）

| ファイル | 主な機能 |
|---------|---------|
| `auth.ts` | login / register / logout / Google OAuth / パスワードリセット |
| `lessons.ts` | レッスン CRUD・公開/下書き切替 |
| `bookings.ts` | レッスン予約・キャンセル |
| `sessions.ts` | セッション CRUD・参加登録・キャンセル・支払い・CSV エクスポート |
| `teams.ts` | チーム CRUD・メンバー管理・招待・ロール変更・タグ設定 |
| `fees.ts` | 会費 CRUD・支払状況更新 |
| `stamps.ts` | スタンプ付与・管理 |
| `announcements.ts` | アナウンス CRUD |
| `notifications.ts` | 通知既読処理 |
| `messages.ts` | DM 送受信 |
| `reviews.ts` | レッスンレビュー投稿 |
| `templates.ts` | セッションテンプレート CRUD |
| `profile.ts` | プロフィール更新 |

---

### 外部サービス連携状態（実確認済み）

| サービス | 状態 | 詳細 |
|---------|------|------|
| Supabase Auth | ✅ 本番接続 | メール/パスワード + Google OAuth |
| Supabase DB | ✅ 本番接続 | RLS 全テーブル設定済み |
| Supabase Storage | ⚠️ 要作業 | avatars バケット未作成（Dashboard 手動操作が必要） |
| Stripe テストモード | ✅ 接続済み | Payment Intent / Elements 動作確認済み |
| Stripe Connect | 🔲 未実装 | 指導員への送金・オンボーディング未実装 |
| Stripe Webhook | 🔲 未設定 | ハンドラルートは存在するが Webhook Secret が Vercel 未設定 |
| LINE OAuth | 🔲 スタブのみ | ログイン画面にボタン・alert あり。`line_user_id` カラムは profiles に存在 |
| Resend | 🔲 未導入 | パッケージ未インストール。メールは Supabase Auth のみ |
| Vercel | ✅ デプロイ済み | swim-os-seven.vercel.app |

---

### ブランディング・アセット（実確認済み）

| アセット | 内容 | 状態 |
|---------|------|------|
| `rangers-logo-背景透過.png` | スイマーイラスト（透過背景） | ✅ 全画面に適用済み（ナビ・ログイン・フッター等） |
| `rangers-name-背景透過.png` | Rangers 水しぶきテキストロゴ（透過背景） | ✅ 全画面に適用済み |
| `rangers-logo.png` | スイマーイラスト（紺背景） | ✅ public/ に配置 |
| `rangers-name.png` | Rangers テキストロゴ（紺背景） | ✅ public/ に配置 |
| `hero-bg.mp4` | AI生成水泳競技動画（4.7MB） | ✅ LP ヒーローセクションで使用中 |
| `hero-bg.jpg` | 動画フォールバック静止画 | ✅ |
| `app/icon.png` | favicon（スイマー白背景・105%スケール） | ✅ |

---

## PoC で当初プランから変わった点

### 大きく進んだ点

| 項目 | 当初プラン | 現状 |
|-----|-----------|------|
| データモデル | lessons / bookings のみ | sessions / teams をメインに構築（lessons/bookings も共存） |
| チーム管理 | △ 時間があれば | フル実装（CRUD・招待コード・タグ・アナウンス） |
| 月謝管理 | Phase 2 以降 | DB + 管理 UI の基本実装済み |
| スタンプカード | 記載なし | DB + 管理 UI 実装済み |
| メッセージ（DM） | 記載なし | 全実装済み |
| 通知 | 記載なし | 実装済み |
| レビュー | 記載なし | 実装済み |
| セッションテンプレート | 記載なし | actions 実装済み |
| LP ページ群 | トップのみ簡易 | about / price / faq / instructors / coach-recruit まで |
| ブランディング | 記載なし | AI動画・ロゴシステム・favicon 全対応 |
| タグシステム | 記載なし | level / stroke / purpose の3軸タグ実装済み |
| 非会員閲覧トラッキング | 記載なし | price_views テーブルで計測中 |

### 当初予定から未着手の点

| 項目 | 理由・補足 |
|-----|-----------|
| Stripe Connect | PoC 不要と判断。Phase 2 タスク |
| Stripe Webhook Secret | Vercel 環境変数への設定作業が必要。Phase 2 タスク |
| Supabase Storage avatars バケット | Dashboard での手動作業が必要 |
| Resend メール通知 | パッケージ未導入。Supabase メールで代替中。Phase 2 タスク |
| LINE OAuth | スタブのみ。Phase 2 で実装予定 |
| テストコード（Vitest 等） | テストランナー未設定 |

---

## モデル・機能の設計方針（確定済み）

### lessons / sessions モデルについて

`lessons + bookings` モデルは PoC 初期に作った旧モデル。
現在のメインは `practice_sessions + session_registrations + teams` モデル。

今後の方針：
- **sessions モデルをメインとして継続開発する**
- lessons / bookings は旧実装として残存。Phase 2 以降で整理（削除 or 明示的に分離）する

### チーム参加フロー（✅ 実装済み）

フロー：
1. 指導員が `/instructor/teams/[id]` から招待 URL / QR コードを発行
2. スイマーがその URL（`/teams/join/[inviteCode]`）を開く
3. 未ログイン → 「アカウントを作成して参加」または「ログインして参加」へ誘導（invite コードを引き継ぐ）
4. ログイン済み → 会員種別選択 → `joinTeamByCode()` → `/teams/[id]` にリダイレクト

実装済みファイル：
- `app/(public)/teams/join/[inviteCode]/page.tsx`（Server Component）
- `app/(public)/teams/join/[inviteCode]/join-form.tsx`（Client Component）
- `actions/teams.ts` に `joinTeamAction()` 追加
- `actions/auth.ts` の login/register に invite パラメータ対応追加
- `app/(auth)/login/page.tsx` / `register/page.tsx` に hidden input 追加

### session_templates について

`templates.ts` の Server Actions は実装済み。UI ページが未実装。
→ Phase 2 以降で対応予定

---

## Phase 1: 本番化（6/1 〜 6/30）

### 優先度 HIGH（6/7 デモ前）

| # | タスク | 内容 |
|---|--------|------|
| 1-1 | デモ用テストデータ投入 | seed.sql 実行。チーム・セッション・会員データを揃える |
| 1-2 | Supabase Storage avatars バケット作成 | Dashboard で Public バケット作成・RLS 設定 |
| 1-3 | 6/7 山川さん向けデモリハーサル | LP → ログイン → チーム参加 → セッション登録 のフロー確認 |

### 優先度 MEDIUM（6月中）

| # | タスク | 見積 |
|---|--------|------|
| 1-4 | キャンセル・返金フロー（ポリシー確定後） | 2日 |

### 優先度 LOW

| # | タスク | 見積 | 状態 |
|---|--------|------|------|
| 1-5 | PWA 設定（manifest.json・service worker） | 0.5日 | 未 |
| 1-6 | チーム参加フロー実装（`/teams/join/[inviteCode]` ルート・未ログイン時は登録→自動参加） | 1日 | ✅ 完了 |
| 1-7 | Vitest 導入・主要 Server Actions のユニットテスト | 2日 | 未 |
| 1-8 | 管理者によるメンバー情報編集（会員種別・タグ） | 1日 | ✅ 完了（2026-06-22） |
| 1-9 | 不要コード削除（/instructor 旧ルート・旧タグ関連残骸） | 0.5日 | 次タスク |

---

## Phase 2: 外部連携 + 運用強化（7/1 〜 7/31）

### 外部サービス本実装（Phase 1 から移動）

| # | タスク | 見積 |
|---|--------|------|
| 2-1 | Stripe Webhook Secret 設定（Vercel 環境変数） | 0.5日 |
| 2-2 | LINE OAuth 本実装 | 2日 |
| 2-3 | Stripe Connect 本実装（指導員オンボーディング・送金） | 3日 |
| 2-4 | Resend 導入（予約確認・セッション参加確認・キャンセル通知） | 1日 |

### 運用強化

| # | タスク | 見積 |
|---|--------|------|
| 2-5 | 月謝自動請求（Stripe Subscription または請求書） | 3日 |
| 2-6 | 月謝支払い状況管理・督促フロー | 1.5日 |
| 2-7 | QR コード出席確認（セッション出席スキャン） | 1日 |
| 2-8 | LINE 通知（セッションリマインダー・アナウンス） | 2日 |
| 2-9 | 指導員ダッシュボード強化（月次売上グラフ・参加率・タグ別分析） | 1.5日 |
| 2-10 | price_views を活用したコンバージョン分析画面 | 1日 |

---

## Phase 3: 統合（8月〜）

| # | タスク |
|---|--------|
| 3-1 | Swim Tracker との認証統合（共通アカウント） |
| 3-2 | セッション参加記録 → Swim Tracker へのデータ連携 |
| 3-3 | 「Swimmers Pro」統合ブランド展開 |

---

## 未解決事項（関係者と要相談）

| 項目 | 相談相手 | 優先度 |
|------|---------|--------|
| キャンセルポリシーの策定 | 長畑さん・長畑さんのお父様・レイカさん | HIGH |
| プラットフォーム手数料率 | 長畑さん | HIGH |
| LINE 通知 vs プッシュ通知の方針 | 長畑さん・関係者 | MEDIUM |
| Supabase Pro 移行タイミング | ともくん判断 | MEDIUM |

---

## 技術スタック（確定）

| カテゴリ | 技術 |
|---------|------|
| フロント | Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS 4 / shadcn/ui |
| バックエンド | Next.js Server Actions（API Route 最小限） |
| バリデーション | Zod 4 |
| DB / Auth | Supabase（PostgreSQL + RLS + Auth） |
| 決済 | Stripe（テスト → 本番移行予定） |
| メール | Supabase Auth メール（→ Phase 2 で Resend に移行） |
| QR コード | qrcode.react（チーム招待コード） |
| ホスティング | Vercel（swim-os-seven.vercel.app） |
| 動画 | AI生成動画（外部サービスで生成 → public/ に配置） |
| 動画生成ツール | Remotion（アセット生成用・Next.js ビルドから除外済み） |

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| Supabase Free がポーズされる | デモ前に必ずアクセス確認。問題あれば Pro（$25/月）に切替 |
| lessons / sessions モデルが混在 | ✅ 方針確定：sessions をメイン継続、lessons は Phase 2 以降に整理 | |
| Stripe Connect 審査に時間がかかる | テストモードでのデモ継続 |
| LINE OAuth 審査が長引く | メール + パスワード認証のデモ継続 |
| テストコードなし | 主要フロー（登録→チーム参加→セッション登録）を手動確認でカバー |
