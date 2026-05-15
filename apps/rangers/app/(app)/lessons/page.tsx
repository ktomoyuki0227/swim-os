import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { LessonFilters } from "@/components/lesson/lesson-filters"
import { getLessonImage } from "@/lib/lesson-utils"
import { CalendarDays, MapPin, Clock, User, Search } from "lucide-react"
import type { LessonWithInstructor } from "@/types/database"

export const metadata: Metadata = {
  title: "レッスンを探す",
  description: "マスターズ水泳・個人指導のレッスンを検索・予約。日程や場所で絞り込んで、あなたにぴったりの指導員を見つけましょう。",
}

interface LessonsPageProps {
  searchParams: Promise<{ q?: string; sort?: string }>
}

function applyFilters(
  lessons: LessonWithInstructor[],
  q: string,
  sort: string
): LessonWithInstructor[] {
  let result = lessons

  if (q) {
    const lower = q.toLowerCase()
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(lower) ||
        l.location.toLowerCase().includes(lower)
    )
  }

  if (sort === "price_asc") {
    result = [...result].sort((a, b) => a.price - b.price)
  } else if (sort === "price_desc") {
    result = [...result].sort((a, b) => b.price - a.price)
  }

  return result
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const { q = "", sort = "date" } = await searchParams
  const supabase = await createClient()

  const { data: dbLessons } = await supabase
    .from("lessons")
    .select("*, instructor:profiles!instructor_id(id, name, avatar_url)")
    .eq("status", "published")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })

  const isMock = !dbLessons || dbLessons.length === 0
  const allLessons = (isMock ? MOCK_LESSONS : dbLessons) as LessonWithInstructor[]
  const lessons = applyFilters(allLessons, q, sort)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">レッスンを探す</h1>
      {isMock && (
        <p className="mb-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          サンプルデータを表示しています。実際のレッスンはSupabaseにデータを登録すると表示されます。
        </p>
      )}
      <Suspense>
        <LessonFilters />
      </Suspense>

      {lessons.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">
              {q ? `「${q}」に一致するレッスンはありません` : "現在公開中のレッスンはありません"}
            </p>
            {q && (
              <p className="text-sm text-muted-foreground">
                別のキーワードで検索してみてください
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{lessons.length}件のレッスン</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                <Card className="group overflow-hidden transition-all hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200">
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image
                      src={getLessonImage(lesson.title)}
                      alt={lesson.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-3 right-3">
                      <span className="rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold text-white shadow-sm">
                        ¥{lesson.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug">{lesson.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span>
                        {new Date(lesson.scheduled_at).toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span>{lesson.location}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-400" />
                        <span>{lesson.duration_minutes}分</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-blue-400" />
                        <span>{lesson.instructor?.name ?? "不明"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
