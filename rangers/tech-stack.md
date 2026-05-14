# Rangers 技術スタック

## 採用技術一覧

| レイヤー | 技術 | 理由 | スコープ |
|---------|------|------|---------|
| フロントエンド | Next.js 15 (App Router) | SSR/ISR対応、SEOに強い、Vercelとの相性 | PoC〜 |
| スタイリング | Tailwind CSS + shadcn/ui | 開発速度重視。UIコンポーネントを再発明しない | PoC〜 |
| バックエンド | Next.js Server Actions / Route Handlers | フルスタック統一。API設計がシンプル | PoC〜 |
| DB | Supabase (PostgreSQL) | RLS・Auth・Storageをまとめて提供。Free プランで開始 | PoC〜 |
| 認証 | Supabase Auth | メール/パスワード + Google OAuth | PoC〜 |
| 決済（基本） | Stripe（テストモード） | スイマーの予約・決済UXを実現 | PoC〜 |
| 決済（送金） | Stripe Connect | 指導員への分配決済。本番運用に必要 | Phase 1〜 |
| ホスティング | Vercel | Next.js の公式ホスティング。CD自動化 | PoC〜 |
| バリデーション | Zod | TypeScript と相性良し。Server Actions での入力検証 | PoC〜 |
| モバイル対応 | PWA（Next.js）| Webアプリのままネイティブアプリ風に使える | PoC〜 |
| メール | Supabase → Resend | PoCは Supabase 標準メールで代替。Phase 1 で Resend に移行 | PoC〜 |
| ストレージ | Supabase Storage | メディアファイル管理 | Phase 2〜 |
| 状態管理 | Zustand（必要なら） | サーバーキャッシュは Next.js fetch で対応 | 必要になったら |

※ App Router に確定（2026-05-13）

## アーキテクチャ概要

```
[ブラウザ / スマホ]
        │
        ▼
[Vercel - Next.js App Router]
  ├── /app/(swimmer)/  ← スイマー向けページ
  ├── /app/(instructor)/  ← 指導員向けページ
  ├── /app/api/webhooks/stripe  ← Stripe Webhook
  └── Server Actions（フォーム処理・DB操作）
        │
        ├── Supabase (PostgreSQL)
        │     └── Row Level Security でロール制御
        ├── Supabase Auth
        ├── Supabase Storage（メディア）← Phase 2〜
        ├── Stripe（テストモード決済）← PoCはテストモードのみ
        ├── Stripe Connect（指導員への送金）← Phase 1〜
        └── Supabase メール（PoC）→ Resend（Phase 1〜）
```

## DB設計（概要）

### 主要テーブル

```sql
-- ユーザー（Supabase Auth と連携）
profiles (
  id uuid PK,
  role text, -- 'swimmer' | 'instructor' | 'admin'
  name text,
  avatar_url text,
  stripe_account_id text, -- 指導員のみ（Stripe Connect）
  created_at timestamptz
)

-- レッスン
lessons (
  id uuid PK,
  instructor_id uuid FK -> profiles,
  title text,
  description text,
  price integer, -- 円単位
  capacity integer,
  scheduled_at timestamptz,
  duration_minutes integer,
  location text,
  status text, -- 'draft' | 'published' | 'cancelled'
  created_at timestamptz
)

-- 予約
bookings (
  id uuid PK,
  lesson_id uuid FK -> lessons,
  swimmer_id uuid FK -> profiles,
  status text, -- 'pending' | 'confirmed' | 'cancelled'
  stripe_payment_intent_id text,
  created_at timestamptz
)

-- チーム
teams (
  id uuid PK,
  name text,
  coach_id uuid FK -> profiles,
  created_at timestamptz
)

-- チームメンバー
team_members (
  team_id uuid FK -> teams,
  swimmer_id uuid FK -> profiles,
  role text, -- 'member' | 'admin'
  joined_at timestamptz
)

-- 月謝（Phase 2〜）
monthly_fees (
  id uuid PK,
  team_id uuid FK -> teams,
  swimmer_id uuid FK -> profiles,
  amount integer,
  due_date date,
  status text, -- 'unpaid' | 'paid'
  stripe_payment_intent_id text,
  paid_at timestamptz
)
```

## 開発環境

```bash
# 必要なもの
- Node.js v20+
- pnpm
- Supabase CLI
- Stripe CLI（Webhook のローカルテスト）

# 環境変数
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=        # Phase 1〜（PoCでは不要）
```

## ディレクトリ構成（予定）

```
rangers/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (swimmer)/
│   │   ├── lessons/
│   │   ├── bookings/
│   │   └── profile/
│   ├── (instructor)/
│   │   ├── dashboard/
│   │   ├── lessons/
│   │   └── earnings/
│   └── api/
│       └── webhooks/
│           └── stripe/
├── components/
│   ├── ui/        ← shadcn/ui
│   ├── lesson/
│   ├── booking/
│   └── payment/
├── lib/
│   ├── supabase/
│   ├── stripe/
│   └── utils/
├── actions/       ← Server Actions
└── types/
```
