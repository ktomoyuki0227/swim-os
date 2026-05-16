# SchoolBoost AI - ブラウザ手動セットアップガイド

PoC（5/31締切）に向けてともくんがブラウザで手動でやる必要があるタスクをまとめた。
コードはすべて実装済み・ビルド通過済み。

---

## Step 1: Supabase プロジェクト作成

1. https://supabase.com にアクセス → ログイン
2. 「New project」をクリック
3. 設定:
   - Name: `school-boost-ai`（任意）
   - Database Password: 安全なパスワードを設定・メモしておく
   - Region: `Northeast Asia (Tokyo)` を選択
4. 「Create new project」→ 2〜3分待つ

---

## Step 2: DB マイグレーション実行

Supabase プロジェクトが起動したら:

1. 左メニュー → 「SQL Editor」
2. 「New query」をクリック
3. `apps/school-boost-ai/supabase/migrations/001_initial_schema.sql` の内容を全コピー
4. SQL Editorに貼り付け → 「RUN」
5. エラーが出なければ OK（HYDOOR スクール + 8育成級のデモデータも自動挿入される）

---

## Step 3: 管理者ユーザーを作成

### 3-1. Auth ユーザー作成

1. 左メニュー → 「Authentication」→「Users」
2. 「Add user」→「Create new user」
3. 設定:
   - Email: `admin@hydoor.jp`（任意）
   - Password: 任意（メモしておく）
4. 「Create user」

### 3-2. プロフィールに school_id と role をセット

SQLエディタで以下を実行（user_id は上で作ったユーザーのIDに置き換え）:

```sql
-- Step 3-1 で作ったユーザーの ID を確認
SELECT id FROM auth.users WHERE email = 'admin@hydoor.jp';

-- profiles テーブルを更新（id の部分を上のIDに置き換え）
UPDATE profiles SET
  role = 'admin',
  name = 'HYDOOR管理者',
  school_id = (SELECT id FROM schools WHERE name = 'HYDOOR' LIMIT 1)
WHERE id = '<ここにUser IDを貼り付け>';

-- 確認
SELECT * FROM profiles WHERE role = 'admin';
```

---

## Step 4: 環境変数の設定

### 4-1. Supabase の API キーを取得

1. Supabase → 「Project Settings」→「API」
2. 以下の値をメモ:
   - `Project URL`（NEXT_PUBLIC_SUPABASE_URL）
   - `anon public`（NEXT_PUBLIC_SUPABASE_ANON_KEY）

### 4-2. .env.local を作成

`apps/school-boost-ai/` 直下に `.env.local` を作成:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxx...
```

---

## Step 5: ローカル動作確認

```bash
cd apps/school-boost-ai
pnpm dev
```

ブラウザで http://localhost:3000 を開く。

確認フロー（PoC必須）:
1. `/login` → admin@hydoor.jp でログイン
2. `/admin/dashboard` → ダッシュボードが表示される
3. `/admin/members/new` → 会員を1名登録してみる
4. `/admin/attendance` → 今日の出席を記録してみる
5. `/admin/fees` → 今月の月謝一覧を確認

---

## Step 6: Vercel デプロイ（デモ公開用）

1. https://vercel.com → ログイン
2. 「New Project」→ `ktomoyuki0227/swim-os` リポジトリを選択
3. 設定:
   - Framework: Next.js（自動検出されるはず）
   - Root Directory: `apps/school-boost-ai`
4. 「Environment Variables」に Step 4-1 の値を追加:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 「Deploy」

---

## 注意事項

- `.env.local` は `.gitignore` 対象なのでコミットしない（してはいけない）
- Supabase の anon key は公開 OK（RLS で保護されている）
- Rangers の Supabase プロジェクトとは別プロジェクトを作ること（テナント分離）
- デモ当日は管理者アカウントでログイン済みの状態でデモする

---

## 現在の実装済みページ一覧

| URL | 内容 |
|-----|------|
| /login | ログイン画面 |
| /admin/dashboard | ダッシュボード（統計・育成級分布・クイックアクション） |
| /admin/members | 会員一覧（検索・ステータスフィルタ） |
| /admin/members/new | 会員登録フォーム |
| /admin/members/[id] | 会員詳細（出席・月謝・育成級履歴） |
| /admin/schedules | スケジュール（曜日別・クラス一覧） |
| /admin/schedules/new | クラス新規作成 |
| /admin/attendance | 出席管理（日付・クラス別タップ入力） |
| /admin/fees | 月謝管理（月別・支払状況管理） |
| /admin/grades | 育成級管理（進級評価フォーム） |
| /admin/announcements | お知らせ一覧 |
| /admin/announcements/new | お知らせ作成 |
| /admin/analytics | 分析ページ |
| /parent/mypage | 保護者マイページ |
| /parent/attendance | 子どもの出席履歴 |
| /parent/fees | 月謝確認 |
| /parent/grades | 育成級確認 |
| /parent/announcements | お知らせ |
