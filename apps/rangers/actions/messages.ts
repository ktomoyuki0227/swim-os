"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const receiverId = formData.get("receiver_id") as string
  const content = (formData.get("content") as string)?.trim()

  if (!receiverId || !content) {
    return { error: "メッセージを入力してください" }
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    content,
  })

  if (error) {
    return { error: "送信に失敗しました" }
  }

  revalidatePath(`/messages/${receiverId}`)

  return { success: true }
}

export async function sendScheduleRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const instructorId = formData.get("instructor_id") as string
  const lessonId = formData.get("lesson_id") as string | null
  const message = (formData.get("message") as string)?.trim()
  const preferredDates = formData.getAll("preferred_dates") as string[]

  if (!instructorId || !message) {
    return { error: "必須項目を入力してください" }
  }

  const { error } = await supabase.from("schedule_requests").insert({
    swimmer_id: user.id,
    instructor_id: instructorId,
    lesson_id: lessonId || null,
    message,
    preferred_dates: preferredDates,
  })

  if (error) {
    return { error: "リクエストの送信に失敗しました" }
  }

  revalidatePath(`/instructors/${instructorId}`)

  return { success: true }
}

export async function markMessagesRead(senderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", senderId)
    .eq("receiver_id", user.id)
    .is("read_at", null)
}
