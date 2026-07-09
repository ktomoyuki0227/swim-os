import { z } from "zod/v4"
import { SWIM_SPECIALTIES, PREFECTURES, SWIMMING_GOALS, PARTICIPATION_STYLES, SWIM_LEVELS, TARGET_AGES, SWIMMER_TYPES, SWIM_DISCIPLINES, PRACTICE_FREQUENCIES, PRACTICE_DAYS } from "@/types/database"

export const loginSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
})

export const registerSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
})

export const lessonSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(100, "タイトルは100文字以内で入力してください"),
  description: z.string().min(1, "説明を入力してください").max(2000, "説明は2000文字以内で入力してください"),
  price: z.number().int().min(500, "料金は500円以上で入力してください").max(1000000, "料金が高すぎます"),
  capacity: z.number().int().min(1, "定員は1名以上で入力してください").max(100, "定員は100名以下で入力してください"),
  scheduled_at: z.string().min(1, "日時を選択してください").refine(
    (v) => new Date(v) > new Date(),
    "過去の日時は選択できません"
  ),
  duration_minutes: z.number().int().min(15, "時間は15分以上で入力してください").max(240, "時間は240分（4時間）以内で入力してください"),
  location: z.string().min(1, "場所を入力してください").max(200, "場所は200文字以内で入力してください"),
})

export const profileSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  furigana: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  birthday: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  swimwear_size: z.string().optional(),
  masters_registered: z.boolean().optional(),
  masters_number: z.string().optional(),
  jsa_registered: z.boolean().optional(),
  jsa_number: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LessonInput = z.infer<typeof lessonSchema>
export type ProfileInput = z.infer<typeof profileSchema>

// ============================================================
// マスターズグループ管理
// ============================================================

export const teamSchema = z.object({
  name: z.string().min(1, "グループ名を入力してください").max(100, "グループ名は100文字以内"),
  description: z.string().max(2000, "説明は2000文字以内").optional(),
  cover_image_url: z.string().url().optional(),
  avatar_url: z.string().url().optional(),
  is_recruiting: z.boolean().default(true),
  activity_area: z.string().max(100).optional(),
  practice_frequency: z.string()
    .refine((v) => (PRACTICE_FREQUENCIES as readonly string[]).includes(v), "無効な練習頻度です")
    .optional(),
  practice_days: z.array(
    z.string().refine((v) => (PRACTICE_DAYS as readonly string[]).includes(v), "無効な練習曜日です")
  ).default([]),
  main_pool: z.string().max(200).optional(),
  has_session_fee: z.boolean().default(true),
  has_annual_fee: z.boolean().default(false),
  has_monthly_fee: z.boolean().default(false),
  has_point_card: z.boolean().default(false),
  default_member_price: z.number().int().min(0, "0以上で入力してください").default(0),
  default_guest_price: z.number().int().min(0, "0以上で入力してください").default(0),
  annual_fee_amount: z.number().int().min(0).optional(),
  monthly_fee_amount: z.number().int().min(0).optional(),
  cancellation_days: z.number().int().min(0).max(30).default(3),
  point_card_count: z.number().int().min(1).max(100).default(10),
  point_card_price: z.number().int().min(0).optional(),
  contact_email: z.string().max(254).optional(),
  contact_phone: z.string().max(20).optional(),
  fee_members_exempt_session: z.boolean().default(false),
  team_type: z.enum(["team", "personal"]).default("team"),
})

export const sessionSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(100, "100文字以内"),
  description: z.string().max(2000, "2000文字以内").optional(),
  content: z.string().max(5000, "5000文字以内").optional(),
  type: z.enum(["practice", "camp", "competition", "event", "meeting"]).default("practice"),
  scheduled_at: z.string().min(1, "日時を選択してください"),
  end_at: z.string().optional(),
  location: z.string().min(1, "場所を入力してください").max(200, "200文字以内"),
  meeting_point: z.string().max(200, "200文字以内").optional(),
  gender_filter: z.enum(["all", "male", "female"]).default("all"),
  member_price: z.number().int().min(0).default(0),
  guest_price: z.number().int().min(0).default(0),
  registration_deadline: z.string().optional(),
  min_participants: z.number().int().min(0).optional(),
  max_participants: z.number().int().min(1).optional(),
  course_rules: z.array(z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0).optional(),
    courses: z.number().int().min(1),
    cancel_below: z.number().int().min(0).optional(),
  })).optional(),
  target_tags: z.array(z.string()).default([]),
  target_members: z.array(z.string()).optional(),
  cancellation_days: z.number().int().min(0).optional(),
  allow_point_card: z.boolean().default(true),
  is_external: z.boolean().default(false),
  competition_fields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "select", "number"]),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
})

// グループ更新用（更新可能フィールドのみ。coach_id / invite_code / team_type は除外）
// team_type は作成時のみ設定可能。作成後の変更は不可。
export const teamUpdateSchema = z.object({
  name: z.string().min(1, "グループ名を入力してください").max(100, "100文字以内").optional(),
  description: z.string().max(2000, "2000文字以内").optional(),
  cover_image_url: z.string().url().optional(),
  is_recruiting: z.boolean().optional(),
  activity_area: z.string().max(100).optional(),
  practice_frequency: z.string()
    .refine((v) => (PRACTICE_FREQUENCIES as readonly string[]).includes(v), "無効な練習頻度です")
    .nullable()
    .optional(),
  practice_days: z.array(
    z.string().refine((v) => (PRACTICE_DAYS as readonly string[]).includes(v), "無効な練習曜日です")
  ).optional(),
  main_pool: z.string().max(200).nullable().optional(),
  avatar_url: z.string().url().optional(),
  has_session_fee: z.boolean().optional(),
  has_annual_fee: z.boolean().optional(),
  has_monthly_fee: z.boolean().optional(),
  has_point_card: z.boolean().optional(),
  default_member_price: z.number().int().min(0).optional(),
  default_guest_price: z.number().int().min(0).optional(),
  annual_fee_amount: z.number().int().min(0).optional(),
  monthly_fee_amount: z.number().int().min(0).optional(),
  cancellation_days: z.number().int().min(0).max(30).optional(),
  point_card_count: z.number().int().min(1).max(100).optional(),
  point_card_price: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  contact_email: z.string().max(254).nullable().optional(),
  contact_phone: z.string().max(20).nullable().optional(),
  fee_members_exempt_session: z.boolean().optional(),
})

// セッション更新用（全フィールド optional）
export const sessionUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().max(5000).optional(),
  type: z.enum(["practice", "camp", "competition", "event", "meeting"]).optional(),
  scheduled_at: z.string().optional(),
  end_at: z.string().optional(),
  location: z.string().min(1).max(200).optional(),
  meeting_point: z.string().max(200).optional(),
  gender_filter: z.enum(["all", "male", "female"]).optional(),
  member_price: z.number().int().min(0).optional(),
  guest_price: z.number().int().min(0).optional(),
  registration_deadline: z.string().optional(),
  min_participants: z.number().int().min(0).optional(),
  max_participants: z.number().int().min(1).optional(),
  course_rules: z.array(z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0).optional(),
    courses: z.number().int().min(1),
    cancel_below: z.number().int().min(0).optional(),
  })).optional(),
  target_tags: z.array(z.string()).optional(),
  cancellation_days: z.number().int().min(0).optional(),
  allow_point_card: z.boolean().optional(),
  is_external: z.boolean().optional(),
  is_lp_featured: z.boolean().optional(),
  competition_fields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "select", "number"]),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
  status: z.enum(["published", "draft"]).optional(),
})

export const announcementSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(200, "200文字以内"),
  body: z.string().max(5000, "5000文字以内").optional(),
  image_url: z.string().url().optional(),
  link_url: z.string().url().optional(),
  target_tags: z.array(z.string()).default([]),
})

export const templateSchema = z.object({
  name: z.string().min(1, "テンプレート名を入力してください").max(100, "100文字以内"),
})

// テンプレート更新用（全フィールドがoptional）
export const templateUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().max(5000).optional(),
  type: z.enum(["practice", "camp", "competition", "event", "meeting"]).optional(),
  location: z.string().max(200).optional(),
  member_price: z.number().int().min(0).optional(),
  guest_price: z.number().int().min(0).optional(),
  deadline_days: z.number().int().min(0).optional(),
  min_participants: z.number().int().min(0).optional(),
  max_participants: z.number().int().min(1).optional(),
  course_rules: z.array(z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0).optional(),
    courses: z.number().int().min(1),
    cancel_below: z.number().int().min(0).optional(),
  })).optional(),
  target_tags: z.array(z.string()).optional(),
  allow_point_card: z.boolean().optional(),
  cancellation_days: z.number().int().min(0).optional(),
  is_external: z.boolean().optional(),
})

export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>

// プロフィール部分更新用スキーマ（updateProfilePartial で使用）
export const profilePartialSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100, "名前は100文字以内").optional(),
  furigana: z.string().max(100).nullable().optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  birthday: z.union([
    z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "生年月日はYYYY-MM-DD形式で入力してください")
      .refine((v) => !isNaN(Date.parse(v)), "有効な日付を入力してください"),
    z.null(),
  ]).optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().max(200).nullable().optional(),
  swimwear_size: z.string().max(10).nullable().optional(),
  emergency_contact: z.string().max(20).nullable().optional(),
  emergency_contact_name: z.string().max(100).nullable().optional(),
  emergency_contact_relation: z.string().max(50).nullable().optional(),
  masters_registered: z.boolean().optional(),
  masters_number: z.string().max(50).nullable().optional(),
  jsa_registered: z.boolean().optional(),
  jsa_number: z.string().max(50).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  career: z.string().max(1000).nullable().optional(),
  achievements: z.string().max(1000).nullable().optional(),
  specialties: z.array(z.string().refine((v) => (SWIM_SPECIALTIES as readonly string[]).includes(v), "無効な種目です")).optional(),
  target_ages: z.array(z.string().refine((v) => (TARGET_AGES as readonly string[]).includes(v), "無効な対象年齢です")).optional(),
  prefectures: z.array(z.string().refine((v) => (PREFECTURES as readonly string[]).includes(v), "無効な都道府県です")).optional(),
  swimming_goals: z.array(z.string().refine((v) => (SWIMMING_GOALS as readonly string[]).includes(v), "無効な活動目的です")).optional(),
  participation_styles: z.array(z.string().refine((v) => (PARTICIPATION_STYLES as readonly string[]).includes(v), "無効な参加スタイルです")).optional(),
  level: z.string().nullable().refine((v) => v === null || (SWIM_LEVELS as readonly string[]).includes(v), "無効なレベルです").optional(),
  swimmer_type: z.string().nullable().refine((v) => v === null || (SWIMMER_TYPES as readonly string[]).includes(v), "無効なスイマータイプです").optional(),
  swim_disciplines: z.array(z.string().refine((v) => (SWIM_DISCIPLINES as readonly string[]).includes(v), "無効な水泳カテゴリです")).optional(),
}).strict()

export type ProfilePartialInput = z.infer<typeof profilePartialSchema>

export type TeamInput = z.infer<typeof teamSchema>
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>
export type SessionInput = z.infer<typeof sessionSchema>
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>
export type AnnouncementInput = z.infer<typeof announcementSchema>
export type TemplateInput = z.infer<typeof templateSchema>
