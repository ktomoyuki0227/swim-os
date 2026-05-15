"use server"

import { createClient } from "@/lib/supabase/server"
import { lessonSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface LessonActionState {
  error: string | null
}

export async function createLesson(
  _prevState: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    capacity: Number(formData.get("capacity")),
    scheduled_at: formData.get("scheduled_at") as string,
    duration_minutes: Number(formData.get("duration_minutes")),
    location: formData.get("location") as string,
  }

  const result = lessonSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("・") }
  }

  const { error } = await supabase.from("lessons").insert({
    ...result.data,
    instructor_id: user.id,
    status: "published",
  })

  if (error) {
    return { error: "レッスンの作成に失敗しました" }
  }

  revalidatePath("/instructor/lessons")
  redirect("/instructor/lessons")
}

export async function updateLesson(
  lessonId: string,
  _prevState: LessonActionState,
  formData: FormData
): Promise<LessonActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    capacity: Number(formData.get("capacity")),
    scheduled_at: formData.get("scheduled_at") as string,
    duration_minutes: Number(formData.get("duration_minutes")),
    location: formData.get("location") as string,
  }

  const result = lessonSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("・") }
  }

  const { error } = await supabase
    .from("lessons")
    .update(result.data)
    .eq("id", lessonId)
    .eq("instructor_id", user.id)

  if (error) {
    return { error: "レッスンの更新に失敗しました" }
  }

  revalidatePath("/instructor/lessons")
  redirect("/instructor/lessons")
}

export async function toggleLessonStatus(lessonId: string, currentStatus: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  const nextStatus = currentStatus === "published" ? "draft" : "published"

  const { error } = await supabase
    .from("lessons")
    .update({ status: nextStatus })
    .eq("id", lessonId)
    .eq("instructor_id", user.id)

  if (error) {
    return { error: "ステータスの変更に失敗しました" }
  }

  revalidatePath("/instructor/lessons")
  return { success: true, newStatus: nextStatus }
}

export async function deleteLesson(lessonId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  // 有効な予約が存在する場合は削除不可
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("lesson_id", lessonId)
    .in("status", ["pending", "confirmed"])

  if (count && count > 0) {
    return { error: `予約が${count}件あるため削除できません。先にキャンセルしてください。` }
  }

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", lessonId)
    .eq("instructor_id", user.id)

  if (error) {
    return { error: "レッスンの削除に失敗しました" }
  }

  revalidatePath("/instructor/lessons")
}
