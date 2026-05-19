import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReviewForm } from "@/components/review/review-form"

export const metadata: Metadata = { title: "口コミを書く" }

interface ReviewPageProps {
  params: Promise<{ bookingId: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, swimmer_id, lesson:lessons!lesson_id(title, instructor:profiles!instructor_id(id, name))")
    .eq("id", bookingId)
    .eq("swimmer_id", user.id)
    .single()

  if (!booking || booking.status !== "confirmed") notFound()

  // 既に口コミ済みか
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle()

  if (existing) {
    redirect("/bookings")
  }

  const lessonRaw = Array.isArray(booking.lesson) ? booking.lesson[0] : booking.lesson
  const lesson = lessonRaw as unknown as { title: string; instructor: { id: string; name: string } | { id: string; name: string }[] }
  const instructor = Array.isArray(lesson.instructor) ? lesson.instructor[0] : lesson.instructor

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">口コミを書く</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {instructor.name} コーチの「{lesson.title}」についてレビューを投稿してください
      </p>
      <ReviewForm bookingId={bookingId} instructorName={instructor.name} />
    </div>
  )
}
