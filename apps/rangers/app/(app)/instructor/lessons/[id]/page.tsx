import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LessonForm } from "@/components/lesson/lesson-form"
import { DeleteLessonButton } from "@/components/lesson/delete-lesson-button"

interface InstructorLessonDetailPageProps {
  params: Promise<{ id: string }>
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

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", id)
    .eq("instructor_id", user.id)
    .single()

  if (!lesson) {
    notFound()
  }

  // 予約者一覧
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, swimmer:profiles!swimmer_id(id, name, avatar_url)")
    .eq("lesson_id", id)
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: true })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm">
                    {booking.swimmer?.name ?? "不明"}
                  </span>
                  <Badge variant="secondary">{booking.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
