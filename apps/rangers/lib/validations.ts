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
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().min(1, "説明を入力してください"),
  price: z.number().int().min(0, "料金は0以上で入力してください"),
  capacity: z.number().int().min(1, "定員は1以上で入力してください"),
  scheduled_at: z.string().min(1, "日時を選択してください"),
  duration_minutes: z.number().int().min(15, "時間は15分以上で入力してください"),
  location: z.string().min(1, "場所を入力してください"),
})

export const profileSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type LessonInput = z.infer<typeof lessonSchema>
export type ProfileInput = z.infer<typeof profileSchema>
