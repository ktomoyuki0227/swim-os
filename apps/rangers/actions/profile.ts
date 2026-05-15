"use server"

import { createClient } from "@/lib/supabase/server"
import { profileSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export interface ProfileActionState {
  error: string | null
  success: boolean
}

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です", success: false }
  }

  const raw = {
    name: formData.get("name") as string,
  }

  const result = profileSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message, success: false }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: result.data.name })
    .eq("id", user.id)

  if (error) {
    return { error: "プロフィールの更新に失敗しました", success: false }
  }

  revalidatePath("/profile")
  return { error: null, success: true }
}

export async function getProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return data
}
