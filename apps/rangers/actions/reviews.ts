"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const bookingId = formData.get("booking_id") as string
  const rating = Number(formData.get("rating"))
  const comment = formData.get("comment") as string

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return { error: "入力内容が不正です" }
  }

  // 予約の確認（自分のconfirmedな予約か）
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, swimmer_id, lesson_id, status, lesson:lessons!lesson_id(instructor_id)")
    .eq("id", bookingId)
    .eq("swimmer_id", user.id)
    .eq("status", "confirmed")
    .single()

  if (!booking) {
    return { error: "予約が見つかりません" }
  }

  const lessonData = Array.isArray(booking.lesson) ? booking.lesson[0] : booking.lesson
  const instructorId = (lessonData as unknown as { instructor_id: string } | null)?.instructor_id
  if (!instructorId) {
    return { error: "指導員情報が見つかりません" }
  }

  // 既に口コミ投稿済みか確認
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle()

  if (existing) {
    return { error: "この予約にはすでに口コミを投稿しています" }
  }

  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    reviewer_id: user.id,
    instructor_id: instructorId,
    rating,
    comment: comment || null,
  })

  if (error) {
    return { error: "口コミの投稿に失敗しました" }
  }

  revalidatePath(`/instructors/${instructorId}`)
  revalidatePath("/bookings")

  return { success: true }
}
