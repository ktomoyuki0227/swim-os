import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { BookOpen, CalendarCheck, Clock, TrendingUp, ChevronRight } from "lucide-react"

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

  // 今月の売上（確定済み予約 × レッスン料金）
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: confirmedBookings } = await supabase
    .from("bookings")
    .select("lesson:lessons!inner(price, instructor_id)")
    .eq("status", "confirmed")
    .gte("created_at", startOfMonth.toISOString())

  const monthlyRevenue = confirmedBookings
    ?.filter((b) => {
      const lesson = Array.isArray(b.lesson) ? b.lesson[0] : b.lesson
      return lesson?.instructor_id === user.id
    })
    .reduce((sum, b) => {
      const lesson = Array.isArray(b.lesson) ? b.lesson[0] : b.lesson
      return sum + (lesson?.price ?? 0)
    }, 0) ?? 0

  const isMock = (lessonCount ?? 0) === 0
  const upcomingLessons = isMock ? MOCK_LESSONS.slice(0, 3) : (dbUpcomingLessons ?? [])
  const bookingCount = isMock ? 5 : (dbBookingCount ?? 0)
  const displayLessonCount = isMock ? MOCK_LESSONS.length : (lessonCount ?? 0)
  const displayRevenue = isMock ? 18500 : monthlyRevenue

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link href="/instructor/lessons/new">
          <Button>新しいレッスンを作成</Button>
        </Link>
      </div>

      {isMock && (
        <p className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          サンプルデータを表示しています。レッスンを作成すると実際のデータが表示されます。
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              レッスン数
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{displayLessonCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">作成済みレッスン</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              予約数
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bookingCount ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">受付中・確定済み</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今後のレッスン
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {upcomingLessons?.length ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">予定されているレッスン</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              今月の売上
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ¥{displayRevenue.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">確定済み予約の合計</p>
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
                <Card className="group transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1">
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
                        {" · "}
                        {lesson.location}
                      </p>
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
    </div>
  )
}
