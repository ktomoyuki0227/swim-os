import Link from "next/link"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { LessonFilters } from "@/components/lesson/lesson-filters"
import type { LessonWithInstructor } from "@/types/database"

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
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-700 border border-amber-200">
          サンプルデータを表示しています。実際のレッスンはSupabaseにデータを登録すると表示されます。
        </p>
      )}
      <Suspense>
        <LessonFilters />
      </Suspense>
      {lessons.length === 0 ? (
        <p className="text-muted-foreground">
          {q ? `「${q}」に一致するレッスンはありません。` : "現在公開中のレッスンはありません。"}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <Badge variant="secondary">
                      {lesson.price.toLocaleString()}円
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {new Date(lesson.scheduled_at).toLocaleDateString("ja-JP", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>{lesson.location}</p>
                  <p>{lesson.duration_minutes}分</p>
                  <p>指導員: {lesson.instructor?.name ?? "不明"}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
