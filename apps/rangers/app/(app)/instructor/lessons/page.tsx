import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { CalendarDays, MapPin, Users, ChevronRight } from "lucide-react"

const statusLabels: Record<string, string> = {
  draft: "下書き",
  published: "公開中",
  cancelled: "キャンセル",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive"> = {
  draft: "secondary",
  published: "default",
  cancelled: "destructive",
}

export default async function InstructorLessonsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: dbLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false })

  const isMock = !dbLessons || dbLessons.length === 0
  const lessons = isMock ? MOCK_LESSONS : dbLessons

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">レッスン管理</h1>
        <Link href="/instructor/lessons/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      {isMock && (
        <p className="mb-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          サンプルデータを表示しています。レッスンを作成すると実際のデータが表示されます。
        </p>
      )}

      {lessons.length === 0 ? (
        <p className="text-muted-foreground">
          レッスンがありません。最初のレッスンを作成しましょう。
        </p>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/instructor/lessons/${lesson.id}`}
            >
              <Card className="group transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{lesson.title}</p>
                      <Badge variant={statusVariants[lesson.status]}>
                        {statusLabels[lesson.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-blue-400" />
                        {new Date(lesson.scheduled_at).toLocaleDateString("ja-JP", {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-400" />
                        {lesson.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-blue-400" />
                        定員{lesson.capacity}名
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-semibold">{lesson.price.toLocaleString()}円</p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
