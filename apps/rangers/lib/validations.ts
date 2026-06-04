import { z } from "zod/v4"

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
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LessonInput = z.infer<typeof lessonSchema>
export type ProfileInput = z.infer<typeof profileSchema>

// ============================================================
// マスターズチーム管理
// ============================================================

export const teamSchema = z.object({
  name: z.string().min(1, "チーム名を入力してください").max(100, "チーム名は100文字以内"),
  description: z.string().max(2000, "説明は2000文字以内").optional(),
  default_member_price: z.number().int().min(0, "0以上で入力してください").default(0),
  default_guest_price: z.number().int().min(0, "0以上で入力してください").default(0),
  annual_fee_amount: z.number().int().min(0).optional(),
  monthly_fee_amount: z.number().int().min(0).optional(),
  cancellation_days: z.number().int().min(0).max(30).default(3),
  point_card_count: z.number().int().min(1).max(100).default(10),
  point_card_price: z.number().int().min(0).optional(),
})

export const sessionSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(100, "100文字以内"),
  description: z.string().max(2000, "2000文字以内").optional(),
  content: z.string().max(5000, "5000文字以内").optional(),
  type: z.enum(["practice", "camp", "competition", "event", "meeting"]).default("practice"),
  scheduled_at: z.string().min(1, "日時を選択してください"),
  location: z.string().min(1, "場所を入力してください").max(200, "200文字以内"),
  member_price: z.number().int().min(0).default(0),
  guest_price: z.number().int().min(0).default(0),
  registration_deadline: z.string().optional(),
  min_participants: z.number().int().min(0).optional(),
  max_participants: z.number().int().min(1).optional(),
  course_rules: z.array(z.object({
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(0).optional(),
    courses: z.number().int().min(0).optional(),
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

// チーム更新用（更新可能フィールドのみ。coach_id / invite_code 等は除外）
export const teamUpdateSchema = z.object({
  name: z.string().min(1, "チーム名を入力してください").max(100, "100文字以内").optional(),
  description: z.string().max(2000, "2000文字以内").optional(),
  default_member_price: z.number().int().min(0).optional(),
  default_guest_price: z.number().int().min(0).optional(),
  annual_fee_amount: z.number().int().min(0).optional(),
  monthly_fee_amount: z.number().int().min(0).optional(),
  cancellation_days: z.number().int().min(0).max(30).optional(),
  point_card_count: z.number().int().min(1).max(100).optional(),
  point_card_price: z.number().int().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

// セッション更新用（全フィールド optional）
export const sessionUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().max(5000).optional(),
  type: z.enum(["practice", "camp", "competition", "event", "meeting"]).optional(),
  scheduled_at: z.string().optional(),
  location: z.string().min(1).max(200).optional(),
  member_price: z.number().int().min(0).optional(),
  guest_price: z.number().int().min(0).optional(),
  registration_deadline: z.string().optional(),
  min_participants: z.number().int().min(0).optional(),
  max_participants: z.number().int().min(1).optional(),
  course_rules: z.array(z.object({
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(0).optional(),
    courses: z.number().int().min(0).optional(),
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
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(0).optional(),
    courses: z.number().int().min(0).optional(),
    cancel_below: z.number().int().min(0).optional(),
  })).optional(),
  target_tags: z.array(z.string()).optional(),
  allow_point_card: z.boolean().optional(),
  cancellation_days: z.number().int().min(0).optional(),
  is_external: z.boolean().optional(),
})

export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>

export type TeamInput = z.infer<typeof teamSchema>
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>
export type SessionInput = z.infer<typeof sessionSchema>
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>
export type AnnouncementInput = z.infer<typeof announcementSchema>
export type TemplateInput = z.infer<typeof templateSchema>
