import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Star, MapPin, ChevronRight, Shield, Users, Clock, Calendar } from "lucide-react"
import type { Profile, LessonWithInstructor } from "@/types/database"

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
      {count > 0 && <span className="text-xs text-muted-foreground">({count}件)</span>}
    </div>
  )
}

function formatLessonDate(dateStr: string) {
  const d = new Date(dateStr)
  const weekdays = "日月火水木金土"
  const mm = d.getMonth() + 1
  const dd = d.getDate()
  const day = weekdays[d.getDay()]
  const hh = d.getHours().toString().padStart(2, "0")
  const min = d.getMinutes().toString().padStart(2, "0")
  return `${mm}月${dd}日（${day}）${hh}:${min}〜`
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: groupLessonsRaw }, { data: newCoachesRaw }, { data: newReviewsRaw }] =
    await Promise.all([
      // 開催予定グループレッスン（直近3件）
      supabase
        .from("lessons")
        .select(
          "*, instructor:profiles!instructor_id(id, name, avatar_url, rating_avg, review_count)",
        )
        .eq("status", "published")
        .eq("lesson_type", "group")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3),

      // 新着コーチ（最新6名）
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "instructor")
        .order("created_at", { ascending: false })
        .limit(6),

      // 新着口コミ（最新5件）
      supabase
        .from("reviews")
        .select(
          "id, rating, comment, created_at, reviewer:profiles!reviewer_id(name), instructor:profiles!instructor_id(name)",
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  const groupLessons = (groupLessonsRaw ?? []) as LessonWithInstructor[]
  const newCoaches = (newCoachesRaw ?? []) as Profile[]
  type ReviewRow = {
    id: string
    rating: number
    comment: string | null
    created_at: string
    reviewer: { name: string } | null
    instructor: { name: string } | null
  }
  const newReviews = (newReviewsRaw ?? []).map((r) => ({
    ...r,
    reviewer: Array.isArray(r.reviewer) ? (r.reviewer[0] ?? null) : r.reviewer,
    instructor: Array.isArray(r.instructor) ? (r.instructor[0] ?? null) : r.instructor,
  })) as ReviewRow[]

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-sky-100" style={{ minHeight: "420px" }}>
        {/* 右半分に水泳選手の画像（絶対配置・右50%カバー） */}
        <div className="absolute right-0 top-0 h-full w-[58%] sm:w-[54%]">
          <Image
            src="/images/lp/hero-swimmer-portrait.jpg"
            alt="マスターズスイマーのレッスン風景"
            fill
            className="object-cover object-[40%_center]"
            priority
          />
          {/* 左端をグラデーションでフェードさせ背景と馴染ませる */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-sky-100/50 to-transparent" />
        </div>

        {/* デコレーション：浮遊する幾何学シェイプ */}
        {/* 左側 */}
        <div className="pointer-events-none absolute left-[4%] top-[14%] h-14 w-14 rounded-full bg-white/60" />
        <div className="pointer-events-none absolute left-[9%] top-[64%] h-9 w-9 rounded-full bg-sky-300/50" />
        <div className="pointer-events-none absolute left-[2%] top-[46%] h-6 w-6 rounded-full bg-white/70" />
        {/* 左側 斜め線 */}
        <svg className="pointer-events-none absolute left-[14%] top-[6%] h-28 w-28 opacity-25" viewBox="0 0 100 100" aria-hidden="true">
          <line x1="0" y1="25" x2="75" y2="100" stroke="white" strokeWidth="3.5" />
          <line x1="12" y1="5" x2="87" y2="80" stroke="white" strokeWidth="3.5" />
          <line x1="24" y1="0" x2="99" y2="75" stroke="white" strokeWidth="3.5" />
        </svg>
        {/* 左下 小三角 */}
        <svg className="pointer-events-none absolute bottom-[22%] left-[5%] h-7 w-7 opacity-80" viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 22,20 2,20" fill="#FCD34D" />
        </svg>
        <svg className="pointer-events-none absolute bottom-[14%] left-[16%] h-5 w-5 opacity-70" viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 22,20 2,20" fill="#38BDF8" />
        </svg>
        {/* 右端シェイプ（画像の後ろ） */}
        <div className="pointer-events-none absolute right-[3%] top-[10%] h-5 w-5 rounded-full bg-sky-400/60" />
        <svg className="pointer-events-none absolute right-[7%] top-[18%] h-6 w-6 opacity-80" viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 22,20 2,20" fill="#FB923C" />
        </svg>
        <svg className="pointer-events-none absolute right-[12%] bottom-[20%] h-20 w-20 opacity-20" viewBox="0 0 100 100" aria-hidden="true">
          <line x1="0" y1="25" x2="75" y2="100" stroke="#0EA5E9" strokeWidth="3.5" />
          <line x1="12" y1="5" x2="87" y2="80" stroke="#0EA5E9" strokeWidth="3.5" />
          <line x1="24" y1="0" x2="99" y2="75" stroke="#0EA5E9" strokeWidth="3.5" />
        </svg>
        <svg className="pointer-events-none absolute right-[4%] bottom-[30%] h-5 w-5 opacity-80" viewBox="0 0 24 24" aria-hidden="true">
          <polygon points="12,2 22,20 2,20" fill="#FCD34D" />
        </svg>
        {/* 半月シェイプ */}
        <svg className="pointer-events-none absolute bottom-[18%] left-[22%] h-10 w-10 opacity-60" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20,5 A15,15 0 0,1 20,35 A15,15 0 0,0 20,5 Z" fill="#FDBA74" />
        </svg>
        <svg className="pointer-events-none absolute right-[15%] top-[12%] h-8 w-8 opacity-60" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M20,5 A15,15 0 0,1 20,35 A15,15 0 0,0 20,5 Z" fill="#38BDF8" />
        </svg>

        {/* テキストコンテンツ（左50%内で中央揃え） */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex min-h-[400px] items-center py-14 sm:min-h-[460px] sm:py-20">
            {/* 左50%ゾーン・コンテンツを中央に寄せる */}
            <div className="flex w-1/2 justify-center">
              <div className="w-full max-w-xs sm:max-w-sm">
                <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700">
                  マスターズ水泳専門
                </p>
                <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                  水泳の個人指導なら
                  <br />
                  <span className="text-blue-600">Rangers</span>
                </h1>
                <p className="mb-6 text-sm leading-relaxed text-slate-600 sm:text-base">
                  元日本代表・プロコーチによる
                  <br />
                  マンツーマン指導。
                  <br />
                  マスターズスイマーの目標に
                  <br />
                  寄り添います。
                </p>
                <Link href="/instructors" className="block">
                  <Button
                    size="lg"
                    className="w-full bg-blue-500 py-6 text-base font-bold hover:bg-blue-600 sm:text-lg"
                  >
                    まずは無料で体験する
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 下部ウェーブ（次セクションへの自然な接続） */}
        <div className="absolute bottom-0 left-0 w-full leading-none">
          <svg
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
            className="h-10 w-full sm:h-14"
            aria-hidden="true"
          >
            <path
              d="M0,28 C240,56 480,0 720,28 C960,56 1200,14 1440,28 L1440,56 L0,56 Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ===== RANGERS とは？ ===== */}
      <section className="py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Rangers とは？</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              コーチとスイマーをつなぐ、マスターズ水泳専門のマッチングプラットフォーム
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "🏊",
                title: "個人コーチ",
                desc: "あなたの課題・目標に合わせた完全マンツーマン指導。スケジュールも自由に設定できます。",
                href: "/instructors",
                linkText: "コーチを探す",
              },
              {
                icon: "👥",
                title: "グループレッスン",
                desc: "仲間と一緒に楽しく上達。少人数制で丁寧な指導を受けながら、モチベーションも維持できます。",
                href: "/instructors",
                linkText: "レッスンを見る",
              },
              {
                icon: "🏆",
                title: "マスターズ特化",
                desc: "年齢を重ねた身体に合わせた指導が得意なコーチが多数在籍。競技から趣味まで幅広く対応。",
                href: "/about",
                linkText: "詳しく見る",
              },
            ].map(({ icon, title, desc, href, linkText }) => (
              <div key={title} className="rounded-xl border bg-card p-6 transition hover:shadow-md">
                <div className="mb-4 text-3xl">{icon}</div>
                <h3 className="mb-2 text-lg font-bold">{title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <Link href={href} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                  {linkText} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 人気のご利用シーン ===== */}
      <section className="bg-blue-50 py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">人気のご利用シーン</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg">
              <div className="relative h-52">
                <Image
                  src="/images/lp/usecase-individual.jpg"
                  alt="マンツーマン指導の様子"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <span className="mb-2 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
                  マンツーマン指導
                </span>
                <h3 className="mb-2 font-bold leading-snug">
                  「タイムを縮めたい！」に応える個人指導
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  自分のペースで弱点を徹底克服。コーチとの1対1の対話で、確実なレベルアップを実感できます。
                </p>
                <Link href="/instructors" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                  コーチを探す <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg">
              <div className="relative h-52">
                <Image
                  src="/images/lp/usecase-group.jpg"
                  alt="グループレッスンの様子"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <span className="mb-2 inline-block rounded-full bg-sky-100 px-3 py-0.5 text-xs font-medium text-sky-700">
                  グループレッスン
                </span>
                <h3 className="mb-2 font-bold leading-snug">
                  仲間と一緒に楽しく続けるグループレッスン
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  同じ目標を持つ仲間と切磋琢磨。初心者から上級者まで、レベル別のクラスが充実しています。
                </p>
                <Link href="/instructors" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                  レッスンを探す <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 開催予定グループレッスン ===== */}
      <section className="py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">開催予定のグループレッスン</h2>
              <p className="mt-1 text-sm text-muted-foreground">直近の開催スケジュール</p>
            </div>
            <Link href="/instructors" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              すべて見る <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {groupLessons.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              現在公開中のグループレッスンはありません
            </div>
          ) : (
            <div className="space-y-3">
              {groupLessons.map((lesson) => {
                const instructor = lesson.instructor as Pick<Profile, "id" | "name" | "avatar_url" | "rating_avg" | "review_count">
                return (
                  <Link key={lesson.id} href={`/instructors/${lesson.instructor_id}`}>
                    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition hover:border-blue-200 hover:shadow-sm">
                      <div className="hidden shrink-0 sm:flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                        {instructor?.name?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                            グループ
                          </span>
                          {lesson.target_level && (
                            <span className="rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                              {lesson.target_level}
                            </span>
                          )}
                          {lesson.specialty && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {lesson.specialty}
                            </span>
                          )}
                        </div>
                        <p className="truncate font-medium">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{instructor?.name} コーチ</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatLessonDate(lesson.scheduled_at)}
                        </div>
                        <p className="text-sm font-semibold text-blue-600">
                          ¥{lesson.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/instructors">
              <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                グループレッスンをもっと見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA バナー ===== */}
      <section className="bg-slate-800 py-10 px-4">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500 text-2xl">
              🏊
            </div>
            <div>
              <p className="text-xs text-slate-400">コーチ選びに困ったら...</p>
              <p className="font-bold text-white sm:text-lg">
                Rangers があなたに合った
                <br className="sm:hidden" />
                コーチをご提案します
              </p>
            </div>
          </div>
          <Link href="/instructors">
            <Button size="lg" className="whitespace-nowrap bg-blue-500 px-8 hover:bg-blue-400">
              コーチを探してみる ›
            </Button>
          </Link>
        </div>
      </section>

      {/* ===== よくある質問 ===== */}
      <section className="bg-muted/30 py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">よくある質問</h2>
          <div className="space-y-2">
            {[
              {
                q: "予約方法について",
                a: "コーチのプロフィールページから希望日時を選択して予約できます。日程が合わない場合はスケジュールリクエスト機能もご利用いただけます。",
              },
              {
                q: "予約は何日前まで可能ですか？",
                a: "コーチによって異なります。直前予約に対応しているコーチもいますので、プロフィールページの空き状況をご確認ください。",
              },
              {
                q: "お支払い方法について",
                a: "クレジットカード（Visa / Mastercard / American Express）がご利用いただけます。代金は予約確定時に決済されます。",
              },
              {
                q: "会員登録は必要ですか？",
                a: "無料会員登録が必要です。入会金・月会費は一切不要。登録は1〜2分で完了します。",
              },
              {
                q: "ログインできない場合は？",
                a: "ご登録のメールアドレスで届いたリンクからログインするか、パスワードをお忘れの場合はログイン画面の「パスワードを忘れた方」からリセットできます。",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border bg-card">
                <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium">
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      Q
                    </span>
                    {q}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="mr-2 font-bold text-blue-600">A.</span>
                  {a}
                </div>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            その他のご質問は{" "}
            <Link href="/faq" className="text-blue-600 hover:underline">
              よくある質問ページ
            </Link>{" "}
            をご覧ください
          </p>
        </div>
      </section>

      {/* ===== 新着コーチ ===== */}
      <section className="py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">新着コーチ</h2>
              <p className="mt-1 text-sm text-muted-foreground">新たに登録されたコーチ陣</p>
            </div>
            <Link href="/instructors" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              すべて見る <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {newCoaches.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              現在登録中のコーチはいません
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newCoaches.map((coach) => (
                <Link key={coach.id} href={`/instructors/${coach.id}`}>
                  <div className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition hover:border-blue-200 hover:shadow-sm">
                    {coach.avatar_url ? (
                      <Image
                        src={coach.avatar_url}
                        alt={coach.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                        {coach.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium group-hover:text-blue-600">
                        {coach.name} コーチ
                      </p>
                      {coach.review_count > 0 && (
                        <StarRating rating={coach.rating_avg} count={coach.review_count} />
                      )}
                      {coach.specialties?.[0] && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {coach.specialties[0]}
                        </p>
                      )}
                      {coach.prefecture && (
                        <p className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {coach.prefecture}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 新着の口コミ ===== */}
      {newReviews.length > 0 && (
        <section className="bg-muted/30 py-16 px-4 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-2xl font-bold sm:text-3xl">新着の口コミ</h2>
            <div className="space-y-3">
              {newReviews.map((review) => (
                <div key={review.id} className="rounded-xl border bg-card p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <StarRating rating={review.rating} count={0} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.reviewer?.name ?? "匿名"} さん → {review.instructor?.name ?? ""} コーチ
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-700">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Rangers が選ばれる理由 ===== */}
      <section className="py-16 px-4 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Rangers が選ばれる理由</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Star className="h-7 w-7" />,
                title: "厳選コーチ",
                desc: "元日本代表・プロ選手など実績豊富なコーチのみ在籍。指導力を厳格に審査しています。",
              },
              {
                icon: <Clock className="h-7 w-7" />,
                title: "自由な日程・場所",
                desc: "好きな時間・好きな場所でレッスン。カレンダー予約または日程リクエストで柔軟に対応。",
              },
              {
                icon: <Shield className="h-7 w-7" />,
                title: "安心・安全",
                desc: "入会金・月会費0円。クレジットカード決済でお金のトラブルなし。",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-card p-6 text-center">
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

      {/* ===== 最終 CTA ===== */}
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
                className="w-full border-white/60 px-8 text-white hover:bg-white/10 sm:w-auto"
              >
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
