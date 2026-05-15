import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function LessonsPage() {
  const supabase = await createClient()

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*, instructor:profiles!instructor_id(id, name, avatar_url)")
    .eq("status", "published")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">レッスンを探す</h1>
      {!lessons || lessons.length === 0 ? (
        <p className="text-muted-foreground">
          現在公開中のレッスンはありません。
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
                  <p>
                    指導員: {lesson.instructor?.name ?? "不明"}
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
