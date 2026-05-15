import Image from "next/image"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookingButton } from "@/components/booking/booking-button"
import { MOCK_LESSONS } from "@/lib/mock-data"

function getLessonImage(title: string): string {
  if (title.includes("子ども") || title.includes("キッズ")) {
    return "/images/lessons/children.jpg"
  }
  if (title.includes("バタフライ") || title.includes("背泳ぎ")) {
    return "/images/lessons/butterfly.jpg"
  }
  if (title.includes("平泳ぎ")) {
    return "/images/lessons/breaststroke.jpg"
  }
  return "/images/lessons/crawl.jpg"
}

interface LessonDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LessonDetailPage({
  params,
}: LessonDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: dbLesson } = await supabase
    .from("lessons")
    .select("*, instructor:profiles!instructor_id(id, name, avatar_url)")
    .eq("id", id)
    .eq("status", "published")
    .single()

  const isMock = !dbLesson && id.startsWith("mock-")
  const lesson = dbLesson ?? (isMock ? MOCK_LESSONS.find((l) => l.id === id) : null)

  if (!lesson) {
    notFound()
  }

  // 予約数を取得（モックの場合はスキップ）
  let bookingCount = 0
  if (!isMock) {
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("lesson_id", id)
      .in("status", ["pending", "confirmed"])
    bookingCount = count ?? 0
  }

  const spotsLeft = lesson.capacity - bookingCount

  // 自分が予約済みかどうかチェック
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let alreadyBooked = false
  if (user && !isMock) {
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("lesson_id", id)
      .eq("swimmer_id", user.id)
      .in("status", ["pending", "confirmed"])
      .maybeSingle()
    alreadyBooked = !!existing
  }

  return (
    <div className="mx-auto max-w-2xl">
      {isMock && (
        <p className="mb-4 rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-700 border border-amber-200">
          これはサンプルデータです。実際の予約はできません。
        </p>
      )}
      <Card className="overflow-hidden">
        <div className="relative h-56 w-full">
          <Image
            src={getLessonImage(lesson.title)}
            alt={lesson.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl">{lesson.title}</CardTitle>
            <Badge variant="secondary" className="text-lg">
              {lesson.price.toLocaleString()}円
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
            <div>
              <p className="text-muted-foreground">日時</p>
              <p className="font-medium">
                {new Date(lesson.scheduled_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">時間</p>
              <p className="font-medium">{lesson.duration_minutes}分</p>
            </div>
            <div>
              <p className="text-muted-foreground">場所</p>
              <p className="font-medium">{lesson.location}</p>
            </div>
            <div>
              <p className="text-muted-foreground">空き</p>
              <p className="font-medium">
                {spotsLeft > 0
                  ? `残り ${spotsLeft} / ${lesson.capacity} 名`
                  : "満員"}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="mb-1 text-sm text-muted-foreground">指導員</p>
            <p className="font-medium">{lesson.instructor?.name ?? "不明"}</p>
          </div>

          <Separator />

          <div>
            <p className="mb-1 text-sm text-muted-foreground">説明</p>
            <p className="whitespace-pre-wrap">{lesson.description}</p>
          </div>

          <Separator />

          <BookingButton
            lessonId={lesson.id}
            price={lesson.price}
            isFull={spotsLeft <= 0}
            alreadyBooked={alreadyBooked}
            isMock={isMock}
          />
        </CardContent>
      </Card>
    </div>
  )
}
