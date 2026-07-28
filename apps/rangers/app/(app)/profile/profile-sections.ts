import type { Profile } from "@/types/database"

// プロフィールページの各セクションのフォーム状態を単一のオブジェクトとして持つ。
// 「初期ロード時」「編集キャンセル時」の両方が同じ *FromProfile() を使うことで、
// フィールドを追加した際にどこか1箇所を更新し忘れるリスクを防ぐ
// (以前は各フィールドが個別のuseStateで、ロード・キャンセル・保存の3箇所に
// フィールド一覧が手書きでコピーされていた)。

export interface BasicForm {
  name: string
  furigana: string
  gender: string
  birthday: string
  phone: string
  address: string
}

export function basicFromProfile(p: Profile): BasicForm {
  return {
    name: p.name,
    furigana: p.furigana ?? "",
    gender: p.gender ?? "",
    birthday: p.birthday ?? "",
    phone: p.phone ?? "",
    address: p.address ?? "",
  }
}

export interface EmergencyForm {
  emergencyContact: string
  emergencyContactName: string
  emergencyContactRelation: string
}

export function emergencyFromProfile(p: Profile): EmergencyForm {
  return {
    emergencyContact: p.emergency_contact ?? "",
    emergencyContactName: p.emergency_contact_name ?? "",
    emergencyContactRelation: p.emergency_contact_relation ?? "",
  }
}

export interface RegistrationForm {
  mastersRegistered: boolean
  mastersNumber: string
  jsaRegistered: boolean
  jsaNumber: string
  swimwearSize: string
}

export function registrationFromProfile(p: Profile): RegistrationForm {
  return {
    mastersRegistered: p.masters_registered ?? false,
    mastersNumber: p.masters_number ?? "",
    jsaRegistered: p.jsa_registered ?? false,
    jsaNumber: p.jsa_number ?? "",
    swimwearSize: p.swimwear_size ?? "",
  }
}

export interface SwimmerForm {
  level: string
  prefectures: string[]
  specialties: string[]
  swimmingGoals: string[]
  participationStyles: string[]
  swimmerType: string
  swimDisciplines: string[]
}

export function swimmerFromProfile(p: Profile): SwimmerForm {
  return {
    level: p.level ?? "",
    prefectures: p.prefectures ?? [],
    specialties: p.specialties ?? [],
    swimmingGoals: p.swimming_goals ?? [],
    participationStyles: p.participation_styles ?? [],
    swimmerType: p.swimmer_type ?? "",
    swimDisciplines: p.swim_disciplines ?? [],
  }
}

export interface PublicForm {
  bio: string
  career: string
  achievements: string
  targetAges: string[]
}

export function publicFromProfile(p: Profile): PublicForm {
  return {
    bio: p.bio ?? "",
    career: p.career ?? "",
    achievements: p.achievements ?? "",
    targetAges: p.target_ages ?? [],
  }
}
