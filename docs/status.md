# 作業ステータス
最終更新: 2026-06-22

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

## 直近でやったこと（2026-06-22）

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

## 次にやること

### P1（近日中）

1. **セッションタグ拡張**（1-J）
   - `SYSTEM_TAGS` に `swimmer_type`（選手/マスターズ）と `swim_discipline`（競泳/シンクロ等）を追加
   - セッション作成フォーム・メンバータグUIに反映

3. **会費・回数券の改善**（1-F、内容要確認）

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
