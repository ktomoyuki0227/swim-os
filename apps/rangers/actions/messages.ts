"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { messageSchema, scheduleRequestSchema } from "@/lib/validations"

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const parsed = messageSchema.safeParse({
    receiver_id: formData.get("receiver_id"),
    content: (formData.get("content") as string)?.trim(),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("・") }
  }
  const { receiver_id: receiverId, content } = parsed.data

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

  const parsed = scheduleRequestSchema.safeParse({
    instructor_id: formData.get("instructor_id"),
    lesson_id: (formData.get("lesson_id") as string | null) || null,
    message: (formData.get("message") as string)?.trim(),
    preferred_dates: formData.getAll("preferred_dates") as string[],
  })
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("・") }
  }

  const { error } = await supabase.from("schedule_requests").insert({
    swimmer_id: user.id,
    instructor_id: parsed.data.instructor_id,
    lesson_id: parsed.data.lesson_id,
    message: parsed.data.message,
    preferred_dates: parsed.data.preferred_dates,
  })

  if (error) {
    return { error: "リクエストの送信に失敗しました" }
  }

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

  revalidatePath("/messages")
  revalidatePath(`/messages/${senderId}`)
}
