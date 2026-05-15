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

export interface AvatarActionState {
  error: string | null
  success: boolean
  avatarUrl?: string
}

export async function uploadAvatar(
  _prevState: AvatarActionState,
  formData: FormData
): Promise<AvatarActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です", success: false }
  }

  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) {
    return { error: "ファイルを選択してください", success: false }
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "JPEG・PNG・WebP形式のみアップロードできます", success: false }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "ファイルサイズは2MB以下にしてください", success: false }
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const filePath = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    return { error: "画像のアップロードに失敗しました", success: false }
  }

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath)

  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)

  if (updateError) {
    return { error: "プロフィールの更新に失敗しました", success: false }
  }

  revalidatePath("/profile")
  revalidatePath("/")
  return { error: null, success: true, avatarUrl }
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
