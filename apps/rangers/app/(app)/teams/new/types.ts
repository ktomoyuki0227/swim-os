export type TeamType = "team" | "personal"

export interface BasicFormData {
  name: string
  description: string
  career: string
  bio: string
  target_ages: string[]
  is_recruiting: boolean
  show_member_count: boolean
  activity_area: string
  main_pool: string
  practice_frequency: string
  practice_days: string[]
  contact_email: string
  contact_phone: string
}

export interface ImageData {
  coverFile: File | null
  iconFile: File | null
  coverPreview: string | null
  iconPreview: string | null
}

export interface FeeFormData {
  hasSessionFee: boolean
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  annualFeeAmount: string
  monthlyFeeAmount: string
  defaultMemberPrice: string
  defaultGuestPrice: string
  pointCardCount: string
  pointCardPrice: string
}
