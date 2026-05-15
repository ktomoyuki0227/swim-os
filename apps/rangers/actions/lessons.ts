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
    return { error: result.error.issues[0].message }
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
    return { error: result.error.issues[0].message }
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

export async function deleteLesson(lessonId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
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
