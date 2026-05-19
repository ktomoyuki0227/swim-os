import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  Star, MapPin, CalendarDays, Clock, Users, ChevronRight,
  MessageCircle, Trophy, BookOpen
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import type { Profile, LessonWithInstructor, ReviewWithReviewer } from "@/types/database"
import { ScheduleRequestDialog } from "@/components/instructor/schedule-request-dialog"

interface InstructorPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: InstructorPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("name, bio").eq("id", id).single()
  if (!data) return {}
  return {
    title: `${data.name} コーチ`,
    description: data.bio ?? `${data.name}コーチのプロフィールページ`,
  }
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-5 w-5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-lg font-bold text-yellow-600">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({count}件の口コミ)</span>
    </div>
  )
}

function ReviewCard({ review }: { review: ReviewWithReviewer }) {
  return (
    <div className="space-y-2 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.reviewer.avatar_url ? (
            <Image
              src={review.reviewer.avatar_url}
              alt={review.reviewer.name}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {review.reviewer.name[0]}
            </div>
          )}
          <span className="text-sm font-medium">{review.reviewer.name}</span>
        </div>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {new Date(review.created_at).toLocaleDateString("ja-JP")}
      </p>
    </div>
  )
}

export default async function InstructorProfilePage({ params }: InstructorPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: instructor },
    { data: lessons },
    { data: reviews },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("role", "instructor").single(),
    supabase
      .from("lessons")
      .select("*, instructor:profiles!instructor_id(id, name, avatar_url, rating_avg, review_count)")
      .eq("instructor_id", id)
      .eq("status", "published")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(6),
    supabase
      .from("reviews")
      .select("*, reviewer:profiles!reviewer_id(id, name, avatar_url)")
      .eq("instructor_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.auth.getUser(),
  ])

  if (!instructor) notFound()

  const profile = instructor as Profile
  const lessonList = (lessons ?? []) as LessonWithInstructor[]
  const reviewList = (reviews ?? []) as ReviewWithReviewer[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* プロフィールヘッダー */}
      <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* アバター */}
          <div className="shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.name}
                width={120}
                height={120}
                className="rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-blue-100 text-5xl font-bold text-blue-600 shadow-md">
                {profile.name[0]}
              </div>
            )}
          </div>

          {/* 基本情報 */}
          <div className="flex-1">
            <h1 className="mb-1 text-2xl font-bold">{profile.name} コーチ</h1>

            {profile.review_count > 0 && (
              <div className="mb-3">
                <StarRating rating={profile.rating_avg} count={profile.review_count} />
              </div>
            )}

            {profile.prefecture && (
              <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.prefecture} 活動</span>
              </div>
            )}

            {profile.specialties && profile.specialties.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {profile.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {profile.bio && (
              <p className="text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
          </div>

          {/* アクションボタン */}
          {user && user.id !== profile.id && (
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <ScheduleRequestDialog instructorId={profile.id} instructorName={profile.name} />
              <Link href={`/messages/${profile.id}`}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                  <MessageCircle className="h-4 w-4" />
                  メッセージ
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* 経歴・実績 */}
          {(profile.career || profile.achievements) && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <Trophy className="h-5 w-5 text-yellow-500" />
                経歴・実績
              </h2>
              <div className="rounded-xl border bg-card p-5 space-y-4">
                {profile.career && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      経歴
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.career}</p>
                  </div>
                )}
                {profile.career && profile.achievements && <Separator />}
                {profile.achievements && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      実績
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.achievements}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 対象 */}
          {profile.target_ages && profile.target_ages.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold">指導対象</h2>
              <div className="flex flex-wrap gap-2">
                {profile.target_ages.map((age) => (
                  <span
                    key={age}
                    className="rounded-lg border bg-muted px-3 py-1.5 text-sm"
                  >
                    {age}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 口コミ */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Star className="h-5 w-5 text-yellow-400" />
                口コミ・評価
                {profile.review_count > 0 && (
                  <span className="text-base font-normal text-muted-foreground">
                    ({profile.review_count}件)
                  </span>
                )}
              </h2>
            </div>

            {reviewList.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                まだ口コミはありません
              </div>
            ) : (
              <div className="space-y-3">
                {reviewList.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* サイドバー: レッスン一覧 */}
        <aside>
          <div className="sticky top-4">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-blue-500" />
              受付中のレッスン
            </h2>

            {lessonList.length === 0 ? (
              <div className="rounded-xl border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                現在予定されているレッスンはありません
              </div>
            ) : (
              <div className="space-y-3">
                {lessonList.map((lesson) => (
                  <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                    <div className="group rounded-xl border bg-card p-4 transition-all hover:border-blue-200 hover:shadow-md">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug group-hover:text-blue-600">
                          {lesson.title}
                        </p>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(lesson.scheduled_at).toLocaleDateString("ja-JP", {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration_minutes}分
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {lesson.lesson_type === "group" ? "グループ" : "個人"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white">
                          ¥{lesson.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
