"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  uploadAvatar,
  deleteAvatar,
  updateProfilePartial,
  getProfile,
} from "@/actions/profile"
import type { ProfilePartialInput } from "@/lib/validations"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/toast"
import { SWIM_SPECIALTIES, TARGET_AGES, PREFECTURES, SWIMMING_GOALS, PARTICIPATION_STYLES, SWIM_LEVELS, SWIMMER_TYPES, SWIM_DISCIPLINES } from "@/types/database"
import type { Profile } from "@/types/database"

type EditingSection = "basic" | "swimmer" | "emergency" | "registration" | "public" | null

// ── 表示用ヘルパー ────────────────────────────────────────────────

function ProfileRow({ label, value, muted }: { label: string; value: string | null | undefined; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f2f7fa] py-3 last:border-0">
      <span className="min-w-[7rem] shrink-0 text-xs text-[#64748b]">{label}</span>
      <span className={value && !muted ? "text-right text-sm text-[#1a2332]" : "text-right text-sm text-[#64748b]"}>
        {value || "未設定"}
      </span>
    </div>
  )
}

function ProfileBlockRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border-b border-[#f2f7fa] py-3 last:border-0">
      <span className="text-xs text-[#64748b]">{label}</span>
      <p className={`mt-0.5 whitespace-pre-wrap text-sm leading-relaxed ${value ? "text-[#1a2332]" : "text-[#64748b]"}`}>
        {value || "未設定"}
      </p>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-[#005F8C]" : "bg-[#dce3ea]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}

function PrivacyBadge({ type }: { type: "private" | "public" }) {
  if (type === "private") {
    return (
      <span className="flex items-center gap-1 text-xs text-[#64748b]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        管理者のみ
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-[#005F8C]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      一般公開
    </span>
  )
}

function TagGroup({
  label,
  items,
  selected,
  onChange,
}: {
  label: string
  items: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (item: string) =>
    onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item])
  return (
    <div className="space-y-2">
      <Label className="text-sm text-[#475569]">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`rounded-full border px-[14px] py-[6px] text-sm transition-colors ${selected.includes(item) ? "border-transparent bg-[#005F8C] text-white" : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C] hover:text-[#005F8C]"}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function TagRow({ label, items, maxVisible = Infinity }: { label: string; items: string[]; maxVisible?: number }) {
  const [expanded, setExpanded] = useState(false)
  // items が変わったら展開状態をリセットする（レンダー中にstateを調整する公式パターン）
  const [prevItems, setPrevItems] = useState(items)
  if (items !== prevItems) {
    setPrevItems(items)
    setExpanded(false)
  }
  const shouldCollapse = !expanded && items.length > maxVisible
  const visible = shouldCollapse ? items.slice(0, maxVisible) : items
  const hiddenCount = Math.max(0, items.length - maxVisible)

  return (
    <div className="border-b border-[#f2f7fa] py-3 last:border-0">
      <span className="mb-1.5 block text-xs text-[#64748b]">{label}</span>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((item) => (
            <span key={item} className="rounded-full bg-[#005F8C]/10 px-[10px] py-[3px] text-xs text-[#005F8C]">{item}</span>
          ))}
          {shouldCollapse && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-xs text-[#005F8C] underline underline-offset-2 transition-colors hover:text-[#004E73]"
            >
              +{hiddenCount}件
            </button>
          )}
          {expanded && items.length > maxVisible && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-[#005F8C] underline underline-offset-2 transition-colors hover:text-[#004E73]"
            >
              折りたたむ
            </button>
          )}
        </div>
      ) : (
        <span className="text-sm text-[#64748b]">未設定</span>
      )}
    </div>
  )
}

function PrefectureMultiSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const toggle = (p: string) =>
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="space-y-1.5">
      <Label className="text-sm text-[#475569]">活動地域</Label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] w-full items-center justify-between rounded-[10px] border border-[#dce3ea] bg-white px-4 text-sm text-[#1a2332] hover:border-[#005F8C]/50 focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30"
      >
        <span className={selected.length === 0 ? "text-[#64748b]" : ""}>
          {selected.length === 0 ? "選択してください（複数可）" : `${selected.length}地域を選択中`}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`shrink-0 text-[#64748b] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((p) => (
            <span key={p} className="flex items-center gap-1 rounded-full bg-[#005F8C]/10 px-[10px] py-[3px] text-xs text-[#005F8C]">
              {p}
              <button type="button" onClick={() => toggle(p)} className="leading-none hover:text-[#c0392b]">×</button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="rounded-[10px] border border-[#dce3ea] bg-white p-3">
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 sm:grid-cols-4">
            {PREFECTURES.map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-1.5 rounded-[6px] px-1 py-1 text-xs hover:bg-[#f2f7fa]">
                <input
                  type="checkbox"
                  checked={selected.includes(p)}
                  onChange={() => toggle(p)}
                  className="h-3.5 w-3.5 rounded accent-[#005F8C]"
                />
                {p}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PencilButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[#64748b] transition-colors hover:bg-[#f2f7fa] hover:text-[#005F8C]"
      aria-label="編集"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  )
}

function EditActions({
  onCancel,
  onSave,
  isPending,
}: {
  onCancel: () => void
  onSave: () => void
  isPending: boolean
}) {
  return (
    <div className="-mx-4 -mb-4 mt-4 border-t border-[#e8edf2] bg-[#f2f7fa] px-4 py-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 rounded-full border-[#dce3ea] text-[#475569]"
          onClick={onCancel}
          disabled={isPending}
        >
          キャンセル
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73] text-white"
          onClick={onSave}
          disabled={isPending}
        >
          {isPending ? "保存中..." : "保存する"}
        </Button>
      </div>
    </div>
  )
}

// ── メインコンポーネント ──────────────────────────────────────────

export default function ProfilePage() {
  const [isPending, startTransition] = useTransition()
  const [isAvatarPending, startAvatarTransition] = useTransition()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<EditingSection>(null)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const avatarMenuRef = useRef<HTMLDivElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const { showToast } = useToast()

  // 基本情報
  const [name, setName] = useState("")
  const [furigana, setFurigana] = useState("")
  const [gender, setGender] = useState("")
  const [birthday, setBirthday] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")

  // 緊急連絡先
  const [emergencyContact, setEmergencyContact] = useState("")
  const [emergencyContactName, setEmergencyContactName] = useState("")
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("")

  // 登録情報（水着サイズをここに移動）
  const [mastersRegistered, setMastersRegistered] = useState(false)
  const [mastersNumber, setMastersNumber] = useState("")
  const [jsaRegistered, setJsaRegistered] = useState(false)
  const [jsaNumber, setJsaNumber] = useState("")
  const [swimwearSize, setSwimwearSize] = useState("")

  // スイマー情報
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [prefectures, setPrefectures] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [swimmingGoals, setSwimmingGoals] = useState<string[]>([])
  const [participationStyles, setParticipationStyles] = useState<string[]>([])
  const [selectedSwimmerType, setSelectedSwimmerType] = useState<string>("")
  const [swimDisciplines, setSwimDisciplines] = useState<string[]>([])

  // 公開プロフィール
  const [bio, setBio] = useState("")
  const [career, setCareer] = useState("")
  const [achievements, setAchievements] = useState("")
  const [targetAges, setTargetAges] = useState<string[]>([])

  // アバター
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // アバターメニューの外側クリックで閉じる
  useEffect(() => {
    if (!avatarMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [avatarMenuOpen])

  useEffect(() => {
    Promise.all([getProfile(), createClient().auth.getUser()]).then(([p, { data }]) => {
      if (p) {
        const prof = p as Profile
        setProfile(prof)
        setName(prof.name)
        setFurigana(prof.furigana ?? "")
        setGender(prof.gender ?? "")
        setBirthday(prof.birthday ?? "")
        setPhone(prof.phone ?? "")
        setAddress(prof.address ?? "")
        setEmergencyContact(prof.emergency_contact ?? "")
        setEmergencyContactName(prof.emergency_contact_name ?? "")
        setEmergencyContactRelation(prof.emergency_contact_relation ?? "")
        setMastersRegistered(prof.masters_registered ?? false)
        setMastersNumber(prof.masters_number ?? "")
        setJsaRegistered(prof.jsa_registered ?? false)
        setJsaNumber(prof.jsa_number ?? "")
        setSwimwearSize(prof.swimwear_size ?? "")
        setSelectedLevel(prof.level ?? "")
        setPrefectures(prof.prefectures ?? [])
        setSpecialties(prof.specialties ?? [])
        setSwimmingGoals(prof.swimming_goals ?? [])
        setParticipationStyles(prof.participation_styles ?? [])
        setSelectedSwimmerType(prof.swimmer_type ?? "")
        setSwimDisciplines(prof.swim_disciplines ?? [])
        setBio(prof.bio ?? "")
        setCareer(prof.career ?? "")
        setAchievements(prof.achievements ?? "")
        setTargetAges(prof.target_ages ?? [])
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

  // ── キャンセル時に変更を破棄 ─────────────────────────────────────

  // ── アバター操作 ──────────────────────────────────────────────────

  const clearPreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setPreviewUrl(null)
    if (libraryInputRef.current) libraryInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarMenuOpen(false)

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
          if (profile) setProfile({ ...profile, avatar_url: result.avatarUrl })
          showToast("画像を更新しました", "success")
        }
      } catch {
        clearPreview()
        showToast("画像のアップロードに失敗しました", "error")
      }
    })
  }

  const handleDeleteAvatar = () => {
    setAvatarMenuOpen(false)
    startAvatarTransition(async () => {
      try {
        const result = await deleteAvatar()
        if (result.error) {
          showToast(result.error, "error")
        } else {
          setAvatarUrl(null)
          if (profile) setProfile({ ...profile, avatar_url: null })
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
        setName(profile.name ?? "")
        setFurigana(profile.furigana ?? "")
        setGender(profile.gender ?? "")
        setBirthday(profile.birthday ?? "")
        setPhone(profile.phone ?? "")
        setAddress(profile.address ?? "")
        break
      case "emergency":
        setEmergencyContact(profile.emergency_contact ?? "")
        setEmergencyContactName(profile.emergency_contact_name ?? "")
        setEmergencyContactRelation(profile.emergency_contact_relation ?? "")
        break
      case "registration":
        setMastersRegistered(profile.masters_registered ?? false)
        setMastersNumber(profile.masters_number ?? "")
        setJsaRegistered(profile.jsa_registered ?? false)
        setJsaNumber(profile.jsa_number ?? "")
        setSwimwearSize(profile.swimwear_size ?? "")
        break
      case "swimmer":
        setSelectedLevel(profile.level ?? "")
        setPrefectures(profile.prefectures ?? [])
        setSpecialties(profile.specialties ?? [])
        setSwimmingGoals(profile.swimming_goals ?? [])
        setParticipationStyles(profile.participation_styles ?? [])
        setSelectedSwimmerType(profile.swimmer_type ?? "")
        setSwimDisciplines(profile.swim_disciplines ?? [])
        break
      case "public":
        setBio(profile.bio ?? "")
        setCareer(profile.career ?? "")
        setAchievements(profile.achievements ?? "")
        setTargetAges(profile.target_ages ?? [])
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
        if (profile) setProfile({ ...profile, ...(data as Partial<Profile>) })
        showToast("保存しました", "success")
        setEditingSection(null)
      } catch {
        showToast("保存中にエラーが発生しました", "error")
      }
    })
  }

  const saveBasic = () => {
    if (!name.trim()) { showToast("名前は必須です", "error"); return }
    const genderValue = (["male", "female", "other"] as const).includes(gender as "male" | "female" | "other")
      ? (gender as "male" | "female" | "other")
      : null
    saveSection({ name: name.trim(), furigana: furigana || null, gender: genderValue, birthday: birthday || null, phone: phone || null, address: address || null })
  }

  const saveEmergency = () => {
    saveSection({ emergency_contact: emergencyContact || null, emergency_contact_name: emergencyContactName || null, emergency_contact_relation: emergencyContactRelation || null })
  }

  const saveRegistration = () => {
    saveSection({ masters_registered: mastersRegistered, masters_number: mastersNumber || null, jsa_registered: jsaRegistered, jsa_number: jsaNumber || null, swimwear_size: swimwearSize || null })
  }

  const saveSwimmer = () => {
    saveSection({
      level: selectedLevel || null,
      prefectures,
      specialties,
      swimming_goals: swimmingGoals,
      participation_styles: participationStyles,
      swimmer_type: selectedSwimmerType || null,
      swim_disciplines: swimDisciplines,
    })
  }

  const savePublic = () => {
    saveSection({ bio: bio || null, career: career || null, achievements: achievements || null, target_ages: targetAges })
  }

  // ── プロフィール完成度 ────────────────────────────────────────────

  const completenessFields = [
    !!furigana, !!gender, !!birthday, !!phone, !!address,
    !!emergencyContact,
    !!swimwearSize,
    !!bio,
    !!selectedLevel,
    prefectures.length > 0,
    specialties.length > 0,
  ]
  const completedCount = completenessFields.filter(Boolean).length
  const remainingCount = completenessFields.length - completedCount
  const completeness = Math.round(completedCount / completenessFields.length * 100)

  // ── 表示用変換 ────────────────────────────────────────────────────

  const initials = name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  const displayUrl = previewUrl ?? avatarUrl
  const genderLabel = gender === "male" ? "男性" : gender === "female" ? "女性" : gender === "other" ? "その他" : null
  const birthdayLabel = birthday ? birthday.replace(/-/g, "/") : null

  // ── JSX ──────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-[#1a2332]">プロフィール</h1>

      {/* アバター・完成度 */}
      <div className="pt-2 space-y-4">
          {/* アバター（中央揃え） */}
          <div className="flex justify-center">
            <div ref={avatarMenuRef} className="relative">
              {/* アバター本体（タップで開く） */}
              <button
                type="button"
                onClick={() => !isAvatarPending && setAvatarMenuOpen((v) => !v)}
                className="relative h-20 w-20 cursor-pointer rounded-full ring-2 ring-[#dce3ea] focus:outline-none focus-visible:ring-[#005F8C]"
                aria-label="プロフィール写真を変更"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Skeleton className="h-20 w-20 rounded-full" />
                ) : displayUrl ? (
                  <Image src={displayUrl} alt={name} fill className="rounded-full object-cover" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#005F8C]/10 text-xl font-semibold text-[#005F8C]">
                    {initials || "?"}
                  </span>
                )}
                {/* アップロード中オーバーレイ */}
                {isAvatarPending && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </button>

              {/* カメラアイコン（右下）— 視覚補助のみ。フォーカスと aria はアバターボタン側で担う */}
              {!isLoading && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#005F8C] text-white shadow ring-2 ring-white"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              )}

              {/* 非表示ファイル入力（フォトライブラリ） */}
              <input
                ref={libraryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isAvatarPending}
                onChange={handleAvatarFileSelected}
              />
              {/* 非表示ファイル入力（カメラ） */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                disabled={isAvatarPending}
                onChange={handleAvatarFileSelected}
              />

              {/* オプションメニュー */}
              {avatarMenuOpen && (
                <div className="absolute left-1/2 top-full z-20 mt-2 w-44 -translate-x-1/2 overflow-hidden rounded-[10px] border border-[#dce3ea] bg-white shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 min-h-[44px] text-sm text-[#1a2332] hover:bg-[#f2f7fa] transition-colors"
                    onClick={() => { setAvatarMenuOpen(false); libraryInputRef.current?.click() }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    フォトライブラリ
                  </button>
                  <div className="border-t border-[#e8edf2]" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 min-h-[44px] text-sm text-[#1a2332] hover:bg-[#f2f7fa] transition-colors"
                    onClick={() => { setAvatarMenuOpen(false); cameraInputRef.current?.click() }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    カメラ
                  </button>
                  {!isAvatarPending && avatarUrl && (
                    <>
                      <div className="border-t border-[#e8edf2]" />
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 min-h-[44px] text-sm text-[#c0392b] hover:bg-[#fdecea] transition-colors"
                        onClick={handleDeleteAvatar}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                        写真を削除
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 完成度 */}
          {!isLoading && (
            <div className="rounded-[14px] bg-[#f2f7fa] px-4 py-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-[#475569]">プロフィール完成度</span>
                <div className="flex items-center gap-2">
                  {remainingCount > 0 && (
                    <span className="text-xs text-[#64748b]">あと{remainingCount}項目</span>
                  )}
                  <span className="text-xs font-semibold text-[#005F8C]">{completeness}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#dce3ea]">
                <div className="h-2 rounded-full bg-[#005F8C] transition-all duration-500" style={{ width: `${completeness}%` }} />
              </div>
              {completeness === 100 && (
                <p className="mt-1.5 text-xs text-[#005F8C]">
                  プロフィールが完成しました！
                </p>
              )}
            </div>
          )}
      </div>

      {/* 基本情報 */}
      <Card className={`border-[#dce3ea] transition-shadow ${editingSection === "basic" ? "ring-2 ring-[#005F8C]/20" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#1a2332]">基本情報</CardTitle>
            <div className="flex items-center gap-2">
              <PrivacyBadge type="private" />
              {editingSection === null && !isLoading && <PencilButton onClick={() => setEditingSection("basic")} />}
              {editingSection === "basic" && <span className="text-xs font-medium text-[#005F8C]">編集中</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : editingSection === "basic" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm text-[#475569]">名前 <span className="text-[#c0392b]">*</span></Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="border-[#dce3ea]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="furigana" className="text-sm text-[#475569]">フリガナ</Label>
                  <Input id="furigana" value={furigana} onChange={(e) => setFurigana(e.target.value)} placeholder="ヤマダ ケンタ" className="border-[#dce3ea]" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-sm text-[#475569]">性別</Label>
                  <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="min-h-[48px] w-full rounded-[10px] border border-[#dce3ea] bg-white px-4 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30">
                    <option value="">選択</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="birthday" className="text-sm text-[#475569]">生年月日</Label>
                  <Input id="birthday" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="border-[#dce3ea]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">メールアドレス</Label>
                <div className="flex min-h-[48px] items-center rounded-[10px] bg-[#f2f7fa] px-4 text-sm text-[#64748b]">
                  {email}
                </div>
                <p className="text-xs text-[#64748b]">メールアドレスはアカウント設定から変更できます</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm text-[#475569]">電話番号</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09012345678" className="border-[#dce3ea]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm text-[#475569]">住所</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="例: 東京都渋谷区..." className="border-[#dce3ea]" />
              </div>
              <EditActions onCancel={cancelEdit} onSave={saveBasic} isPending={isPending} />
            </div>
          ) : (
            <div>
              <ProfileRow label="名前" value={name || null} />
              <ProfileRow label="フリガナ" value={furigana || null} />
              <ProfileRow label="性別" value={genderLabel} />
              <ProfileRow label="生年月日" value={birthdayLabel} />
              <ProfileRow label="メールアドレス" value={email || null} />
              <ProfileRow label="電話番号" value={phone || null} />
              <ProfileRow label="住所" value={address || null} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* スイマー情報 */}
      <Card className={`border-[#dce3ea] transition-shadow ${editingSection === "swimmer" ? "ring-2 ring-[#005F8C]/20" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base text-[#1a2332]">スイマー情報</CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              <PrivacyBadge type="public" />
              {editingSection === null && !isLoading && <PencilButton onClick={() => setEditingSection("swimmer")} />}
              {editingSection === "swimmer" && <span className="text-xs font-medium text-[#005F8C]">編集中</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : editingSection === "swimmer" ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">レベル</Label>
                <div className="flex gap-2">
                  {SWIM_LEVELS.map((lv) => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => setSelectedLevel(selectedLevel === lv ? "" : lv)}
                      className={`flex-1 rounded-full border py-2 text-sm transition-colors ${selectedLevel === lv ? "border-transparent bg-[#005F8C] text-white" : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C] hover:text-[#005F8C]"}`}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              </div>
              <PrefectureMultiSelect selected={prefectures} onChange={setPrefectures} />
              <TagGroup
                label="種目・泳法"
                items={SWIM_SPECIALTIES}
                selected={specialties}
                onChange={setSpecialties}
              />
              <TagGroup
                label="活動目的"
                items={SWIMMING_GOALS}
                selected={swimmingGoals}
                onChange={setSwimmingGoals}
              />
              <TagGroup
                label="参加スタイル"
                items={PARTICIPATION_STYLES}
                selected={participationStyles}
                onChange={setParticipationStyles}
              />
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">スイマータイプ</Label>
                <div className="flex gap-2">
                  {SWIMMER_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedSwimmerType(selectedSwimmerType === t ? "" : t)}
                      className={`flex-1 rounded-full border py-2 text-sm transition-colors ${selectedSwimmerType === t ? "border-transparent bg-[#005F8C] text-white" : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C] hover:text-[#005F8C]"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <TagGroup
                label="水泳カテゴリ"
                items={SWIM_DISCIPLINES}
                selected={swimDisciplines}
                onChange={setSwimDisciplines}
              />
              <EditActions onCancel={cancelEdit} onSave={saveSwimmer} isPending={isPending} />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="border-b border-[#f2f7fa] py-3">
                <span className="mb-1.5 block text-xs text-[#64748b]">レベル</span>
                {selectedLevel ? (
                  <span className="rounded-full bg-[#f2f7fa] px-[10px] py-[3px] text-xs text-[#475569]">{selectedLevel}</span>
                ) : (
                  <span className="text-sm text-[#64748b]">未設定</span>
                )}
              </div>
              <TagRow label="活動地域" items={prefectures} maxVisible={5} />
              <TagRow label="種目・泳法" items={specialties} />
              <TagRow label="活動目的" items={swimmingGoals} />
              <TagRow label="参加スタイル" items={participationStyles} />
              <div className="border-b border-[#f2f7fa] py-3">
                <span className="mb-1.5 block text-xs text-[#64748b]">スイマータイプ</span>
                {selectedSwimmerType ? (
                  <span className="rounded-full bg-[#f2f7fa] px-[10px] py-[3px] text-xs text-[#475569]">{selectedSwimmerType}</span>
                ) : (
                  <span className="text-sm text-[#64748b]">未設定</span>
                )}
              </div>
              <TagRow label="水泳カテゴリ" items={swimDisciplines} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 緊急連絡先 */}
      <Card className={`border-[#dce3ea] transition-shadow ${editingSection === "emergency" ? "ring-2 ring-[#005F8C]/20" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#1a2332]">緊急連絡先</CardTitle>
            <div className="flex items-center gap-2">
              <PrivacyBadge type="private" />
              {editingSection === null && !isLoading && <PencilButton onClick={() => setEditingSection("emergency")} />}
              {editingSection === "emergency" && <span className="text-xs font-medium text-[#005F8C]">編集中</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : editingSection === "emergency" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact" className="text-sm text-[#475569]">電話番号</Label>
                <Input id="emergency_contact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="090-0000-0000" className="border-[#dce3ea]" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_name" className="text-sm text-[#475569]">氏名</Label>
                  <Input id="emergency_contact_name" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="山田花子" className="border-[#dce3ea]" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emergency_contact_relation" className="text-sm text-[#475569]">続柄</Label>
                  <Input id="emergency_contact_relation" value={emergencyContactRelation} onChange={(e) => setEmergencyContactRelation(e.target.value)} placeholder="母・配偶者" className="border-[#dce3ea]" />
                </div>
              </div>
              <EditActions onCancel={cancelEdit} onSave={saveEmergency} isPending={isPending} />
            </div>
          ) : (
            <div>
              <ProfileRow label="電話番号" value={emergencyContact || null} />
              <ProfileRow label="氏名" value={emergencyContactName || null} />
              <ProfileRow label="続柄" value={emergencyContactRelation || null} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 登録情報（水着サイズを含む） */}
      <Card className={`border-[#dce3ea] transition-shadow ${editingSection === "registration" ? "ring-2 ring-[#005F8C]/20" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#1a2332]">登録情報</CardTitle>
            <div className="flex items-center gap-2">
              <PrivacyBadge type="private" />
              {editingSection === null && !isLoading && <PencilButton onClick={() => setEditingSection("registration")} />}
              {editingSection === "registration" && <span className="text-xs font-medium text-[#005F8C]">編集中</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : editingSection === "registration" ? (
            <div className="space-y-5">
              {/* マスターズ */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <Toggle checked={mastersRegistered} onChange={setMastersRegistered} />
                  <span className="text-sm font-medium text-[#1a2332]">マスターズ登録あり</span>
                </label>
                {mastersRegistered && (
                  <div className="space-y-1.5 pl-14">
                    <Label htmlFor="masters_number" className="text-sm text-[#475569]">登録番号</Label>
                    <Input id="masters_number" value={mastersNumber} onChange={(e) => setMastersNumber(e.target.value)} placeholder="登録番号" className="border-[#dce3ea]" />
                  </div>
                )}
              </div>
              <div className="border-t border-[#dce3ea]" />
              {/* JSA */}
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <Toggle checked={jsaRegistered} onChange={setJsaRegistered} />
                  <span className="text-sm font-medium text-[#1a2332]">日本水泳連盟登録あり</span>
                </label>
                {jsaRegistered && (
                  <div className="space-y-1.5 pl-14">
                    <Label htmlFor="jsa_number" className="text-sm text-[#475569]">登録番号</Label>
                    <Input id="jsa_number" value={jsaNumber} onChange={(e) => setJsaNumber(e.target.value)} placeholder="登録番号" className="border-[#dce3ea]" />
                  </div>
                )}
              </div>
              <div className="border-t border-[#dce3ea]" />
              {/* 水着サイズ */}
              <div className="space-y-1.5">
                <Label htmlFor="swimwear_size" className="text-sm text-[#475569]">水着サイズ</Label>
                <Input id="swimwear_size" value={swimwearSize} onChange={(e) => setSwimwearSize(e.target.value)} placeholder="例: S・M・L・XL" className="border-[#dce3ea]" />
              </div>
              <EditActions onCancel={cancelEdit} onSave={saveRegistration} isPending={isPending} />
            </div>
          ) : (
            <div>
              <ProfileRow label="マスターズ" value={mastersRegistered ? "登録あり" : "未登録"} muted={!mastersRegistered} />
              {mastersRegistered && <ProfileRow label="登録番号" value={mastersNumber || null} />}
              <ProfileRow label="日本水泳連盟" value={jsaRegistered ? "登録あり" : "未登録"} muted={!jsaRegistered} />
              {jsaRegistered && <ProfileRow label="登録番号" value={jsaNumber || null} />}
              <ProfileRow label="水着サイズ" value={swimwearSize || null} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 公開プロフィール */}
      <Card className={`border-[#dce3ea] transition-shadow ${editingSection === "public" ? "ring-2 ring-[#005F8C]/20" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base text-[#1a2332]">公開プロフィール</CardTitle>
              <p className="mt-0.5 text-xs text-[#64748b]">他のユーザーに公開されます</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <PrivacyBadge type="public" />
              {editingSection === null && !isLoading && <PencilButton onClick={() => setEditingSection("public")} />}
              {editingSection === "public" && <span className="text-xs font-medium text-[#005F8C]">編集中</span>}
            </div>
          </div>
          {editingSection === null && userId && (
            <Link
              href={`/profiles/${userId}`}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[#005F8C] hover:underline"
            >
              公開プレビューを見る
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : editingSection === "public" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-sm text-[#475569]">自己紹介</Label>
                <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="指導スタイルや強みを教えてください" className="w-full resize-none rounded-[10px] border border-[#dce3ea] bg-white px-4 py-3 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="career" className="text-sm text-[#475569]">経歴</Label>
                <textarea id="career" value={career} onChange={(e) => setCareer(e.target.value)} rows={3} placeholder="例: ○○大学水泳部、指導歴10年" className="w-full resize-none rounded-[10px] border border-[#dce3ea] bg-white px-4 py-3 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="achievements" className="text-sm text-[#475569]">実績</Label>
                <textarea id="achievements" value={achievements} onChange={(e) => setAchievements(e.target.value)} rows={3} placeholder="例: 全日本マスターズ優勝、指導選手の入賞" className="w-full resize-none rounded-[10px] border border-[#dce3ea] bg-white px-4 py-3 text-sm text-[#1a2332] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/30" />
              </div>
              <TagGroup label="指導対象年齢" items={TARGET_AGES} selected={targetAges} onChange={setTargetAges} />
              <EditActions onCancel={cancelEdit} onSave={savePublic} isPending={isPending} />
            </div>
          ) : (
            <div>
              <ProfileBlockRow label="自己紹介" value={bio || null} />
              <ProfileBlockRow label="経歴" value={career || null} />
              <ProfileBlockRow label="実績" value={achievements || null} />
              {targetAges.length > 0 && <TagRow label="指導対象年齢" items={targetAges} />}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pb-10" />
    </div>
  )
}
