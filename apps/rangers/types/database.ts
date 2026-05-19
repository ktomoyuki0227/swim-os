export type UserRole = "swimmer" | "instructor" | "admin"

export type LessonStatus = "draft" | "published" | "cancelled"

export type LessonType = "individual" | "group"

export type BookingStatus = "pending" | "confirmed" | "cancelled"

export type ScheduleRequestStatus = "pending" | "accepted" | "declined"

export interface Profile {
  id: string
  role: UserRole
  name: string
  avatar_url: string | null
  bio: string | null
  career: string | null
  achievements: string | null
  specialties: string[]
  prefecture: string | null
  target_ages: string[]
  rating_avg: number
  review_count: number
  stripe_account_id: string | null
  created_at: string
}

export interface Lesson {
  id: string
  instructor_id: string
  title: string
  description: string
  price: number
  capacity: number
  scheduled_at: string
  duration_minutes: number
  location: string
  status: LessonStatus
  lesson_type: LessonType
  specialty: string | null
  target_age: string | null
  target_level: string | null
  created_at: string
}

export interface LessonWithInstructor extends Lesson {
  instructor: Pick<Profile, "id" | "name" | "avatar_url" | "rating_avg" | "review_count">
}

export interface Booking {
  id: string
  lesson_id: string
  swimmer_id: string
  status: BookingStatus
  stripe_payment_intent_id: string | null
  created_at: string
}

export interface BookingWithLesson extends Booking {
  lesson: LessonWithInstructor
}

export interface BookingWithSwimmer extends Booking {
  swimmer: Pick<Profile, "id" | "name" | "avatar_url">
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  instructor_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ReviewWithReviewer extends Review {
  reviewer: Pick<Profile, "id" | "name" | "avatar_url">
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read_at: string | null
  created_at: string
}

export interface MessageWithProfiles extends Message {
  sender: Pick<Profile, "id" | "name" | "avatar_url">
  receiver: Pick<Profile, "id" | "name" | "avatar_url">
}

export interface ScheduleRequest {
  id: string
  swimmer_id: string
  instructor_id: string
  lesson_id: string | null
  message: string
  preferred_dates: string[]
  status: ScheduleRequestStatus
  created_at: string
}

/** 水泳種目マスター */
export const SWIM_SPECIALTIES = [
  "クロール",
  "平泳ぎ",
  "バタフライ",
  "背泳ぎ",
  "個人メドレー",
  "スタート・ターン",
  "マスターズ水泳",
  "子供水泳",
  "水泳全般",
] as const

export type SwimSpecialty = (typeof SWIM_SPECIALTIES)[number]

/** 対象年齢マスター */
export const TARGET_AGES = [
  "子供（〜12歳）",
  "中高生（13〜18歳）",
  "大人（19歳〜）",
  "シニア（60歳〜）",
] as const

export type TargetAge = (typeof TARGET_AGES)[number]

/** 対象レベルマスター */
export const TARGET_LEVELS = [
  "初心者",
  "初中級",
  "中級者",
  "上級者",
  "競技者",
] as const

export type TargetLevel = (typeof TARGET_LEVELS)[number]

/** 都道府県マスター */
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const

export type Prefecture = (typeof PREFECTURES)[number]
