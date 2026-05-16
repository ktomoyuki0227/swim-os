export type Role = 'admin' | 'coach' | 'parent'
export type MemberStatus = 'active' | 'suspended' | 'withdrawn'
export type AttendanceStatus = 'present' | 'absent' | 'makeup'
export type FeeStatus = 'unpaid' | 'paid' | 'overdue'
export type ApplicationStatus = 'pending' | 'contacted' | 'enrolled' | 'declined'
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: '日',
  1: '月',
  2: '火',
  3: '水',
  4: '木',
  5: '金',
  6: '土',
}

export interface School {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  invite_code: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  school_id: string | null
  role: Role
  name: string
  name_kana: string | null
  email: string | null
  phone: string | null
  line_user_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  school_id: string
  parent_id: string | null
  name: string
  name_kana: string | null
  birth_date: string | null
  gender: 'male' | 'female' | 'other' | null
  emergency_contact: string | null
  health_notes: string | null
  current_level: number
  status: MemberStatus
  qr_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  school_id: string
  name: string
  description: string | null
  level_min: number
  level_max: number
  coach_id: string | null
  capacity: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  class_id: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface Enrollment {
  id: string
  member_id: string
  class_id: string
  enrolled_at: string
  status: 'active' | 'suspended'
}

export interface AttendanceRecord {
  id: string
  member_id: string
  schedule_id: string
  lesson_date: string
  status: AttendanceStatus
  makeup_from_record_id: string | null
  notes: string | null
  recorded_by: string | null
  created_at: string
}

export interface MonthlyFee {
  id: string
  member_id: string
  school_id: string
  amount: number
  target_month: string
  status: FeeStatus
  stripe_subscription_id: string | null
  stripe_payment_intent_id: string | null
  paid_at: string | null
  due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GradeLevel {
  id: string
  school_id: string
  level: number
  name: string
  description: string | null
  badge_color: string
  criteria: GradeCriteria[]
  created_at: string
}

export interface GradeCriteria {
  id: string
  label: string
  description?: string
}

export interface GradeHistory {
  id: string
  member_id: string
  from_level: number
  to_level: number
  evaluated_by: string | null
  comment: string | null
  evaluated_at: string
}

export interface Announcement {
  id: string
  school_id: string
  title: string
  body: string
  target_type: 'all' | 'class' | 'parent'
  target_class_id: string | null
  is_published: boolean
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  school_id: string
  child_name: string
  child_birth_date: string | null
  parent_name: string
  parent_email: string
  parent_phone: string | null
  preferred_class: string | null
  message: string | null
  status: ApplicationStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// Extended types with joins
export interface MemberWithParent extends Member {
  parent?: Profile
}

export interface ClassWithCoach extends Class {
  coach?: Profile
  schedules?: Schedule[]
}

export interface MemberWithClass extends Member {
  enrollments?: Array<Enrollment & { class: Class }>
}

export interface AttendanceWithMember extends AttendanceRecord {
  member?: Member
}

export interface FeeWithMember extends MonthlyFee {
  member?: Member
}
