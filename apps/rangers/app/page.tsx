import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, CreditCard } from "lucide-react"

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,80 1440,64 L1440,120 L0,120 Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="absolute top-0 z-10 w-full">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-xl font-bold tracking-tight text-white">
            Rangers
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                ログイン
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-white text-slate-900 hover:bg-white/90"
              >
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pt-16 sm:min-h-[640px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, rgba(56,189,248,0.3) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(99,102,241,0.2) 0%, transparent 50%)",
          }}
        />

        <div className="relative z-[1] mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium tracking-widest uppercase text-blue-300 sm:text-base">
            Masters Swimming Platform
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            水泳レッスンを、
            <br />
            もっと自由に。
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            マスターズ水泳・個人指導のレッスン予約プラットフォーム。
            指導員と直接つながり、あなたのペースで上達しよう。
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full bg-blue-500 px-8 text-base hover:bg-blue-400 sm:w-auto"
              >
                レッスンを探す
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-slate-500 px-8 text-base text-slate-200 hover:bg-white/10 sm:w-auto"
              >
                指導員として登録
              </Button>
            </Link>
          </div>
        </div>

        <WaveIcon className="absolute bottom-0 left-0 w-full text-background" />
      </section>

      {/* Features */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-2xl font-bold sm:text-3xl">
            Rangers でできること
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
            指導員とスイマーをつなぐ、シンプルで使いやすいプラットフォーム
          </p>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <FeatureCard
              icon={<Search className="h-6 w-6" />}
              title="レッスンを見つける"
              description="日時・場所・指導員で検索。あなたにぴったりのレッスンを簡単に予約。"
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="レッスンを公開する"
              description="指導員として自由にレッスンを作成・公開。定員・料金・場所を自由に設定。"
            />
            <FeatureCard
              icon={<CreditCard className="h-6 w-6" />}
              title="安全なオンライン決済"
              description="Stripe による安全な決済。予約時に支払いが完了するのでトラブルなし。"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
            使い方
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-6 text-lg font-semibold text-blue-600">
                スイマーの方
              </h3>
              <ol className="space-y-4">
                <StepItem step={1} text="無料アカウントを作成" />
                <StepItem step={2} text="レッスンを検索・比較" />
                <StepItem step={3} text="オンラインで予約・決済" />
                <StepItem step={4} text="当日レッスンに参加" />
              </ol>
            </div>
            <div>
              <h3 className="mb-6 text-lg font-semibold text-blue-600">
                指導員の方
              </h3>
              <ol className="space-y-4">
                <StepItem step={1} text="指導員アカウントを作成" />
                <StepItem step={2} text="レッスンの内容・日時・料金を設定" />
                <StepItem step={3} text="公開して予約を受付" />
                <StepItem step={4} text="ダッシュボードで予約を管理" />
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            さっそく始めよう
          </h2>
          <p className="mb-8 text-muted-foreground">
            アカウント作成は無料。今すぐレッスンを探しましょう。
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-blue-500 px-8 text-base hover:bg-blue-400">
              無料で始める
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>Rangers - マスターズ水泳レッスン予約</p>
          <p>Powered by Groove House</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-500 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function StepItem({ step, text }: { step: number; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
        {step}
      </span>
      <span className="text-sm">{text}</span>
    </li>
  )
}
