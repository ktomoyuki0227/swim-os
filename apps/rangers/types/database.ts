export type UserRole = "member" | "super_admin"

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
  target_ages: string[]
  rating_avg: number
  review_count: number
  stripe_account_id: string | null
  stripe_customer_id: string | null
  created_at: string
  // スイマー向けフィールド（マスターズチーム管理）
  furigana: string | null
  gender: "male" | "female" | "other" | null
  birthday: string | null
  address: string | null
  emergency_contact: string | null
  emergency_contact_name: string | null
  emergency_contact_relation: string | null
  swimwear_size: string | null
  masters_registered: boolean
  masters_number: string | null
  jsa_registered: boolean
  jsa_number: string | null
  phone: string | null
  onboarding_completed_at: string | null
  stripe_payment_method_id: string | null
  // スイマー情報（複数選択）
  level: string | null
  prefectures: string[]
  swimming_goals: string[]
  participation_styles: string[]
  swimmer_type: string | null
  swim_disciplines: string[]
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

/** 活動目的マスター */
export const SWIMMING_GOALS = [
  "競技・タイム向上",
  "健康維持",
  "ダイエット・体型管理",
  "楽しみ・趣味",
  "水泳再開（ブランクあり）",
  "リハビリ・体力回復",
  "マスターズ大会出場",
  "子どもへの指導",
] as const

export type SwimmingGoal = (typeof SWIMMING_GOALS)[number]

/** レベルマスター */
export const SWIM_LEVELS = ["初級", "中級", "上級"] as const
export type SwimLevel = (typeof SWIM_LEVELS)[number]

/** 参加スタイルマスター */
export const PARTICIPATION_STYLES = [
  "チーム練習",
  "パーソナルレッスン",
  "合宿・遠征",
  "大会・記録会",
  "自主練",
  "オープンウォーター",
] as const

export type ParticipationStyle = (typeof PARTICIPATION_STYLES)[number]

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

// ============================================================
// マスターズチーム管理
// ============================================================

/** セッション・メンバー絞り込みタグマスター */
export const SYSTEM_TAGS = [
  { id: "level_beginner",          label: "初級",            category: "レベル" },
  { id: "level_intermediate",      label: "中級",            category: "レベル" },
  { id: "level_advanced",          label: "上級",            category: "レベル" },
  { id: "stroke_freestyle",        label: "クロール",         category: "泳法" },
  { id: "stroke_backstroke",       label: "背泳ぎ",          category: "泳法" },
  { id: "stroke_breaststroke",     label: "平泳ぎ",          category: "泳法" },
  { id: "stroke_butterfly",        label: "バタフライ",       category: "泳法" },
  { id: "stroke_medley",           label: "個人メドレー",     category: "泳法" },
  { id: "purpose_health",          label: "健康維持",         category: "目的" },
  { id: "purpose_competitive",     label: "競技・タイム向上", category: "目的" },
  { id: "swimmer_type_player",     label: "選手",             category: "スイマータイプ" },
  { id: "swimmer_type_masters",    label: "マスターズ",       category: "スイマータイプ" },
  { id: "discipline_swimming",     label: "競泳",             category: "水泳カテゴリ" },
  { id: "discipline_synchro",      label: "シンクロ",         category: "水泳カテゴリ" },
  { id: "discipline_openwater",    label: "オープンウォーター", category: "水泳カテゴリ" },
  { id: "discipline_diving",       label: "飛び込み",         category: "水泳カテゴリ" },
  { id: "discipline_waterpolo",    label: "水球",             category: "水泳カテゴリ" },
] as const

export type SystemTagId = (typeof SYSTEM_TAGS)[number]["id"]

/** スイマータイプマスター */
export const SWIMMER_TYPES = ["選手", "マスターズ"] as const
export type SwimmerType = (typeof SWIMMER_TYPES)[number]

/** 水泳カテゴリマスター */
export const SWIM_DISCIPLINES = ["競泳", "シンクロ", "オープンウォーター", "飛び込み", "水球"] as const
export type SwimDiscipline = (typeof SWIM_DISCIPLINES)[number]

/** 練習頻度マスター */
export const PRACTICE_FREQUENCIES = ["週0〜1回（月3回程度）", "週1〜2回", "週2〜4回", "週5回以上"] as const
export type PracticeFrequency = (typeof PRACTICE_FREQUENCIES)[number]

/** 練習曜日マスター（日曜始まり） */
export const PRACTICE_DAYS = ["日", "月", "火", "水", "木", "金", "土"] as const
export type PracticeDay = (typeof PRACTICE_DAYS)[number]

export type TeamStatus = "active" | "inactive"
export type TeamMemberRole = "admin" | "member"
export type MembershipType = "annual" | "monthly" | "point_card"
export type JoinRequestStatus = "pending" | "approved" | "rejected"
export type SessionType = "practice" | "camp" | "competition" | "event" | "meeting"
export type SessionStatus = "open" | "confirmed" | "cancelled"
export type PaymentMethod = "stripe" | "cash" | "point_card"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "free"
export type FeeType = "annual" | "monthly"
export type FeeStatus = "unpaid" | "paid" | "failed"
export type StampPaymentStatus = "paid" | "unpaid" | "failed"
export type StampPaymentMethod = "cash" | "stripe"
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "unpaid"
export type TransferStatus = "pending" | "succeeded" | "failed" | "reversed"

export interface Team {
  id: string
  coach_id: string
  name: string
  description: string | null
  avatar_url: string | null
  cover_image_url: string | null
  is_recruiting: boolean
  activity_area: string | null
  invite_code: string
  has_session_fee: boolean
  has_annual_fee: boolean
  has_monthly_fee: boolean
  has_point_card: boolean
  default_member_price: number
  default_guest_price: number
  annual_fee_amount: number | null
  monthly_fee_amount: number | null
  cancellation_days: number
  point_card_count: number
  point_card_price: number | null
  practice_frequency: string | null
  practice_days: string[]
  main_pool: string | null
  stripe_monthly_price_id: string | null
  stripe_annual_price_id: string | null
  stripe_product_id: string | null
  stripe_account_id: string | null
  stripe_onboarding_completed: boolean
  fee_members_exempt_session: boolean
  status: TeamStatus
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  swimmer_id: string
  role: TeamMemberRole
  membership_type: MembershipType
  stamp_remaining: number
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus | null
  status: TeamStatus
  joined_at: string
}

export interface TeamMemberWithProfile extends TeamMember {
  swimmer: Pick<
    Profile,
    | "id" | "name" | "avatar_url" | "furigana" | "gender" | "birthday"
    | "address" | "emergency_contact" | "emergency_contact_name" | "emergency_contact_relation"
    | "masters_registered" | "masters_number" | "jsa_registered" | "jsa_number"
    | "specialties" | "prefectures" | "swimming_goals" | "participation_styles" | "level"
    | "swimmer_type" | "swim_disciplines" | "phone"
  > | null
}

export interface CourseRule {
  min: number
  max?: number
  courses: number
  cancel_below?: number
}

export interface CompetitionField {
  key: string
  label: string
  type: "text" | "select" | "number"
  required: boolean
  options?: string[]
}

export interface PriceView {
  id: string
  session_id: string
  viewer_id: string
  viewed_at: string
}

export interface PriceViewWithProfile extends PriceView {
  viewer: Pick<Profile, "id" | "name" | "avatar_url">
}

export interface PracticeSession {
  id: string
  team_id: string
  coach_id: string
  title: string
  description: string | null
  content: string | null
  type: SessionType
  scheduled_at: string
  location: string | null
  member_price: number
  guest_price: number
  registration_deadline: string | null
  min_participants: number | null
  max_participants: number | null
  course_rules: CourseRule[] | null
  target_tags: string[]
  target_members: string[] | null
  cancellation_days: number | null
  allow_point_card: boolean
  is_external: boolean
  is_lp_featured: boolean
  competition_fields: CompetitionField[] | null
  end_at: string | null
  meeting_point: string | null
  gender_filter: "all" | "male" | "female"
  session_status: SessionStatus
  status: LessonStatus
  created_at: string
}

export interface PracticeSessionWithTeam extends PracticeSession {
  team: Pick<Team, "id" | "name" | "avatar_url">
}

export interface SessionRegistration {
  id: string
  session_id: string
  swimmer_id: string
  is_member: boolean
  payment_method: PaymentMethod
  stripe_payment_intent_id: string | null
  payment_status: PaymentStatus
  competition_entry: Record<string, unknown> | null
  registered_at: string
  cancelled_at: string | null
}

export interface SessionRegistrationWithProfile extends SessionRegistration {
  swimmer: Pick<Profile, "id" | "name" | "avatar_url">
}

export interface MembershipFee {
  id: string
  team_id: string
  swimmer_id: string
  type: FeeType
  period: string
  amount: number
  payment_method: "stripe" | "cash"
  stripe_payment_intent_id: string | null
  stripe_subscription_id: string | null
  stripe_invoice_id: string | null
  status: FeeStatus
  paid_at: string | null
  note: string | null
  created_at: string
}

export interface MembershipFeeWithProfile extends MembershipFee {
  swimmer: Pick<Profile, "id" | "name" | "avatar_url">
}

export interface StampPurchase {
  id: string
  team_id: string
  swimmer_id: string
  card_count: number
  stamp_count: number
  amount: number
  note: string | null
  status: StampPaymentStatus
  payment_method: StampPaymentMethod
  purchased_at: string
  created_at: string
}

export interface StampPurchaseWithProfile extends StampPurchase {
  swimmer: Pick<Profile, "id" | "name" | "avatar_url">
}

export type NotificationType =
  | "join_request_received"
  | "join_request_approved"
  | "join_request_rejected"
  | "waitlist_available"
  | "payment_failed"
  | "inquiry_received"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  team_id: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface JoinRequest {
  id: string
  team_id: string
  swimmer_id: string
  membership_type: MembershipType
  status: JoinRequestStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface JoinRequestWithProfile extends JoinRequest {
  swimmer: Pick<Profile, "id" | "name" | "avatar_url" | "furigana"> | null
}

export interface SessionTemplate {
  id: string
  team_id: string
  name: string
  title: string
  description: string | null
  content: string | null
  type: SessionType
  location: string | null
  member_price: number
  guest_price: number
  deadline_days: number | null
  min_participants: number | null
  max_participants: number | null
  course_rules: CourseRule[] | null
  target_tags: string[]
  allow_point_card: boolean
  cancellation_days: number | null
  is_external: boolean
  created_at: string
}

export interface Announcement {
  id: string
  team_id: string
  author_id: string
  title: string
  body: string | null
  image_url: string | null
  link_url: string | null
  target_tags: string[]
  created_at: string
}

export interface AnnouncementWithAuthor extends Announcement {
  author: Pick<Profile, "id" | "name" | "avatar_url">
  read_count?: number
  is_read?: boolean
}

export interface AnnouncementRead {
  id: string
  announcement_id: string
  user_id: string
  read_at: string
}

export interface SystemTag {
  id: string
  category: string
  label: string
  sort_order: number
}

export interface TransferRecord {
  id: string
  team_id: string
  session_id: string | null
  registration_id: string | null
  stripe_payment_intent_id: string
  stripe_transfer_id: string | null
  amount: number
  platform_fee: number
  net_amount: number
  status: TransferStatus
  created_at: string
}

export interface PlatformSetting {
  key: string
  value: string
  description: string | null
  updated_at: string
}

