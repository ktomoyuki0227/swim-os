"use server"

import { createClient } from "@/lib/supabase/server"
import { profilePartialSchema } from "@/lib/validations"
import { updatePaymentMethod } from "@/actions/payments"

export interface OnboardingData {
  furigana?: string
  birthday?: string
  gender?: "male" | "female" | "other"
  phone?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_relation?: string
  emergency_contact?: string
  masters_registered?: boolean
  masters_number?: string
  jsa_registered?: boolean
  jsa_number?: string
  stripe_payment_method_id?: string
  career?: string
  bio?: string
  achievements?: string
  // プロフィールタグ（Step 1 で収集）
  level?: string
  specialties?: string[]
  swimming_goals?: string[]
  prefectures?: string[]
  swimmer_type?: string | null
  swim_disciplines?: string[]
}

export async function completeOnboarding(
  data: OnboardingData
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "ログインが必要です" }

  // profilePartialSchema と同じ境界検証をここでも適用する（プロフィール編集画面との非対称を解消）
  const parsed = profilePartialSchema.safeParse({
    furigana: data.furigana || null,
    birthday: data.birthday || null,
    gender: data.gender || null,
    phone: data.phone || null,
    address: data.address || null,
    emergency_contact_name: data.emergency_contact_name || null,
    emergency_contact_relation: data.emergency_contact_relation || null,
    emergency_contact: data.emergency_contact || null,
    masters_registered: data.masters_registered ?? false,
    masters_number: data.masters_number || null,
    jsa_registered: data.jsa_registered ?? false,
    jsa_number: data.jsa_number || null,
    career: data.career || null,
    bio: data.bio || null,
    achievements: data.achievements || null,
    level: data.level || null,
    specialties: data.specialties ?? [],
    swimming_goals: data.swimming_goals ?? [],
    prefectures: data.prefectures ?? [],
    swimmer_type: data.swimmer_type || null,
    swim_disciplines: data.swim_disciplines ?? [],
  })
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("・") }
  }

  // カード登録は updatePaymentMethod に委譲する（Stripe側の実在確認・所有権チェックを必ず経由させるため）
  if (data.stripe_payment_method_id) {
    const pmResult = await updatePaymentMethod(data.stripe_payment_method_id)
    if (pmResult.error) return { error: pmResult.error }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      ...parsed.data,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) return { error: "保存に失敗しました" }

  return { error: null }
}
