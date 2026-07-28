export interface PersonalInfoForm {
  furigana: string
  birthYear: string
  birthMonth: string
  birthDay: string
  gender: "male" | "female" | "other" | ""
  phone: string
  address: string
  emergency_contact_name: string
  emergency_contact_relation: string
  emergency_contact: string
  masters_registered: boolean
  masters_number: string
  jsa_registered: boolean
  jsa_number: string
}

export interface SwimmerProfileForm {
  avatarFile: File | null
  avatarPreview: string | null
  level: string
  specialties: string[]
  goals: string[]
  prefectures: string[]
  swimmerType: string
  swimDisciplines: string[]
  bio: string
}

export function toggleItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((v) => v !== item) : [...list, item]
}
