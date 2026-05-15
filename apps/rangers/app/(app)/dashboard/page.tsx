import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { bookingStatusLabels, bookingStatusVariants } from "@/lib/lesson-utils"
import { CalendarDays, MapPin, BookOpen, CalendarCheck, ChevronRight } from "lucide-react"

export const metadata: Metadata = {
  title: "ダッシュボード",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // 指導員はそちらのダッシュボードへ
  if (profile?.role === "instructor") {
    redirect("/instructor/dashboard")
  }

  // スイマー向けダッシュボード
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("*, lesson:lessons(*)")
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  const activeBookings = (allBookings ?? []).filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  )

  // 今後のレッスン（確定・確認待ちで scheduled_at が未来のもの）
  const now = new Date().toISOString()
  const upcomingBookings = activeBookings
    .filter((b) => b.lesson && b.lesson.scheduled_at > now)
    .sort((a, b) =>
      new Date(a.lesson!.scheduled_at).getTime() - new Date(b.lesson!.scheduled_at).getTime()
    )
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* 統計 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">予約中のレッスン</CardTitle>
            <CalendarCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeBookings.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">受付中・確定済み</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今後のレッスン</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingBookings.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">これから参加するレッスン</p>
          </CardContent>
        </Card>
      </div>

      {/* 直近のレッスン */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">直近の予約</h2>
          {activeBookings.length > 0 && (
            <Link href="/bookings" className="text-sm text-blue-600 hover:underline underline-offset-4">
              すべて見る
            </Link>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">予約中のレッスンはありません</p>
            <Link href="/lessons" className="mt-3 inline-block text-sm text-blue-600 underline underline-offset-4">
              レッスンを探す
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Link key={booking.id} href={`/lessons/${booking.lesson!.id}`}>
                <Card className="group transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{booking.lesson!.title}</p>
                        <Badge variant={bookingStatusVariants[booking.status]} className="shrink-0">
                          {bookingStatusLabels[booking.status]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-blue-400" />
                          {new Date(booking.lesson!.scheduled_at).toLocaleDateString("ja-JP", {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-blue-400" />
                          {booking.lesson!.location}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* レッスン探すCTA */}
      <div className="rounded-xl bg-blue-50 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">新しいレッスンを探す</p>
              <p className="text-xs text-muted-foreground">今後のレッスンを検索して予約しましょう</p>
            </div>
          </div>
          <Link href="/lessons">
            <Button size="sm" className="shrink-0">
              レッスンを探す
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
