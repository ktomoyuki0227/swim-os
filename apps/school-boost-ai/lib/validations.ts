import { z } from 'zod'

export const memberSchema = z.object({
  name: z.string().min(1, '氏名を入力してください'),
  name_kana: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  emergency_contact: z.string().optional(),
  health_notes: z.string().optional(),
  notes: z.string().optional(),
  current_level: z.coerce.number().min(0).max(99).default(0),
})

export type MemberFormData = z.infer<typeof memberSchema>

export const classSchema = z.object({
  name: z.string().min(1, 'クラス名を入力してください'),
  description: z.string().optional(),
  level_min: z.coerce.number().min(0).default(0),
  level_max: z.coerce.number().min(0).default(99),
  capacity: z.coerce.number().min(1).default(20),
  color: z.string().default('#3B82F6'),
  coach_id: z.string().optional(),
})

export type ClassFormData = z.infer<typeof classSchema>

export const scheduleSchema = z.object({
  class_id: z.string().min(1),
  day_of_week: z.coerce.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, '時刻の形式が正しくありません'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, '時刻の形式が正しくありません'),
})

export type ScheduleFormData = z.infer<typeof scheduleSchema>

export const feeSchema = z.object({
  member_id: z.string().min(1),
  amount: z.coerce.number().min(0),
  target_month: z.string().min(1),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

export type FeeFormData = z.infer<typeof feeSchema>

export const loginSchema = z.object({
  email: z.string().email('正しいメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const applicationSchema = z.object({
  child_name: z.string().min(1, 'お子様のお名前を入力してください'),
  child_birth_date: z.string().optional(),
  parent_name: z.string().min(1, '保護者のお名前を入力してください'),
  parent_email: z.string().email('正しいメールアドレスを入力してください'),
  parent_phone: z.string().optional(),
  preferred_class: z.string().optional(),
  message: z.string().optional(),
})

export type ApplicationFormData = z.infer<typeof applicationSchema>
