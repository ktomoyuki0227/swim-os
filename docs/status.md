# 作業ステータス
最終更新: 2026-06-04

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

## 直近でやったこと（2026-06-03〜06-04）

- LP ヒーローセクションを AI動画フルブリード背景に変更（hero-bg.mp4）
- Rangers ロゴ・ネームロゴを全画面に適用（透過背景版）
- favicon 設定（スイマーロゴ・白背景・105%スケール）
- 開発プランを全面更新（docs/rangers/development-plan.md）
  - 39 画面・15 テーブル・13 Server Actions の完全棚卸し
  - 外部サービス連携状態の明確化
  - Phase 1〜3 のタスクを現状に合わせて再設計
- チーム参加フロー実装（`/teams/join/[inviteCode]`）
  - `app/(public)/teams/join/[inviteCode]/page.tsx` 新規作成（Server Component）
  - `app/(public)/teams/join/[inviteCode]/join-form.tsx` 新規作成（Client Component）
  - `actions/teams.ts` に `joinTeamAction()` 追加
  - `actions/auth.ts` の login / register に invite コード引き継ぎ対応
  - `app/(auth)/login/page.tsx` / `register/page.tsx` に hidden invite input 追加
- Stripe Webhook / Stripe Connect / LINE OAuth / Resend を Phase 1 → Phase 2 に移動
- actions/templates.ts を adminClient に全統一（RLS バイパス）→ テンプレート保存・取得バグ修正
- デモ用テストデータ（seed.sql）投入済み
- Supabase Storage avatars バケット作成済み
- sessions/new をサーバーでテンプレートプリフェッチ → ドロップダウン遅延解消

---

## 次にやること

### 優先度 HIGH（6/7 デモ前）
1. ~~デモ用テストデータ投入（seed.sql 実行）~~ ✅
2. ~~Supabase Storage `avatars` バケット作成~~ ✅
3. ~~テストユーザー動作確認（instructor / swimmer1 / swimmer2）~~ ✅
4. ~~テストチームセッション・カレンダー表示確認~~ ✅
5. ~~LP ヒーロー動画（本番 URL）再生確認~~ ✅
6. デモシナリオ最終リハーサル（6/7 当日前）

### 優先度 MEDIUM（6月中）
4. キャンセル・返金フロー（ポリシー確定後）

---

## 積み残し・ブロッカー

- キャンセルポリシー未確定（長畑さん・長畑さんのお父様・レイカさんと要相談）
- プラットフォーム手数料率未確定（長畑さんと要相談）
- lessons / sessions モデルの共存：sessions をメインとして継続（lessons は legacy として Phase 2 以降に整理）← 方針確定済み
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
