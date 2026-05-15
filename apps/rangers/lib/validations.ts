import { z } from "zod/v4"

export const loginSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
})

export const registerSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
  role: z.enum(["swimmer", "instructor"]),
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
