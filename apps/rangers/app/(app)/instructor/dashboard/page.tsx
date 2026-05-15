import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MOCK_LESSONS } from "@/lib/mock-data"

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
  const { data: dbUpcomingLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("instructor_id", user.id)
    .eq("status", "published")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5)

  // 予約数（自分のレッスンへの予約）
  const { count: dbBookingCount } = await supabase
    .from("bookings")
    .select("*, lesson:lessons!inner(*)", { count: "exact", head: true })
    .eq("lesson.instructor_id", user.id)
    .in("status", ["pending", "confirmed"])

  const isMock = (lessonCount ?? 0) === 0
  const upcomingLessons = isMock ? MOCK_LESSONS.slice(0, 3) : (dbUpcomingLessons ?? [])
  const bookingCount = isMock ? 5 : (dbBookingCount ?? 0)
  const displayLessonCount = isMock ? MOCK_LESSONS.length : (lessonCount ?? 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link href="/instructor/lessons/new">
          <Button>新しいレッスンを作成</Button>
        </Link>
      </div>

      {isMock && (
        <p className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-700 border border-amber-200">
          サンプルデータを表示しています。レッスンを作成すると実際のデータが表示されます。
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              レッスン数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{displayLessonCount}</p>
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
