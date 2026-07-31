"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createTeam, uploadTeamImage } from "@/actions/teams"
import { getProfile, updateProfilePartial } from "@/actions/profile"
import type { Profile } from "@/types/database"
import { useToast } from "@/components/toast"
import { BackLink } from "@/components/back-link"
import { StepIndicator } from "./step-indicator"
import { TypeSelectStep } from "./type-select-step"
import { BasicInfoStep } from "./basic-info-step"
import { DetailsStep } from "./details-step"
import { ImagesStep } from "./images-step"
import { PricingStep } from "./pricing-step"
import { PaymentSetupStep } from "./payment-setup-step"
import type { BasicFormData, ImageData, FeeFormData, TeamType } from "./types"

const MAX_TEAM_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const EMPTY_BASIC_FORM: BasicFormData = {
  name: "",
  description: "",
  career: "",
  bio: "",
  is_recruiting: true,
  show_member_count: true,
  activity_area: "",
  main_pool: "",
  practice_frequency: "",
  practice_days: [],
  contact_email: "",
  contact_phone: "",
}

const EMPTY_IMAGES: ImageData = { coverFile: null, iconFile: null, coverPreview: null, iconPreview: null }

const EMPTY_FEE_FORM: FeeFormData = {
  hasSessionFee: true,
  hasAnnualFee: false,
  hasMonthlyFee: false,
  hasPointCard: false,
  annualFeeAmount: "",
  monthlyFeeAmount: "",
  defaultMemberPrice: "",
  defaultGuestPrice: "",
  pointCardCount: "",
  pointCardPrice: "",
}

export default function NewTeamPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [step, setStep] = useState(0)
  const [teamType, setTeamType] = useState<TeamType | null>(null)
  const typeLabel = teamType === "personal" ? "パーソナル" : "チーム"

  const [form, setForm] = useState<BasicFormData>(EMPTY_BASIC_FORM)
  const [images, setImages] = useState<ImageData>(EMPTY_IMAGES)
  const [uploading, setUploading] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [iconImageUrl, setIconImageUrl] = useState<string | null>(null)
  const [feeForm, setFeeForm] = useState<FeeFormData>(EMPTY_FEE_FORM)

  // 作成済みチームID（Step 5 で使用）
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null)

  const goToStep = (n: number) => {
    setStep(n)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // パーソナル選択時、既存の公開プロフィール(経歴・自己紹介)を取得してプレフィルする
  useEffect(() => {
    if (teamType !== "personal") return
    getProfile().then((p) => {
      const profile = p as Profile | null
      if (!profile) return
      setForm((prev) => ({
        ...prev,
        career: profile.career ?? "",
        bio: profile.bio ?? "",
      }))
    })
  }, [teamType])

  const handleTypeSelect = (type: TeamType) => {
    setTeamType(type)
    goToStep(1)
  }

  const handleStep1Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setForm((prev) => ({
      ...prev,
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || "",
      career: (fd.get("career") as string) || "",
      bio: (fd.get("bio") as string) || "",
    }))
    goToStep(2)
  }

  const handleStep2Next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setForm((prev) => ({
      ...prev,
      activity_area: (fd.get("activity_area") as string) || "",
      main_pool: (fd.get("main_pool") as string) || "",
      practice_frequency: (fd.get("practice_frequency") as string) || "",
      contact_email: (fd.get("contact_email") as string) || "",
      contact_phone: (fd.get("contact_phone") as string) || "",
    }))
    goToStep(3)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "icon") => {
    const file = e.target.files?.[0]
    if (!file) return
    // actions/teams/crud.ts の uploadTeamImage と同じ上限。ここで弾かないと
    // サーバー側チェックに届く前にNext.jsのServer Actionsボディ上限に当たり得る
    if (file.size > MAX_TEAM_IMAGE_SIZE_BYTES) {
      showToast("ファイルサイズは5MB以下にしてください", "error")
      e.target.value = ""
      return
    }
    const preview = URL.createObjectURL(file)
    if (type === "cover") {
      setImages((prev) => {
        if (prev.coverPreview) URL.revokeObjectURL(prev.coverPreview)
        return { ...prev, coverFile: file, coverPreview: preview }
      })
    } else {
      setImages((prev) => {
        if (prev.iconPreview) URL.revokeObjectURL(prev.iconPreview)
        return { ...prev, iconFile: file, iconPreview: preview }
      })
    }
  }

  const handleRemoveCover = () => setImages((prev) => {
    if (prev.coverPreview) URL.revokeObjectURL(prev.coverPreview)
    return { ...prev, coverFile: null, coverPreview: null }
  })

  const handleRemoveIcon = () => setImages((prev) => {
    if (prev.iconPreview) URL.revokeObjectURL(prev.iconPreview)
    return { ...prev, iconFile: null, iconPreview: null }
  })

  const handleStep3Next = async () => {
    setUploading(true)
    try {
      let newCoverUrl: string | null = null
      let newIconUrl: string | null = null
      if (images.coverFile) {
        const fd = new FormData()
        fd.append("file", images.coverFile)
        fd.append("type", "cover")
        const result = await uploadTeamImage(fd)
        if (result.error) { showToast(result.error, "error"); return }
        newCoverUrl = result.url ?? null
      }
      if (images.iconFile) {
        const fd = new FormData()
        fd.append("file", images.iconFile)
        fd.append("type", "icon")
        const result = await uploadTeamImage(fd)
        if (result.error) { showToast(result.error, "error"); return }
        newIconUrl = result.url ?? null
      }
      setCoverImageUrl(newCoverUrl)
      setIconImageUrl(newIconUrl)
      goToStep(4)
    } catch {
      showToast("画像のアップロードに失敗しました", "error")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const annualFeeVal = parseInt(feeForm.annualFeeAmount)
    const monthlyFeeVal = parseInt(feeForm.monthlyFeeAmount)
    const pointCardPriceVal = parseInt(feeForm.pointCardPrice)

    const payload = {
      name: form.name,
      description: form.description || undefined,
      activity_area: form.activity_area || undefined,
      is_recruiting: form.is_recruiting,
      practice_frequency: form.practice_frequency || undefined,
      practice_days: form.practice_days,
      main_pool: form.main_pool || undefined,
      cover_image_url: coverImageUrl || undefined,
      avatar_url: iconImageUrl || undefined,
      has_session_fee: feeForm.hasSessionFee,
      has_annual_fee: feeForm.hasAnnualFee,
      has_monthly_fee: feeForm.hasMonthlyFee,
      has_point_card: feeForm.hasPointCard,
      default_member_price: feeForm.hasSessionFee ? (parseInt(feeForm.defaultMemberPrice) || 0) : 0,
      default_guest_price: feeForm.hasSessionFee ? (parseInt(feeForm.defaultGuestPrice) || 0) : 0,
      annual_fee_amount: feeForm.hasAnnualFee ? (Number.isNaN(annualFeeVal) ? undefined : annualFeeVal) : undefined,
      monthly_fee_amount: feeForm.hasMonthlyFee ? (Number.isNaN(monthlyFeeVal) ? undefined : monthlyFeeVal) : undefined,
      point_card_count: feeForm.hasPointCard ? (parseInt(feeForm.pointCardCount) || 10) : undefined,
      point_card_price: feeForm.hasPointCard ? (Number.isNaN(pointCardPriceVal) ? undefined : pointCardPriceVal) : undefined,
      contact_email: form.contact_email || undefined,
      contact_phone: form.contact_phone || undefined,
      fee_members_exempt_session: false,
      team_type: teamType ?? "team",
      show_member_count: form.show_member_count,
    }

    startTransition(async () => {
      try {
        // パーソナルの経歴・自己紹介は teams ではなく profiles 側で一元管理する。
        // team 作成が失敗しても profiles の更新自体は残したいため先に保存する。
        if (teamType === "personal") {
          const profileResult = await updateProfilePartial({
            career: form.career || null,
            bio: form.bio || null,
          })
          if (profileResult.error) {
            showToast(profileResult.error, "error")
            return
          }
        }

        const result = await createTeam(payload)
        if (result.error) {
          showToast(result.error, "error")
        } else if (result.data) {
          const hasFees = feeForm.hasSessionFee || feeForm.hasAnnualFee || feeForm.hasMonthlyFee
          setCreatedTeamId(result.data.id)
          if (hasFees) {
            goToStep(5)
          } else {
            router.push(`/teams/${result.data.id}`)
          }
        }
      } catch {
        showToast("グループの作成に失敗しました。もう一度お試しください。", "error")
      }
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <BackLink
          href="/teams"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dce3ea] bg-white transition-colors hover:bg-[#f2f7fa]"
          aria-label="戻る"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </BackLink>
        <h1 className="text-xl font-bold text-[#1a2332]">{teamType ? `${typeLabel}を作成` : "グループを作成"}</h1>
      </div>

      {/* ステップインジケーター */}
      <StepIndicator current={step} />

      {step === 0 && <TypeSelectStep onSelect={handleTypeSelect} />}

      {step === 1 && teamType && (
        <BasicInfoStep
          teamType={teamType}
          typeLabel={typeLabel}
          form={form}
          onChange={setForm}
          onSubmit={handleStep1Next}
          onBack={() => goToStep(0)}
        />
      )}

      {step === 2 && (
        <DetailsStep form={form} onChange={setForm} onSubmit={handleStep2Next} onBack={() => goToStep(1)} />
      )}

      {step === 3 && (
        <ImagesStep
          typeLabel={typeLabel}
          images={images}
          uploading={uploading}
          onFileSelect={handleFileSelect}
          onRemoveCover={handleRemoveCover}
          onRemoveIcon={handleRemoveIcon}
          onNext={handleStep3Next}
          onBack={() => goToStep(2)}
        />
      )}

      {step === 4 && (
        <PricingStep
          form={feeForm}
          onChange={setFeeForm}
          isPending={isPending}
          typeLabel={typeLabel}
          onSubmit={handleSubmit}
          onBack={() => goToStep(3)}
        />
      )}

      {step === 5 && createdTeamId && (
        <PaymentSetupStep teamId={createdTeamId} typeLabel={typeLabel} />
      )}
    </div>
  )
}
