# SchoolBoost AI 技術スタック

## 採用技術一覧

| レイヤー | 技術 | 理由 |
|---------|------|------|
| フロントエンド | Next.js 15 (App Router) | SSR/ISR対応。管理画面のSEO不要部分はCSR |
| スタイリング | Tailwind CSS + shadcn/ui | 開発速度重視 |
| バックエンド | Next.js Server Actions / Route Handlers | フルスタック統一 |
| DB | Supabase (PostgreSQL) | マルチロール対応のRLS。Auth・Storage付属 |
| 認証 | Supabase Auth + LINE Login | 保護者はLINEログインがUX的に優秀 |
| 決済 | Stripe Subscriptions | 月謝の定期自動課金。Payment Intent ではなく Subscriptions を使う（Stripe が毎月自動で保護者に課金） |
| ストレージ | Supabase Storage | 会員証・お知らせ添付ファイル |
| ホスティング | Vercel | |
| メール | Supabase → Resend | PoCは Supabase 標準メールで代替。Phase 1 で Resend に移行 |
| LINE通知 | LINE Messaging API | お知らせ・欠席連絡・月謝リマインド |
| バリデーション | Zod | |

## アーキテクチャ概要

```
[保護者：スマホ（LINE / ブラウザ）]     [管理者・コーチ：PC（ブラウザ）]
              │                                      │
              ▼                                      ▼
     [Vercel - Next.js App Router]
       ├── /app/(parent)/    ← 保護者向けポータル
       ├── /app/(admin)/     ← 管理者・コーチ向け管理画面
       ├── /app/(public)/    ← 体験・入会申し込みフォーム（外部公開）
       ├── /app/api/webhooks/stripe
       └── /app/api/webhooks/line
              │
              ├── Supabase (PostgreSQL + RLS)
              ├── Supabase Auth（メール + LINEログイン）
              ├── Supabase Storage
              ├── Stripe（月謝決済）
              ├── LINE Messaging API（通知・欠席受付）
              └── Supabase メール（PoC）→ Resend（Phase 1〜）
```

## DB設計（概要）

### 主要テーブル

```sql
-- スクール（マルチテナント対応）
schools (
  id uuid PK,
  name text,
  created_at timestamptz
)

-- ユーザー
profiles (
  id uuid PK,
  school_id uuid FK -> schools,  -- マルチテナント
  role text, -- 'admin' | 'coach' | 'parent'
  name text,
  email text,
  line_user_id text,
  created_at timestamptz
)

-- 会員（子ども）
members (
  id uuid PK,
  school_id uuid FK -> schools,  -- マルチテナント
  parent_id uuid FK -> profiles,
  name text,
  name_kana text,
  birth_date date,
  gender text,
  emergency_contact text,
  health_notes text,
  status text, -- 'active' | 'suspended' | 'withdrawn'
  qr_code text, -- 会員証QRコード
  created_at timestamptz
)

-- クラス定義
classes (
  id uuid PK,
  school_id uuid FK -> schools,  -- マルチテナント
  name text,
  level_min integer,  -- 対象級（下限）
  level_max integer,  -- 対象級（上限）
  coach_id uuid FK -> profiles,
  capacity integer,
  created_at timestamptz
)

-- スケジュール（定期開催）
schedules (
  id uuid PK,
  class_id uuid FK -> classes,
  day_of_week integer, -- 0=日〜6=土
  start_time time,
  end_time time,
  is_active boolean
)

-- クラス在籍
enrollments (
  id uuid PK,
  member_id uuid FK -> members,
  class_id uuid FK -> classes,
  enrolled_at timestamptz,
  status text -- 'active' | 'suspended'
)

-- 出席記録
attendance_records (
  id uuid PK,
  member_id uuid FK -> members,
  schedule_id uuid FK -> schedules,
  lesson_date date,
  status text, -- 'present' | 'absent' | 'makeup'
  substitute_lesson_id uuid, -- 振替先
  created_at timestamptz
)

-- 月謝
monthly_fees (
  id uuid PK,
  member_id uuid FK -> members,
  amount integer,
  target_month date,
  status text, -- 'unpaid' | 'paid'
  stripe_subscription_id text, -- Stripe Subscriptions を使用
  paid_at timestamptz
)

-- お知らせ
announcements (
  id uuid PK,
  school_id uuid FK -> schools,  -- マルチテナント
  title text,
  body text,
  target text, -- 'all' | class_id
  published_at timestamptz,
  created_by uuid FK -> profiles
)

-- 育成級定義
grade_levels (
  id uuid PK,
  school_id uuid FK -> schools,  -- マルチテナント（スクールごとに級の定義が異なる）
  level integer,
  name text,
  description text,
  criteria jsonb -- 評価基準
)

-- 昇級記録
grade_histories (
  id uuid PK,
  member_id uuid FK -> members,
  from_level integer,
  to_level integer,
  evaluated_by uuid FK -> profiles,
  evaluated_at timestamptz
)

-- 入会申し込み
applications (
  id uuid PK,
  school_id uuid FK -> schools,  -- マルチテナント
  child_name text,
  parent_name text,
  parent_email text,
  parent_phone text,
  preferred_class text,
  status text, -- 'pending' | 'contacted' | 'enrolled' | 'declined'
  created_at timestamptz
)
```

## 開発環境

```bash
# 必要なもの
- Node.js v20+
- pnpm
- Supabase CLI
- Stripe CLI
- LINE Developers アカウント（Messaging API チャネル）

# 環境変数
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=        # Phase 1〜（PoCでは不要）
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID=
```

## ディレクトリ構成（予定）

```
school-boost/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── line-callback/
│   ├── (admin)/          ← 管理者・コーチ
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── schedules/
│   │   ├── attendance/
│   │   ├── fees/
│   │   ├── announcements/
│   │   ├── grades/
│   │   └── applications/
│   ├── (parent)/         ← 保護者
│   │   ├── mypage/
│   │   ├── absence/
│   │   ├── fees/
│   │   └── grades/
│   ├── (public)/         ← 外部公開
│   │   └── apply/
│   └── api/
│       └── webhooks/
│           ├── stripe/
│           └── line/
├── components/
│   ├── ui/
│   ├── member/
│   ├── attendance/
│   ├── grade/
│   └── fee/
├── lib/
│   ├── supabase/
│   ├── stripe/
│   ├── line/
│   └── utils/
├── actions/
└── types/
```
