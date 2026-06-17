"use server"

import { createClient } from "@/lib/supabase/server"
import { profilePartialSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export interface ProfileActionState {
  error: string | null
  success: boolean
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
  return { error: null, success: true, avatarUrl }
}

// セクション単位での部分更新（profile/page.tsx のセクション別編集から呼び出す）
export async function updateProfilePartial(
  data: Parameters<typeof profilePartialSchema.parse>[0]
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "ログインが必要です", success: false }

  // サーバー側バリデーション（型・長さ・enum値をZodで検証）
  const result = profilePartialSchema.safeParse(data)
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("・"), success: false }
  }

  const { error } = await supabase
    .from("profiles")
    .update(result.data)
    .eq("id", user.id)

  if (error) return { error: "プロフィールの更新に失敗しました", success: false }

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

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) throw error

  return data
}
