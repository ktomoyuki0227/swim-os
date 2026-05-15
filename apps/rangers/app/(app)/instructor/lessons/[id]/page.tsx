import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LessonForm } from "@/components/lesson/lesson-form"
import { DeleteLessonButton } from "@/components/lesson/delete-lesson-button"
import { ConfirmBookingButton } from "@/components/booking/confirm-booking-button"
import { ToggleStatusButton } from "@/components/lesson/toggle-status-button"
import { MOCK_LESSONS } from "@/lib/mock-data"

interface InstructorLessonDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: InstructorLessonDetailPageProps): Promise<Metadata> {
  const { id } = await params

  if (id.startsWith("mock-")) {
    const lesson = MOCK_LESSONS.find((l) => l.id === id)
    return { title: lesson ? `${lesson.title} - 編集` : "レッスン編集" }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("lessons")
    .select("title")
    .eq("id", id)
    .single()

  return { title: data ? `${data.title} - 編集` : "レッスン編集" }
}

export default async function InstructorLessonDetailPage({
  params,
}: InstructorLessonDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: dbLesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .eq("instructor_id", user.id)
    .single()

  const isMock = !dbLesson && id.startsWith("mock-")
  const lesson = dbLesson ?? (isMock ? MOCK_LESSONS.find((l) => l.id === id) : null)

  if (!lesson) {
    notFound()
  }

  // 予約者一覧（モックの場合はサンプルデータ）
  const { data: dbBookings } = isMock
    ? { data: null }
    : await supabase
        .from("bookings")
        .select("*, swimmer:profiles!swimmer_id(id, name, avatar_url)")
        .eq("lesson_id", id)
        .in("status", ["pending", "confirmed"])
        .order("created_at", { ascending: true })

  const mockBookings = isMock
    ? [
        { id: "mb-1", swimmer: { id: "s1", name: "山田 太郎", avatar_url: null }, status: "confirmed" },
        { id: "mb-2", swimmer: { id: "s2", name: "鈴木 花子", avatar_url: null }, status: "pending" },
      ]
    : null
  const bookings = dbBookings ?? mockBookings ?? []

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {isMock && (
        <p className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          これはサンプルデータです。実際のレッスンを作成すると編集・削除できます。
        </p>
      )}
      {/* 予約者一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>予約者一覧</span>
            <Badge variant="secondary">
              {bookings?.length ?? 0} / {lesson.capacity}名
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!bookings || bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              まだ予約者がいません。
            </p>
          ) : (
            <ul className="space-y-2">
              {bookings.map((booking) => {
                const name = booking.swimmer?.name ?? "不明"
                const initials = name.replace(/\s/g, "").slice(0, 2)
                return (
                  <li
                    key={booking.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                        {initials}
                      </span>
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === "pending" && !isMock ? (
                        <ConfirmBookingButton bookingId={booking.id} />
                      ) : (
                        <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                          {booking.status === "confirmed" ? "確定" : booking.status === "pending" ? "確認待ち" : booking.status}
                        </Badge>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {!isMock && (
        <>
          {/* 公開・下書き切り替え */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">公開ステータス</p>
              <p className="text-xs text-muted-foreground">
                {lesson.status === "published" ? "現在公開中です" : "現在は非公開（下書き）です"}
              </p>
            </div>
            <ToggleStatusButton lessonId={lesson.id} currentStatus={lesson.status} />
          </div>

          {/* レッスン編集 */}
          <Card>
            <CardHeader>
              <CardTitle>レッスンを編集</CardTitle>
            </CardHeader>
            <CardContent>
              <LessonForm lesson={lesson} />
            </CardContent>
          </Card>

          <Separator />

          <DeleteLessonButton lessonId={lesson.id} />
        </>
      )}
    </div>
  )
}
