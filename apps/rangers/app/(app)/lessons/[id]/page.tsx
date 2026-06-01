import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BookingButton } from "@/components/booking/booking-button"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { getLessonImage } from "@/lib/lesson-utils"
import { CalendarDays, Clock, MapPin, Users, User } from "lucide-react"

export async function generateMetadata({
  params,
}: LessonDetailPageProps): Promise<Metadata> {
  const { id } = await params

  if (id.startsWith("mock-")) {
    const lesson = MOCK_LESSONS.find((l) => l.id === id)
    if (!lesson) return {}
    return {
      title: lesson.title,
      description: `${lesson.title} — ${lesson.duration_minutes}分 · ¥${lesson.price.toLocaleString()} · ${lesson.location}`,
    }
  }

  const supabase = await createClient()
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title, description, price, duration_minutes, location")
    .eq("id", id)
    .single()

  if (!lesson) return {}

  return {
    title: lesson.title,
    description: lesson.description
      ?? `${lesson.title} — ${lesson.duration_minutes}分 · ¥${lesson.price.toLocaleString()} · ${lesson.location}`,
    openGraph: {
      title: lesson.title,
      description: lesson.description ?? undefined,
    },
  }
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
        <p className="mb-4 rounded-lg border-l-4 border-[#b8860b] bg-[#fdf6e3] px-4 py-3 text-sm text-[#b8860b]">
          これはサンプルデータです。実際の予約はできません。
        </p>
      )}
      <Card className="overflow-hidden">
        <div className="relative h-64 w-full">
          <Image
            src={getLessonImage(lesson.title)}
            alt={lesson.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <CardTitle className="text-2xl text-white drop-shadow-md">{lesson.title}</CardTitle>
            <span className="rounded-full bg-blue-500 px-4 py-1.5 text-lg font-bold text-white shadow-lg">
              ¥{lesson.price.toLocaleString()}
            </span>
          </div>
        </div>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">日時</p>
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
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">時間</p>
                <p className="font-medium">{lesson.duration_minutes}分</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">場所</p>
                <p className="font-medium">{lesson.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">空き</p>
                <p className={`font-medium ${spotsLeft === 0 ? "text-destructive" : spotsLeft <= 2 ? "text-orange-500" : ""}`}>
                  {spotsLeft > 0
                    ? `残り ${spotsLeft} / ${lesson.capacity} 名`
                    : "満員"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">指導員</p>
              <p className="font-medium">{lesson.instructor?.name ?? "不明"}</p>
            </div>
          </div>

          {lesson.description && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-xs text-muted-foreground">説明</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{lesson.description}</p>
              </div>
            </>
          )}

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
