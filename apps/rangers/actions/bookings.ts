"use server"

import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createBooking(lessonId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // レッスン情報を取得
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("status", "published")
    .single()

  if (lessonError || !lesson) {
    return { error: "レッスンが見つかりません" }
  }

  // 空き確認
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("lesson_id", lessonId)
    .in("status", ["pending", "confirmed"])

  if (count !== null && count >= lesson.capacity) {
    return { error: "このレッスンは満員です" }
  }

  // 重複予約チェック
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("swimmer_id", user.id)
    .in("status", ["pending", "confirmed"])
    .maybeSingle()

  if (existingBooking) {
    return { error: "すでにこのレッスンを予約しています" }
  }

  // Stripe PaymentIntent 作成
  const paymentIntent = await stripe.paymentIntents.create({
    amount: lesson.price,
    currency: "jpy",
    metadata: {
      lesson_id: lessonId,
      swimmer_id: user.id,
    },
  })

  // 予約レコード作成
  const { error: bookingError } = await supabase.from("bookings").insert({
    lesson_id: lessonId,
    swimmer_id: user.id,
    status: "pending",
    stripe_payment_intent_id: paymentIntent.id,
  })

  if (bookingError) {
    return { error: "予約の作成に失敗しました" }
  }

  return {
    clientSecret: paymentIntent.client_secret,
    bookingId: paymentIntent.id,
  }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, swimmer_id")
    .eq("id", bookingId)
    .eq("swimmer_id", user.id)
    .single()

  if (!booking) {
    return { error: "予約が見つかりません" }
  }

  if (booking.status === "cancelled") {
    return { error: "すでにキャンセル済みです" }
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("swimmer_id", user.id)

  if (error) {
    return { error: "キャンセルに失敗しました" }
  }

  revalidatePath("/bookings")
  return { success: true }
}

export async function confirmBooking(bookingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  // 指導員自身のレッスンの予約かチェック
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, lesson:lessons!inner(instructor_id)")
    .eq("id", bookingId)
    .single()

  if (!booking) {
    return { error: "予約が見つかりません" }
  }

  const lesson = Array.isArray(booking.lesson) ? booking.lesson[0] : booking.lesson
  if (lesson?.instructor_id !== user.id) {
    return { error: "権限がありません" }
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)

  if (error) {
    return { error: "確定に失敗しました" }
  }

  revalidatePath("/instructor/lessons")
  return { success: true }
}

export async function getMyBookings() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from("bookings")
    .select("*, lesson:lessons(*)")
    .eq("swimmer_id", user.id)
    .order("created_at", { ascending: false })

  return data ?? []
}
