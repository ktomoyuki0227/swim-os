export type UserRole = "swimmer" | "instructor" | "admin"

export type LessonStatus = "draft" | "published" | "cancelled"

export type BookingStatus = "pending" | "confirmed" | "cancelled"

export interface Profile {
  id: string
  role: UserRole
  name: string
  avatar_url: string | null
  /** 将来の Stripe Connect 決済のために予約済み。現時点では未使用。 */
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
  created_at: string
}

export interface LessonWithInstructor extends Lesson {
  instructor: Pick<Profile, "id" | "name" | "avatar_url">
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
  lesson: Lesson
}

export interface BookingWithSwimmer extends Booking {
  swimmer: Pick<Profile, "id" | "name" | "avatar_url">
}
