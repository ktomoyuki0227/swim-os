# 作業ステータス
最終更新: 2026-06-20

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

## 次にやること

### P1（近日中）

1. **登録フロー改善（オンボーディング分岐）**（P1-A）
   - 登録完了後「どう使いますか？」選択画面
   - スイマー / チーム作る / パーソナルコーチ の3分岐

2. **セッション作成フォーム拡張**（P1-E）
   - 合宿の複数期間指定 / 待ち合わせ場所 / 性別絞り込み

3. **会費・回数券の改善**（P1-F）

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
