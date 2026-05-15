import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function InstructorDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 自分のレッスン数
  const { count: lessonCount } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("instructor_id", user.id)

  // 今後のレッスン
  const { data: upcomingLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("instructor_id", user.id)
    .eq("status", "published")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5)

  // 予約数（自分のレッスンへの予約）
  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("*, lesson:lessons!inner(*)", { count: "exact", head: true })
    .eq("lesson.instructor_id", user.id)
    .in("status", ["pending", "confirmed"])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link href="/instructor/lessons/new">
          <Button>新しいレッスンを作成</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              レッスン数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lessonCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              予約数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bookingCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              今後のレッスン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {upcomingLessons?.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">直近のレッスン</h2>
        {!upcomingLessons || upcomingLessons.length === 0 ? (
          <p className="text-muted-foreground">
            今後のレッスンはありません。
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/instructor/lessons/${lesson.id}`}
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{lesson.title}</p>
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
    </div>
  )
}
