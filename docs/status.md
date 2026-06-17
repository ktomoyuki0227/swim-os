# 作業ステータス
最終更新: 2026-06-17

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
| Stripe Webhook | 🔲 Secret 未設定（Vercel 環境変数） |
| Stripe Connect | 🔲 未実装 |
| LINE OAuth | 🔲 スタブのみ |
| Resend | 🔲 未導入 |

---

## 直近でやったこと（2026-06-17）

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

## 次にやること

### P1（近日中）

1. **チーム料金体系選択制**（P1-B） ← 次のタスク
   - `teams` テーブルに has_annual_fee / has_monthly_fee / has_point_card / has_session_fee フラグ追加
   - チーム作成・編集フォームに料金体系チェックボックス追加
   - 会費管理画面でフラグに応じてタブ表示/非表示

2. **プロフィール拡張の完成**（P1-D）— DB マイグレーション適用

---

## 積み残し・ブロッカー

- チーム乱用防止の方針（Hydoor と要相談: 制限 or 申請制 or 課金）
- 課金開始タイミング（Hydoor と要相談）
- キャンセルポリシー未確定（長畑さん・長畑さんのお父様・レイカさんと要相談）
- Stripe Webhook Secret 未設定（Vercel 環境変数）
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
