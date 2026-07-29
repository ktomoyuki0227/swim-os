"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { profilePartialSchema } from "@/lib/validations"
import { isValidImageFile } from "@/lib/file-validation"
import { isRateLimited } from "@/lib/rate-limit"
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

const AVATAR_UPLOAD_RATE_LIMIT = 10
const AVATAR_UPLOAD_RATE_WINDOW_MS = 60 * 1000

export async function uploadAvatar(
  formData: FormData
): Promise<AvatarActionState> {
  // 認証チェックはユーザークライアントで行う
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です", success: false }

  if (isRateLimited(`upload_avatar:${user.id}`, AVATAR_UPLOAD_RATE_LIMIT, AVATAR_UPLOAD_RATE_WINDOW_MS)) {
    return { error: "アップロードが多すぎます。しばらく時間をおいてから再度お試しください", success: false }
  }

  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) return { error: "ファイルを選択してください", success: false }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "JPEG・PNG・WebP形式のみアップロードできます", success: false }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "ファイルサイズは2MB以下にしてください", success: false }
  }
  // file.type はクライアント申告値（偽装可能）のため、実バイト列のマジックナンバーで検証する
  if (!(await isValidImageFile(file, file.type))) {
    return { error: "ファイルの内容が画像形式として不正です", success: false }
  }

  const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }
  const ext = extMap[file.type] ?? "jpg"
  const filePath = `${user.id}/avatar.${ext}`

  // Storage への書き込みは adminClient を使用（RLS バイパス）
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true })

  if (uploadError) return { error: "画像のアップロードに失敗しました", success: false }

  const { data: urlData } = admin.storage.from("avatars").getPublicUrl(filePath)
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)

  if (updateError) return { error: "プロフィールの更新に失敗しました", success: false }

  revalidatePath("/profile")
  return { error: null, success: true, avatarUrl }
}

export async function deleteAvatar(): Promise<ProfileActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です", success: false }

  // Storage からファイルを削除（adminClient でRLSバイパス）
  const admin = createAdminClient()
  const { data: files } = await admin.storage.from("avatars").list(user.id)
  if (files && files.length > 0) {
    const paths = files.map((f) => `${user.id}/${f.name}`)
    await admin.storage.from("avatars").remove(paths)
  }

  // DB の参照を null に更新
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)

  if (error) return { error: "写真の削除に失敗しました", success: false }

  revalidatePath("/profile")
  return { error: null, success: true }
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

  if (error) return null

  return data
}

export async function getPublicProfile(profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です", data: null }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("id, name, avatar_url, bio, career, achievements, specialties, target_ages, rating_avg, review_count, prefectures, level, swimming_goals, swimmer_type, swim_disciplines, participation_styles")
    .eq("id", profileId)
    .single()

  if (error || !data) return { error: "プロフィールが見つかりません", data: null }
  return { data, error: null }
}
