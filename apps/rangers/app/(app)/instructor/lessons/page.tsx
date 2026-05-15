import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">レッスン管理</h1>
        <Link href="/instructor/lessons/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      {!lessons || lessons.length === 0 ? (
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
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{lesson.title}</p>
                      <Badge variant={statusVariants[lesson.status]}>
                        {statusLabels[lesson.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lesson.scheduled_at).toLocaleDateString(
                        "ja-JP",
                        {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                      {" / "}
                      {lesson.location}
                      {" / "}
                      定員{lesson.capacity}名
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium">
                    {lesson.price.toLocaleString()}円
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
