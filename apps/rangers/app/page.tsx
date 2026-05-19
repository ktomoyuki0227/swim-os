import type React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Star, MapPin, ChevronRight, Shield, Users, Clock } from "lucide-react"
import Image from "next/image"
import type { Profile } from "@/types/database"

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,80 1440,64 L1440,120 L0,120 Z"
        fill="currentColor"
      />
    </svg>
  )
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-yellow-600">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count}件)</span>
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createClient()

  // 注目コーチ取得（口コミ数順）
  const { data: featuredInstructors } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "instructor")
    .order("review_count", { ascending: false })
    .limit(4)

  const instructors = (featuredInstructors ?? []) as Profile[]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="absolute top-0 z-10 w-full">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="text-xl font-bold tracking-tight text-white">Rangers</span>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/about" className="text-sm text-white/80 hover:text-white">
              Rangers とは
            </Link>
            <Link href="/price" className="text-sm text-white/80 hover:text-white">
              料金
            </Link>
            <Link href="/faq" className="text-sm text-white/80 hover:text-white">
              よくある質問
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                ログイン
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-white text-slate-900 hover:bg-white/90">
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pt-16 sm:min-h-[680px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, rgba(56,189,248,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(99,102,241,0.3) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-[1] mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-blue-300">
            Masters Swimming Platform
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            水泳を、
            <br />
            もっと楽しく上手に。
          </h1>
          <p className="mx-auto mb-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            元日本代表・プロコーチによるマンツーマン指導。
            <br />
            あなたの目標に合わせた、オーダーメイドのトレーニング。
          </p>
          <div className="mb-8 flex items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              400名以上のコーチ
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              99% 満足度
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              安心・安全
            </span>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/instructors">
              <Button size="lg" className="w-full bg-blue-500 px-8 text-base hover:bg-blue-400 sm:w-auto">
                コーチを探す
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-slate-500 px-8 text-base text-slate-200 hover:bg-white/10 sm:w-auto"
              >
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
        <WaveIcon className="absolute bottom-0 left-0 w-full text-background" />
      </section>

      {/* 注目コーチ */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">注目のコーチ</h2>
              <p className="mt-1 text-muted-foreground">実績豊富なトップコーチ陣</p>
            </div>
            <Link
              href="/instructors"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              すべて見る
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {instructors.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* サンプルカード */}
              {[
                { name: "田中 美咲", spec: "クロール・バタフライ", prefecture: "東京都", rating: 4.9, count: 32 },
                { name: "鈴木 健太", spec: "平泳ぎ・個人メドレー", prefecture: "大阪府", rating: 5.0, count: 28 },
                { name: "山田 由紀", spec: "子供水泳・初心者", prefecture: "神奈川県", rating: 4.8, count: 45 },
                { name: "中村 翔", spec: "マスターズ水泳", prefecture: "愛知県", rating: 4.9, count: 21 },
              ].map((coach) => (
                <Link key={coach.name} href="/instructors">
                  <div className="group rounded-xl border bg-card p-4 transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                      {coach.name[0]}
                    </div>
                    <p className="mb-1 font-semibold group-hover:text-blue-600">{coach.name} コーチ</p>
                    <StarRating rating={coach.rating} count={coach.count} />
                    <p className="mt-2 text-xs text-muted-foreground">{coach.spec}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {coach.prefecture}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {instructors.map((instructor) => (
                <Link key={instructor.id} href={`/instructors/${instructor.id}`}>
                  <div className="group rounded-xl border bg-card p-4 transition-all hover:border-blue-200 hover:shadow-md">
                    {instructor.avatar_url ? (
                      <Image
                        src={instructor.avatar_url}
                        alt={instructor.name}
                        width={64}
                        height={64}
                        className="mb-3 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                        {instructor.name[0]}
                      </div>
                    )}
                    <p className="mb-1 font-semibold group-hover:text-blue-600">{instructor.name} コーチ</p>
                    {instructor.review_count > 0 && (
                      <StarRating rating={instructor.rating_avg} count={instructor.review_count} />
                    )}
                    {instructor.specialties?.[0] && (
                      <p className="mt-2 text-xs text-muted-foreground">{instructor.specialties[0]}</p>
                    )}
                    {instructor.prefecture && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {instructor.prefecture}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 使い方 */}
      <section className="bg-muted/50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">かんたん3ステップ</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: 1,
                icon: "🔍",
                title: "コーチを探す",
                desc: "種目・地域・口コミから自分に合ったコーチを検索",
              },
              {
                step: 2,
                icon: "📅",
                title: "日程を選んで予約",
                desc: "カレンダーから希望の日時を選択。日程リクエストも可能",
              },
              {
                step: 3,
                icon: "🏊",
                title: "レッスン開始",
                desc: "コーチとマンツーマンで、上達を実感できる指導を受ける",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                  {icon}
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  Step {step}
                </div>
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 安心ポイント */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Rangers が選ばれる理由</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Star className="h-7 w-7" />,
                title: "厳選コーチ",
                desc: "元日本代表・プロ選手など実績豊富なコーチのみ在籍。指導力を厳格に審査。",
              },
              {
                icon: <Clock className="h-7 w-7" />,
                title: "自由な日程・場所",
                desc: "好きな時間・好きな場所でレッスン。カレンダー予約または日程リクエスト。",
              },
              {
                icon: <Shield className="h-7 w-7" />,
                title: "安心・安全",
                desc: "入会金・月会費0円。クレジットカード決済でお金のトラブルなし。",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-6 text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  {icon}
                </div>
                <h3 className="mb-2 font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            あなたにぴったりのコーチを見つけよう
          </h2>
          <p className="mb-8 text-blue-100">入会金・月会費は一切不要。今すぐ無料で始められます。</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/instructors">
              <Button size="lg" className="w-full bg-white px-8 text-blue-700 hover:bg-blue-50 sm:w-auto">
                コーチを探す
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white px-8 text-white hover:bg-white/10 sm:w-auto"
              >
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="mb-2 font-medium">Rangers</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">Rangers とは</Link></li>
                <li><Link href="/price" className="hover:text-foreground">料金</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">よくある質問</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">サービス</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/instructors" className="hover:text-foreground">コーチを探す</Link></li>
                <li><Link href="/lessons" className="hover:text-foreground">レッスン一覧</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium">コーチの方へ</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><Link href="/register" className="hover:text-foreground">コーチ登録</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <p>© 2025 Rangers — Groove House</p>
            <p>Powered by Groove House</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
