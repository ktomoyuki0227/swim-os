"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import {
  uploadAvatar,
  deleteAvatar,
  updateProfilePartial,
  getProfile,
} from "@/actions/profile"
import type { ProfilePartialInput } from "@/lib/validations"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/toast"
import type { Profile } from "@/types/database"
import { AvatarSection } from "./avatar-section"
import { BasicInfoCard } from "./basic-info-card"
import { SwimmerInfoCard } from "./swimmer-info-card"
import { EmergencyContactCard } from "./emergency-contact-card"
import { RegistrationInfoCard } from "./registration-info-card"
import { PublicProfileCard } from "./public-profile-card"
import {
  basicFromProfile,
  emergencyFromProfile,
  registrationFromProfile,
  swimmerFromProfile,
  publicFromProfile,
  type BasicForm,
  type EmergencyForm,
  type RegistrationForm,
  type SwimmerForm,
  type PublicForm,
} from "./profile-sections"

type EditingSection = "basic" | "swimmer" | "emergency" | "registration" | "public" | null

const EMPTY_BASIC: BasicForm = { name: "", furigana: "", gender: "", birthday: "", phone: "", address: "" }
const EMPTY_EMERGENCY: EmergencyForm = { emergencyContact: "", emergencyContactName: "", emergencyContactRelation: "" }
const EMPTY_REGISTRATION: RegistrationForm = { mastersRegistered: false, mastersNumber: "", jsaRegistered: false, jsaNumber: "", swimwearSize: "" }
const EMPTY_SWIMMER: SwimmerForm = { level: "", prefectures: [], specialties: [], swimmingGoals: [], participationStyles: [], swimmerType: "", swimDisciplines: [] }
const EMPTY_PUBLIC: PublicForm = { bio: "", career: "", achievements: "", targetAges: [] }

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition()
  const [isAvatarPending, startAvatarTransition] = useTransition()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<EditingSection>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const { showToast } = useToast()

  const [basicForm, setBasicForm] = useState<BasicForm>(EMPTY_BASIC)
  const [emergencyForm, setEmergencyForm] = useState<EmergencyForm>(EMPTY_EMERGENCY)
  const [registrationForm, setRegistrationForm] = useState<RegistrationForm>(EMPTY_REGISTRATION)
  const [swimmerForm, setSwimmerForm] = useState<SwimmerForm>(EMPTY_SWIMMER)
  const [publicForm, setPublicForm] = useState<PublicForm>(EMPTY_PUBLIC)

  // アバター
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getProfile(), createClient().auth.getUser()]).then(([p, { data }]) => {
      if (p) {
        const prof = p as Profile
        setProfile(prof)
        setBasicForm(basicFromProfile(prof))
        setEmergencyForm(emergencyFromProfile(prof))
        setRegistrationForm(registrationFromProfile(prof))
        setSwimmerForm(swimmerFromProfile(prof))
        setPublicForm(publicFromProfile(prof))
        setAvatarUrl(prof.avatar_url)
      }
      if (data.user?.email) setEmail(data.user.email)
      if (data.user?.id) setUserId(data.user.id)
    }).catch(() => {
      showToast("プロフィールの読み込みに失敗しました", "error")
    }).finally(() => setIsLoading(false))
  }, [showToast])

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current)
    }
  }, [])

  // ── アバター操作 ──────────────────────────────────────────────────

  const clearPreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setPreviewUrl(null)
  }

  const handleAvatarFileSelected = (file: File) => {
    // プレビュー表示（アップロード中）
    if (previewObjectUrlRef.current) URL.revokeObjectURL(previewObjectUrlRef.current)
    const url = URL.createObjectURL(file)
    previewObjectUrlRef.current = url
    setPreviewUrl(url)

    const formData = new FormData()
    formData.set("avatar", file)
    startAvatarTransition(async () => {
      try {
        const result = await uploadAvatar(formData)
        clearPreview()
        if (result.error) {
          showToast(result.error, "error")
        } else if (result.avatarUrl) {
          setAvatarUrl(result.avatarUrl)
          setProfile((prev) => (prev ? { ...prev, avatar_url: result.avatarUrl ?? null } : prev))
          showToast("画像を更新しました", "success")
        }
      } catch {
        clearPreview()
        showToast("画像のアップロードに失敗しました", "error")
      }
    })
  }

  const handleDeleteAvatar = () => {
    startAvatarTransition(async () => {
      try {
        const result = await deleteAvatar()
        if (result.error) {
          showToast(result.error, "error")
        } else {
          setAvatarUrl(null)
          setProfile((prev) => (prev ? { ...prev, avatar_url: null } : prev))
          showToast("写真を削除しました", "success")
        }
      } catch {
        showToast("削除に失敗しました", "error")
      }
    })
  }

  // ── キャンセル時に変更を破棄 ─────────────────────────────────────

  const cancelEdit = () => {
    if (!profile) { setEditingSection(null); return }
    switch (editingSection) {
      case "basic":
        setBasicForm(basicFromProfile(profile))
        break
      case "emergency":
        setEmergencyForm(emergencyFromProfile(profile))
        break
      case "registration":
        setRegistrationForm(registrationFromProfile(profile))
        break
      case "swimmer":
        setSwimmerForm(swimmerFromProfile(profile))
        break
      case "public":
        setPublicForm(publicFromProfile(profile))
        break
    }
    setEditingSection(null)
  }

  // ── セクション別保存 ──────────────────────────────────────────────

  const saveSection = (data: ProfilePartialInput) => {
    startTransition(async () => {
      try {
        const result = await updateProfilePartial(data)
        if (result.error) { showToast(result.error, "error"); return }
        // ProfilePartialInput はすべて Profile のサブセットなので安全にマージできる
        setProfile((prev) => (prev ? { ...prev, ...(data as Partial<Profile>) } : prev))
        showToast("保存しました", "success")
        setEditingSection(null)
      } catch {
        showToast("保存中にエラーが発生しました", "error")
      }
    })
  }

  const saveBasic = () => {
    if (!basicForm.name.trim()) { showToast("名前は必須です", "error"); return }
    const genderValue = (["male", "female", "other"] as const).includes(basicForm.gender as "male" | "female" | "other")
      ? (basicForm.gender as "male" | "female" | "other")
      : null
    saveSection({
      name: basicForm.name.trim(),
      furigana: basicForm.furigana || null,
      gender: genderValue,
      birthday: basicForm.birthday || null,
      phone: basicForm.phone || null,
      address: basicForm.address || null,
    })
  }

  const saveEmergency = () => {
    saveSection({
      emergency_contact: emergencyForm.emergencyContact || null,
      emergency_contact_name: emergencyForm.emergencyContactName || null,
      emergency_contact_relation: emergencyForm.emergencyContactRelation || null,
    })
  }

  const saveRegistration = () => {
    saveSection({
      masters_registered: registrationForm.mastersRegistered,
      masters_number: registrationForm.mastersNumber || null,
      jsa_registered: registrationForm.jsaRegistered,
      jsa_number: registrationForm.jsaNumber || null,
      swimwear_size: registrationForm.swimwearSize || null,
    })
  }

  const saveSwimmer = () => {
    saveSection({
      level: swimmerForm.level || null,
      prefectures: swimmerForm.prefectures,
      specialties: swimmerForm.specialties,
      swimming_goals: swimmerForm.swimmingGoals,
      participation_styles: swimmerForm.participationStyles,
      swimmer_type: swimmerForm.swimmerType || null,
      swim_disciplines: swimmerForm.swimDisciplines,
    })
  }

  const savePublic = () => {
    saveSection({
      bio: publicForm.bio || null,
      career: publicForm.career || null,
      achievements: publicForm.achievements || null,
      target_ages: publicForm.targetAges,
    })
  }

  // ── プロフィール完成度 ────────────────────────────────────────────

  const completenessFields = [
    !!basicForm.furigana, !!basicForm.gender, !!basicForm.birthday, !!basicForm.phone, !!basicForm.address,
    !!emergencyForm.emergencyContact,
    !!registrationForm.swimwearSize,
    !!publicForm.bio,
    !!swimmerForm.level,
    swimmerForm.prefectures.length > 0,
    swimmerForm.specialties.length > 0,
  ]
  const completedCount = completenessFields.filter(Boolean).length
  const remainingCount = completenessFields.length - completedCount
  const completeness = Math.round(completedCount / completenessFields.length * 100)

  const displayUrl = previewUrl ?? avatarUrl

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-[#1a2332]">プロフィール</h1>

      <AvatarSection
        isLoading={isLoading}
        isAvatarPending={isAvatarPending}
        name={basicForm.name}
        avatarUrl={avatarUrl}
        displayUrl={displayUrl}
        completeness={completeness}
        remainingCount={remainingCount}
        onFileSelected={handleAvatarFileSelected}
        onDelete={handleDeleteAvatar}
      />

      <BasicInfoCard
        isLoading={isLoading}
        isEditing={editingSection === "basic"}
        canEdit={editingSection === null && !isLoading}
        isPending={isPending}
        email={email}
        form={basicForm}
        onChange={setBasicForm}
        onEdit={() => setEditingSection("basic")}
        onCancel={cancelEdit}
        onSave={saveBasic}
      />

      <SwimmerInfoCard
        isLoading={isLoading}
        isEditing={editingSection === "swimmer"}
        canEdit={editingSection === null && !isLoading}
        isPending={isPending}
        form={swimmerForm}
        onChange={setSwimmerForm}
        onEdit={() => setEditingSection("swimmer")}
        onCancel={cancelEdit}
        onSave={saveSwimmer}
      />

      <EmergencyContactCard
        isLoading={isLoading}
        isEditing={editingSection === "emergency"}
        canEdit={editingSection === null && !isLoading}
        isPending={isPending}
        form={emergencyForm}
        onChange={setEmergencyForm}
        onEdit={() => setEditingSection("emergency")}
        onCancel={cancelEdit}
        onSave={saveEmergency}
      />

      <RegistrationInfoCard
        isLoading={isLoading}
        isEditing={editingSection === "registration"}
        canEdit={editingSection === null && !isLoading}
        isPending={isPending}
        form={registrationForm}
        onChange={setRegistrationForm}
        onEdit={() => setEditingSection("registration")}
        onCancel={cancelEdit}
        onSave={saveRegistration}
      />

      <PublicProfileCard
        isLoading={isLoading}
        isEditing={editingSection === "public"}
        canEdit={editingSection === null && !isLoading}
        isPending={isPending}
        userId={userId}
        form={publicForm}
        onChange={setPublicForm}
        onEdit={() => setEditingSection("public")}
        onCancel={cancelEdit}
        onSave={savePublic}
      />

      <div className="pb-10" />
    </div>
  )
}
