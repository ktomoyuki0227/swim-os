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
    return { error: result.error.issues.map((i) => i.message).join("・"), success: false }
  }

  // 公開プロフィールフィールド
  const bio = (formData.get("bio") as string | null) || null
  const career = (formData.get("career") as string | null) || null
  const achievements = (formData.get("achievements") as string | null) || null
  const prefecture = (formData.get("prefecture") as string | null) || null
  const specialties = formData.getAll("specialties") as string[]
  const targetAges = formData.getAll("target_ages") as string[]

  // スイマー向けフィールド
  const furigana = (formData.get("furigana") as string | null) || null
  const gender = (formData.get("gender") as string | null) || null
  const birthday = (formData.get("birthday") as string | null) || null
  const phone = (formData.get("phone") as string | null) || null
  const address = (formData.get("address") as string | null) || null
  const emergency_contact = (formData.get("emergency_contact") as string | null) || null
  const emergency_contact_name = (formData.get("emergency_contact_name") as string | null) || null
  const emergency_contact_relation = (formData.get("emergency_contact_relation") as string | null) || null
  const swimwear_size = (formData.get("swimwear_size") as string | null) || null
  const masters_registered = formData.get("masters_registered") === "true"
  const masters_number = (formData.get("masters_number") as string | null) || null
  const jsa_registered = formData.get("jsa_registered") === "true"
  const jsa_number = (formData.get("jsa_number") as string | null) || null

  const { error } = await supabase
    .from("profiles")
    .update({
      name: result.data.name,
      bio: bio || null,
      career: career || null,
      achievements: achievements || null,
      prefecture: prefecture || null,
      specialties: specialties.length > 0 ? specialties : [],
      target_ages: targetAges.length > 0 ? targetAges : [],
      furigana,
      gender,
      birthday,
      phone,
      address,
      emergency_contact,
      emergency_contact_name,
      emergency_contact_relation,
      swimwear_size,
      masters_registered,
      masters_number,
      jsa_registered,
      jsa_number,
    })
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
  return { error: null, success: true, avatarUrl }
}

// セクション単位での部分更新（profile/page.tsx のセクション別編集から呼び出す）
export async function updateProfilePartial(
  data: Partial<{
    name: string
    furigana: string | null
    gender: string | null
    birthday: string | null
    phone: string | null
    address: string | null
    swimwear_size: string | null
    emergency_contact: string | null
    emergency_contact_name: string | null
    emergency_contact_relation: string | null
    masters_registered: boolean
    masters_number: string | null
    jsa_registered: boolean
    jsa_number: string | null
    bio: string | null
    career: string | null
    achievements: string | null
    prefecture: string | null
    specialties: string[]
    target_ages: string[]
    prefectures: string[]
    swimming_goals: string[]
    participation_styles: string[]
  }>
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "ログインが必要です", success: false }

  if (data.name !== undefined && !data.name?.trim()) {
    return { error: "名前は必須です", success: false }
  }

  const { error } = await supabase
    .from("profiles")
    .update(data)
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

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return data
}
