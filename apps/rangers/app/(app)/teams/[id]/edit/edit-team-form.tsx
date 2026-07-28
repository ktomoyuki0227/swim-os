"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateTeam, uploadTeamImage } from "@/actions/teams"
import { Button } from "@/components/ui/button"
import { BackLink } from "@/components/back-link"
import { useToast } from "@/components/toast"
import { TeamImageFields } from "./team-image-fields"
import { StripeConnectSection } from "./stripe-connect-section"
import { BasicInfoFields } from "./basic-info-fields"
import { FeeFields } from "./fee-fields"
import { StatusCard } from "./status-card"
import type { FeeFieldsForm } from "./types"

interface Team {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  cover_image_url: string | null
  is_recruiting: boolean
  show_member_count: boolean
  status: string | null
  activity_area: string | null
  practice_frequency: string | null
  practice_days: string[]
  main_pool: string | null
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
  contact_email: string | null
  contact_phone: string | null
  stripe_account_id: string | null
  stripe_onboarding_completed: boolean
  fee_members_exempt_session: boolean
}

interface EditTeamFormProps {
  team: Team
  stripeEnabled: boolean
  connectStatus: "success" | "pending" | "error" | null
}

export function EditTeamForm({ team, stripeEnabled, connectStatus }: EditTeamFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isConnecting, setIsConnecting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (connectStatus === "success") showToast("Stripe Connect の設定が完了しました", "success")
    else if (connectStatus === "pending") showToast("Stripe オンボーディングが未完了です。再度「設定を開始」してください", "error")
    else if (connectStatus === "error") showToast("Stripe Connect の設定中にエラーが発生しました", "error")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [isRecruiting, setIsRecruiting] = useState(team.is_recruiting)
  const [showMemberCount, setShowMemberCount] = useState(team.show_member_count)
  const [isActive, setIsActive] = useState((team.status ?? "active") === "active")
  const [practiceDays, setPracticeDays] = useState<string[]>(team.practice_days ?? [])

  const [feeForm, setFeeForm] = useState<FeeFieldsForm>({
    hasSessionFee: team.has_session_fee,
    hasAnnualFee: team.has_annual_fee,
    hasMonthlyFee: team.has_monthly_fee,
    hasPointCard: team.has_point_card,
    annualFeeAmount: team.annual_fee_amount != null ? String(team.annual_fee_amount) : "",
    monthlyFeeAmount: team.monthly_fee_amount != null ? String(team.monthly_fee_amount) : "",
    defaultMemberPrice: String(team.default_member_price ?? 0),
    defaultGuestPrice: String(team.default_guest_price ?? 0),
    cancellationDays: String(team.cancellation_days ?? 3),
    pointCardCount: String(team.point_card_count ?? 10),
    pointCardPrice: team.point_card_price != null ? String(team.point_card_price) : "",
  })

  // Image state
  const [coverPreview, setCoverPreview] = useState<string | null>(team.cover_image_url)
  const [iconPreview, setIconPreview] = useState<string | null>(team.avatar_url)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "icon"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    if (type === "cover") {
      setCoverFile(file)
      setCoverPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
        return preview
      })
    } else {
      setIconFile(file)
      setIconPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
        return preview
      })
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const res = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id }),
      })
      if (!res.ok) throw new Error("onboarding request failed")
      const { url } = await res.json()
      window.location.href = url
    } catch {
      showToast("Stripe 設定の開始に失敗しました", "error")
      setIsConnecting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      let newCoverUrl: string | undefined
      let newIconUrl: string | undefined

      // Upload any newly-selected images first
      setImageUploading(true)
      try {
        if (coverFile) {
          const fd = new FormData()
          fd.append("file", coverFile)
          fd.append("type", "cover")
          const result = await uploadTeamImage(fd)
          if (result.error) {
            showToast(result.error, "error")
            return
          }
          newCoverUrl = result.url
        }

        if (iconFile) {
          const fd = new FormData()
          fd.append("file", iconFile)
          fd.append("type", "icon")
          const result = await uploadTeamImage(fd)
          if (result.error) {
            showToast(result.error, "error")
            return
          }
          newIconUrl = result.url
        }
      } finally {
        setImageUploading(false)
      }

      const annualFeeVal = parseInt(feeForm.annualFeeAmount)
      const monthlyFeeVal = parseInt(feeForm.monthlyFeeAmount)
      const pointCardPriceVal = parseInt(feeForm.pointCardPrice)

      const payload: Record<string, unknown> = {
        name: data.get("name") as string,
        description: (data.get("description") as string) || undefined,
        activity_area: (data.get("activity_area") as string) || undefined,
        practice_frequency: (data.get("practice_frequency") as string) || null,
        practice_days: practiceDays,
        main_pool: (data.get("main_pool") as string) || null,
        is_recruiting: isRecruiting,
        show_member_count: showMemberCount,
        status: isActive ? "active" : "inactive",
        has_session_fee: feeForm.hasSessionFee,
        has_annual_fee: feeForm.hasAnnualFee,
        has_monthly_fee: feeForm.hasMonthlyFee,
        has_point_card: feeForm.hasPointCard,
        default_member_price: feeForm.hasSessionFee ? (parseInt(feeForm.defaultMemberPrice) || 0) : 0,
        default_guest_price: feeForm.hasSessionFee ? (parseInt(feeForm.defaultGuestPrice) || 0) : 0,
        annual_fee_amount: feeForm.hasAnnualFee ? (Number.isNaN(annualFeeVal) ? undefined : annualFeeVal) : undefined,
        monthly_fee_amount: feeForm.hasMonthlyFee ? (Number.isNaN(monthlyFeeVal) ? undefined : monthlyFeeVal) : undefined,
        cancellation_days: parseInt(feeForm.cancellationDays) || 3,
        point_card_count: feeForm.hasPointCard ? (parseInt(feeForm.pointCardCount) || team.point_card_count || 10) : undefined,
        point_card_price: feeForm.hasPointCard ? (Number.isNaN(pointCardPriceVal) ? undefined : pointCardPriceVal) : undefined,
        contact_email: (data.get("contact_email") as string) || null,
        contact_phone: (data.get("contact_phone") as string) || null,
        fee_members_exempt_session: team.fee_members_exempt_session,
      }

      if (newCoverUrl) payload.cover_image_url = newCoverUrl
      if (newIconUrl) payload.avatar_url = newIconUrl

      const result = await updateTeam(team.id, payload)
      if (result.error) {
        showToast(result.error, "error")
      } else {
        showToast("グループ情報を更新しました", "success")
        setTimeout(() => {
          router.push(`/teams/${team.id}`)
        }, 800)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <BackLink
          href={`/teams/${team.id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dce3ea] bg-white transition-colors hover:bg-[#f2f7fa]"
          aria-label="戻る"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </BackLink>
        <h1 className="text-xl font-bold text-[#1a2332]">グループ情報を編集</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <BasicInfoFields
          team={team}
          practiceDays={practiceDays}
          onPracticeDaysChange={setPracticeDays}
          isRecruiting={isRecruiting}
          onIsRecruitingChange={setIsRecruiting}
          showMemberCount={showMemberCount}
          onShowMemberCountChange={setShowMemberCount}
        />

        <TeamImageFields
          coverPreview={coverPreview}
          iconPreview={iconPreview}
          coverInputRef={coverInputRef}
          iconInputRef={iconInputRef}
          onFileSelect={handleFileSelect}
          onRemoveCover={() => {
            setCoverFile(null)
            setCoverPreview((prev) => {
              if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
              return null
            })
          }}
          onRemoveIcon={() => {
            setIconFile(null)
            setIconPreview((prev) => {
              if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev)
              return null
            })
          }}
        />

        <FeeFields
          form={feeForm}
          onChange={setFeeForm}
          simulatorMemberPrice={team.default_member_price ?? 1000}
        />

        <StatusCard isActive={isActive} onChange={setIsActive} />

        <div className="flex gap-3">
          <BackLink href={`/teams/${team.id}`} className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-[#dce3ea] text-[#475569]"
              style={{ minHeight: "48px" }}
            >
              キャンセル
            </Button>
          </BackLink>
          <Button
            type="submit"
            disabled={isPending || imageUploading}
            className="flex-1 rounded-full bg-[#005F8C] hover:bg-[#004E73]"
            style={{ minHeight: "48px" }}
          >
            {isPending || imageUploading ? "保存中..." : "変更を保存"}
          </Button>
        </div>
      </form>

      {/* Stripe Connect — 決済送金設定（Stripe 設定済み時のみ表示） */}
      {stripeEnabled && (
        <StripeConnectSection
          stripeAccountId={team.stripe_account_id}
          stripeOnboardingCompleted={team.stripe_onboarding_completed}
          isConnecting={isConnecting}
          onConnect={handleConnect}
        />
      )}
    </div>
  )
}
