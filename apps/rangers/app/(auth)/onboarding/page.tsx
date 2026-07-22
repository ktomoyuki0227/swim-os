"use client"

import { useState, useEffect, useTransition, Fragment, useRef } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { completeOnboarding, type OnboardingData } from "@/actions/onboarding"
import { uploadAvatar } from "@/actions/profile"
import { updatePaymentMethod } from "@/actions/payments"
import { SWIM_SPECIALTIES, SWIMMING_GOALS, SWIM_LEVELS, PREFECTURES, SWIMMER_TYPES, SWIM_DISCIPLINES } from "@/types/database"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const IS_TEST_MODE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_") ?? false

const TEST_CARDS = [
  { number: "4242 4242 4242 4242", result: "成功", variant: "success" as const, pmId: "pm_card_visa" },
  { number: "4000 0000 0000 9995", result: "残高不足エラー", variant: "warning" as const, pmId: "pm_card_chargeDeclinedInsufficientFunds" },
  { number: "4000 0000 0000 0002", result: "拒否", variant: "error" as const, pmId: "pm_card_chargeDeclined" },
]

const ALL_STEPS = [
  { num: 1, label: "アカウント作成" },
  { num: 2, label: "自己紹介" },
  { num: 3, label: "基本情報①" },
  { num: 4, label: "基本情報②" },
  { num: 5, label: "緊急連絡先" },
  { num: 6, label: "競技登録" },
  { num: 7, label: "お支払い" },
]

const WIZARD_STEPS = [
  { num: 1, label: "自分を紹介する", desc: "あなたのスイマープロフィールを設定してください" },
  { num: 2, label: "基本情報(1)", desc: "フリガナ・生年月日・性別を教えてください" },
  { num: 3, label: "基本情報(2)", desc: "住所と電話番号を入力してください" },
  { num: 4, label: "緊急連絡先", desc: "万が一の際の緊急連絡先を登録してください" },
  { num: 5, label: "競技登録", desc: "マスターズ水泳・JSAの登録情報を入力してください" },
  { num: 6, label: "お支払い", desc: "お支払い方法を登録しておくと、グループの参加費をスムーズに支払えます。後でプロフィールページから登録することもできます。" },
]

interface FormState {
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
  bio: string
}

const stripeInputStyle = {
  base: {
    fontSize: "15px",
    color: "#1a2332",
    fontFamily: "system-ui, sans-serif",
    "::placeholder": { color: "#64748b" },
  },
  invalid: { color: "#c0392b" },
}

// ── TagButton: タグ選択用ボタン ──────────────────────────────────────────────
function TagButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-[#005F8C] bg-[#005F8C] text-white"
          : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40 hover:text-[#005F8C]"
      }`}
    >
      {label}
    </button>
  )
}

// ── Stripe カードセットアップフォーム ────────────────────────────────────────
function CardSetupForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string
  onSuccess: (paymentMethodId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [cardComplete, setCardComplete] = useState({ number: false, expiry: false, cvc: false })
  const [showTestCards, setShowTestCards] = useState(false)

  const quickUseTestCard = async (pmId: string) => {
    if (!stripe) return
    setSubmitting(true)
    setFormError(null)
    const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: pmId,
    })
    if (error) {
      setFormError(error.message ?? "テストカードの確認に失敗しました")
      setSubmitting(false)
      return
    }
    if (setupIntent?.payment_method) {
      const resolvedId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method.id
      onSuccess(resolvedId)
    } else {
      setFormError("お支払い方法の取得に失敗しました。もう一度お試しください。")
    }
    setSubmitting(false)
  }

  const allComplete = cardComplete.number && cardComplete.expiry && cardComplete.cvc

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setSubmitting(true)
    setFormError(null)

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      setFormError("カード情報を入力してください")
      setSubmitting(false)
      return
    }

    const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardNumberElement },
    })

    if (error) {
      setFormError(error.message ?? "カード情報の確認に失敗しました")
      setSubmitting(false)
      return
    }

    if (setupIntent?.payment_method) {
      const pmId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method.id
      onSuccess(pmId)
    } else {
      setFormError("お支払い方法の取得に失敗しました。もう一度お試しください。")
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#475569]">カード番号</label>
          <div className="rounded-lg border border-[#dce3ea] bg-white px-3 py-3">
            <CardNumberElement
              options={{ style: stripeInputStyle }}
              onChange={(e) => setCardComplete((prev) => ({ ...prev, number: e.complete }))}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-[#475569]">有効期限</label>
            <div className="rounded-lg border border-[#dce3ea] bg-white px-3 py-3">
              <CardExpiryElement
                options={{ style: stripeInputStyle }}
                onChange={(e) => setCardComplete((prev) => ({ ...prev, expiry: e.complete }))}
              />
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-[#475569]">セキュリティコード</label>
            <div className="rounded-lg border border-[#dce3ea] bg-white px-3 py-3">
              <CardCvcElement
                options={{ style: stripeInputStyle }}
                onChange={(e) => setCardComplete((prev) => ({ ...prev, cvc: e.complete }))}
              />
            </div>
          </div>
        </div>
      </div>
      {formError && (
        <p className="rounded-lg border border-[#c0392b]/20 bg-[#fdecea] px-3 py-2 text-sm text-[#c0392b]">
          {formError}
        </p>
      )}

      {IS_TEST_MODE && (
        <div className="border-t border-[#dce3ea] pt-3">
          <button
            type="button"
            onClick={() => setShowTestCards((v) => !v)}
            className="w-full text-center text-sm text-[#64748b] transition-colors hover:text-[#475569]"
          >
            {showTestCards ? "▲ 閉じる" : "▼ テストカード（開発用）"}
          </button>
          {showTestCards && (
            <div className="mt-3 space-y-2 rounded-lg bg-[#f2f7fa] p-3">
              <p className="text-sm font-medium text-[#1a2332]">テストカード（クリックで即時登録）</p>
              <div className="flex flex-col gap-1.5">
                {TEST_CARDS.map((card) => (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => quickUseTestCard(card.pmId)}
                    disabled={submitting}
                    className="rounded-lg border border-[#dce3ea] bg-white px-3 py-2 text-left transition-colors hover:border-[#005F8C] hover:bg-white disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-[#1a2332]">{card.number}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-sm font-medium ${
                        card.variant === "success" ? "bg-[#eaf7f0] text-[#0f8a4f]"
                        : card.variant === "warning" ? "bg-orange-100 text-orange-700"
                        : "bg-[#fdecea] text-[#c0392b]"
                      }`}>
                        {card.result}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!stripe || submitting || !allComplete}
        className="w-full rounded-full bg-[#005F8C] text-white hover:bg-[#004E73] disabled:opacity-40"
        style={{ minHeight: "44px" }}
      >
        {submitting ? "確認中..." : "お支払い方法を登録して完了"}
      </Button>
    </div>
  )
}

function StripeStep({ onSuccess }: { onSuccess: (paymentMethodId: string) => void }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const fetchIntent = () => {
    setLoading(true)
    setFetchError(false)
    fetch("/api/stripe/setup-intent", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("server error")
        return res.json()
      })
      .then((data: { clientSecret?: string }) => {
        if (data.clientSecret) setClientSecret(data.clientSecret)
        else setFetchError(true)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!stripePromise) { setFetchError(true); setLoading(false); return }
    fetchIntent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005F8C] border-t-transparent" />
      </div>
    )
  }

  if (fetchError || !stripePromise || !clientSecret) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-[#c0392b]/20 bg-[#fdecea] px-4 py-3 text-sm text-[#c0392b]">
          お支払い情報の読み込みに失敗しました。再度お試しください。
        </p>
        <Button onClick={fetchIntent} className="w-full rounded-full bg-[#005F8C] text-white hover:bg-[#004E73]" style={{ minHeight: "44px" }}>
          再試行
        </Button>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, locale: "ja", appearance: { theme: "stripe", variables: { colorPrimary: "#005F8C", fontFamily: "system-ui, sans-serif" } } }}
    >
      <CardSetupForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  )
}

// ── メインウィザード ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Step 1: スイマープロフィール
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedPrefectures, setSelectedPrefectures] = useState<string[]>([])
  const [selectedSwimmerType, setSelectedSwimmerType] = useState<string>("")
  const [selectedSwimDisciplines, setSelectedSwimDisciplines] = useState<string[]>([])
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false)
  const prefDropdownRef = useRef<HTMLDivElement>(null)

  // Step 2–5: 基本情報
  const [form, setForm] = useState<FormState>({
    furigana: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
    phone: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact: "",
    masters_registered: false,
    masters_number: "",
    jsa_registered: false,
    jsa_number: "",
    bio: "",
  })
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!prefDropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (prefDropdownRef.current && !prefDropdownRef.current.contains(e.target as Node)) {
        setPrefDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [prefDropdownOpen])

  const isValidPhone = (val: string) => /^\d{10,11}$/.test(val.replace(/[-\s]/g, ""))

  const toggleItem = (list: string[], item: string): string[] =>
    list.includes(item) ? list.filter((v) => v !== item) : [...list, item]

  // Step 1 バリデーション
  const step1Valid =
    !!avatarFile &&
    !!selectedLevel &&
    selectedSpecialties.length >= 1 &&
    selectedGoals.length >= 1 &&
    selectedPrefectures.length >= 1

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return step1Valid
      case 2:
        return !!form.furigana.trim() && !!form.birthYear && !!form.birthMonth && !!form.birthDay && !!form.gender
      case 3:
        return !!form.address.trim() && isValidPhone(form.phone)
      case 4:
        return (
          !!form.emergency_contact_name.trim() &&
          !!form.emergency_contact_relation.trim() &&
          isValidPhone(form.emergency_contact)
        )
      case 5:
        if (form.masters_registered && !form.masters_number.trim()) return false
        if (form.jsa_registered && !form.jsa_number.trim()) return false
        return true
      default:
        return true
    }
  }

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleComplete = (stripePaymentMethodId?: string) => {
    setSaveError(null)
    startTransition(async () => {
      // カード登録済みの場合: Stripe 側で Customer のデフォルト PM を設定する
      // (SetupIntent 確認だけでは invoice_settings.default_payment_method が更新されない)
      if (stripePaymentMethodId) {
        const { error: pmError } = await updatePaymentMethod(stripePaymentMethodId)
        if (pmError) {
          setSaveError("カード情報の設定に失敗しました。もう一度お試しください。")
          return
        }
      }

      if (avatarFile) {
        const fd = new FormData()
        fd.append("avatar", avatarFile)
        const avatarResult = await uploadAvatar(fd)
        if (avatarResult.error) {
          setSaveError("プロフィール写真のアップロードに失敗しました。もう一度お試しください。")
          return
        }
      }

      const birthday =
        form.birthYear && form.birthMonth && form.birthDay
          ? `${form.birthYear}-${form.birthMonth.padStart(2, "0")}-${form.birthDay.padStart(2, "0")}`
          : undefined

      const data: OnboardingData = {
        furigana: form.furigana || undefined,
        birthday,
        gender: (form.gender as OnboardingData["gender"]) || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_contact_relation: form.emergency_contact_relation || undefined,
        emergency_contact: form.emergency_contact || undefined,
        masters_registered: form.masters_registered,
        masters_number: form.masters_number || undefined,
        jsa_registered: form.jsa_registered,
        jsa_number: form.jsa_number || undefined,
        bio: form.bio || undefined,
        stripe_payment_method_id: stripePaymentMethodId,
        level: selectedLevel || undefined,
        specialties: selectedSpecialties,
        swimming_goals: selectedGoals,
        prefectures: selectedPrefectures,
        swimmer_type: selectedSwimmerType || null,
        swim_disciplines: selectedSwimDisciplines,
      }
      const result = await completeOnboarding(data)
      if (!result.error) {
        const params = new URLSearchParams(window.location.search)
        const next = params.get("next")
        const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
        router.push(destination)
      } else {
        setSaveError("保存に失敗しました。もう一度お試しください。")
      }
    })
  }

  const currentStep = WIZARD_STEPS[step - 1]
  const progressStep = step + 1

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* 進捗インジケーター */}
      <div className="mb-4 flex items-center">
        {ALL_STEPS.map(({ num, label }, i) => (
          <Fragment key={num}>
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                num < progressStep ? "bg-[#005F8C]/20 text-[#005F8C]"
                : num === progressStep ? "bg-[#005F8C] text-white shadow-md"
                : "bg-[#dce3ea] text-[#64748b]"
              }`}>
                {num < progressStep ? "✓" : num}
              </div>
              <p className={`mt-1 hidden text-sm sm:block ${num === progressStep ? "font-medium text-[#005F8C]" : "text-[#64748b]"}`}>
                {label}
              </p>
            </div>
            {i < ALL_STEPS.length - 1 && (
              <div className={`mx-1 h-[2px] flex-1 transition-colors ${num < progressStep ? "bg-[#005F8C]/30" : "bg-[#dce3ea]"}`} />
            )}
          </Fragment>
        ))}
      </div>

      <Card className="border-[#dce3ea] bg-white shadow-lg">
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#005F8C]">
            STEP {progressStep} / {ALL_STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-[#1a2332]">{currentStep.label}</h2>
          <p className="text-sm text-[#64748b]">{currentStep.desc}</p>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">

          {/* ── Step 1: 自分を紹介する ── */}
          {step === 1 && (
            <>
              {/* アバター */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById("avatar-upload-input")?.click()}
                  className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-[#dce3ea] bg-[#f2f7fa] transition-colors hover:border-[#005F8C]"
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="アバタープレビュー" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#64748b]">
                      <span className="text-2xl">📷</span>
                      <span className="text-sm leading-tight">タップして追加</span>
                    </div>
                  )}
                </button>
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setAvatarFile(file)
                    const reader = new FileReader()
                    reader.onloadend = () => setAvatarPreview(reader.result as string)
                    reader.readAsDataURL(file)
                  }}
                />
                <div className="flex items-center gap-2 text-sm">
                  <span className={avatarFile ? "text-[#0f8a4f]" : "text-[#c0392b] font-medium"}>
                    {avatarFile ? "✓ 設定済み" : "プロフィール写真（必須）"}
                  </span>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                      className="text-[#c0392b] hover:text-[#c0392b]"
                    >
                      × 削除
                    </button>
                  )}
                </div>
              </div>

              {/* 水泳カテゴリ（任意） */}
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">
                  水泳カテゴリ<span className="ml-1 text-sm text-[#64748b]">任意</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SWIM_DISCIPLINES.map((d) => (
                    <TagButton
                      key={d}
                      label={d}
                      selected={selectedSwimDisciplines.includes(d)}
                      onClick={() => setSelectedSwimDisciplines((prev) => toggleItem(prev, d))}
                    />
                  ))}
                </div>
              </div>

              {/* レベル */}
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">
                  水泳レベル<span className="ml-0.5 text-[#c0392b]">*</span>
                  <span className="ml-1.5 text-sm font-normal text-[#64748b]">1つ選択</span>
                </Label>
                <div className="flex gap-3">
                  {SWIM_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                        selectedLevel === lvl
                          ? "border-[#005F8C] bg-[#005F8C]/5 text-[#005F8C]"
                          : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* 種目・泳法 */}
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">
                  種目・泳法<span className="ml-0.5 text-[#c0392b]">*</span>
                  <span className="ml-1.5 text-sm font-normal text-[#64748b]">
                    1つ以上選択（{selectedSpecialties.length}個選択中）
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SWIM_SPECIALTIES.map((s) => (
                    <TagButton
                      key={s}
                      label={s}
                      selected={selectedSpecialties.includes(s)}
                      onClick={() => setSelectedSpecialties((prev) => toggleItem(prev, s))}
                    />
                  ))}
                </div>
              </div>

              {/* 活動目的 */}
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">
                  活動目的<span className="ml-0.5 text-[#c0392b]">*</span>
                  <span className="ml-1.5 text-sm font-normal text-[#64748b]">
                    1つ以上選択（{selectedGoals.length}個選択中）
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SWIMMING_GOALS.map((g) => (
                    <TagButton
                      key={g}
                      label={g}
                      selected={selectedGoals.includes(g)}
                      onClick={() => setSelectedGoals((prev) => toggleItem(prev, g))}
                    />
                  ))}
                </div>
              </div>

              {/* 活動エリア */}
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">
                  活動エリア<span className="ml-0.5 text-[#c0392b]">*</span>
                  <span className="ml-1.5 text-sm font-normal text-[#64748b]">
                    {selectedPrefectures.length === 0 ? "1つ以上選択" : `${selectedPrefectures.length}件選択中`}
                  </span>
                </Label>
                <div className="relative" ref={prefDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setPrefDropdownOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#dce3ea] px-3 py-2.5 text-sm transition-colors hover:border-[#005F8C]/40"
                  >
                    <span className={selectedPrefectures.length === 0 ? "text-[#64748b]" : "text-[#1a2634]"}>
                      {selectedPrefectures.length === 0
                        ? "都道府県を選択してください"
                        : selectedPrefectures.slice(0, 4).join("・") + (selectedPrefectures.length > 4 ? ` 他${selectedPrefectures.length - 4}件` : "")}
                    </span>
                    <span className="ml-2 shrink-0 text-[#64748b] text-sm">{prefDropdownOpen ? "▲" : "▼"}</span>
                  </button>
                  {prefDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#dce3ea] bg-white shadow-lg">
                      <div className="max-h-52 overflow-y-auto p-2">
                        <div className="grid grid-cols-3 gap-0.5">
                          {PREFECTURES.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSelectedPrefectures((prev) => toggleItem(prev, p))}
                              className={`rounded px-2 py-1.5 text-left text-sm transition-colors ${
                                selectedPrefectures.includes(p)
                                  ? "bg-[#005F8C]/10 font-medium text-[#005F8C]"
                                  : "text-[#475569] hover:bg-[#f5f8fa]"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedPrefectures.length > 0 && (
                        <div className="border-t border-[#dce3ea] px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPrefectures([])}
                            className="text-sm text-[#64748b] hover:text-[#c0392b]"
                          >
                            選択をクリア
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* スイマータイプ（任意） */}
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">
                  スイマータイプ<span className="ml-1 text-sm text-[#64748b]">任意</span>
                </Label>
                <div className="flex gap-3">
                  {SWIMMER_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedSwimmerType(selectedSwimmerType === t ? "" : t)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                        selectedSwimmerType === t
                          ? "border-[#005F8C] bg-[#005F8C]/5 text-[#005F8C]"
                          : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 自己紹介（任意） */}
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  自己紹介<span className="ml-1 text-sm text-[#64748b]">任意</span>
                </Label>
                <Textarea
                  placeholder="例: マスターズ水泳歴10年。クロールと個人メドレーが得意です。"
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  className="border-[#dce3ea]"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </>
          )}

          {/* ── Step 2: 基本情報(1) ── */}
          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  フリガナ<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <Input
                  placeholder="ヤマダ ハナコ"
                  value={form.furigana}
                  onChange={(e) => set("furigana", e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  生年月日<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <div className="flex gap-2">
                  <select
                    value={form.birthYear}
                    onChange={(e) => set("birthYear", e.target.value)}
                    className="flex-1 rounded-lg border border-[#dce3ea] bg-white px-2 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/40"
                  >
                    <option value="">年</option>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 4 - i).map((y) => (
                      <option key={y} value={String(y)}>{y}年</option>
                    ))}
                  </select>
                  <select
                    value={form.birthMonth}
                    onChange={(e) => set("birthMonth", e.target.value)}
                    className="w-24 rounded-lg border border-[#dce3ea] bg-white px-2 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/40"
                  >
                    <option value="">月</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={String(m)}>{m}月</option>
                    ))}
                  </select>
                  <select
                    value={form.birthDay}
                    onChange={(e) => set("birthDay", e.target.value)}
                    className="w-24 rounded-lg border border-[#dce3ea] bg-white px-2 py-2.5 text-sm text-[#1a2332] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/40"
                  >
                    <option value="">日</option>
                    {Array.from(
                      { length: form.birthYear && form.birthMonth
                        ? new Date(Number(form.birthYear), Number(form.birthMonth), 0).getDate()
                        : 31 },
                      (_, i) => i + 1
                    ).map((d) => (
                      <option key={d} value={String(d)}>{d}日</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#475569]">
                  性別<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <div className="flex gap-3">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("gender", g)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                        form.gender === g
                          ? "border-[#005F8C] bg-[#005F8C]/5 text-[#005F8C]"
                          : "border-[#dce3ea] text-[#475569] hover:border-[#005F8C]/40"
                      }`}
                    >
                      {g === "male" ? "男性" : g === "female" ? "女性" : "その他"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: 基本情報(2) ── */}
          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  住所<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <Textarea
                  placeholder="東京都渋谷区〇〇 1-2-3"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="border-[#dce3ea]"
                  rows={3}
                />
                <p className="text-sm text-[#64748b]">グループからの郵便物等に使用される場合があります</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  電話番号<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="09012345678"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="border-[#dce3ea]"
                />
                <p className="text-sm text-[#64748b]">ハイフンなし10〜11桁で入力してください</p>
              </div>
            </>
          )}

          {/* ── Step 4: 緊急連絡先 ── */}
          {step === 4 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  緊急連絡先 氏名<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <Input
                  placeholder="山田 一郎"
                  value={form.emergency_contact_name}
                  onChange={(e) => set("emergency_contact_name", e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  続柄<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <Input
                  placeholder="配偶者・親・兄弟など"
                  value={form.emergency_contact_relation}
                  onChange={(e) => set("emergency_contact_relation", e.target.value)}
                  className="border-[#dce3ea]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-[#475569]">
                  電話番号<span className="ml-0.5 text-[#c0392b]">*</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="09012345678"
                  value={form.emergency_contact}
                  onChange={(e) => set("emergency_contact", e.target.value)}
                  className="border-[#dce3ea]"
                />
                <p className="text-sm text-[#64748b]">ハイフンなし10〜11桁で入力してください</p>
              </div>
            </>
          )}

          {/* ── Step 5: 競技登録 ── */}
          {step === 5 && (
            <>
              <div className="space-y-3 rounded-xl border border-[#dce3ea] p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => set("masters_registered", !form.masters_registered)}
                    className={`relative h-6 w-10 rounded-full transition-colors ${form.masters_registered ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.masters_registered ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <span className="text-sm font-medium text-[#1a2332]">マスターズ水泳に登録済み</span>
                </div>
                {form.masters_registered && (
                  <div className="space-y-1.5">
                    <Label className="text-sm text-[#475569]">
                      マスターズ登録番号<span className="ml-0.5 text-[#c0392b]">*</span>
                    </Label>
                    <Input
                      placeholder="登録番号を入力"
                      value={form.masters_number}
                      onChange={(e) => set("masters_number", e.target.value)}
                      className="border-[#dce3ea]"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-3 rounded-xl border border-[#dce3ea] p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => set("jsa_registered", !form.jsa_registered)}
                    className={`relative h-6 w-10 rounded-full transition-colors ${form.jsa_registered ? "bg-[#005F8C]" : "bg-[#dce3ea]"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.jsa_registered ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                  <span className="text-sm font-medium text-[#1a2332]">日本水泳連盟（JSA）に登録済み</span>
                </div>
                {form.jsa_registered && (
                  <div className="space-y-1.5">
                    <Label className="text-sm text-[#475569]">
                      JSA登録番号<span className="ml-0.5 text-[#c0392b]">*</span>
                    </Label>
                    <Input
                      placeholder="登録番号を入力"
                      value={form.jsa_number}
                      onChange={(e) => set("jsa_number", e.target.value)}
                      className="border-[#dce3ea]"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Step 6: Stripe ── */}
          {step === 6 && (
            <>
              <StripeStep onSuccess={(pmId) => handleComplete(pmId)} />
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 rounded-full border-[#dce3ea] text-[#475569]"
                  style={{ minHeight: "44px" }}
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleComplete()}
                  disabled={isPending}
                  className="flex-1 rounded-full border-[#dce3ea] text-[#475569] hover:bg-[#f2f7fa]"
                  style={{ minHeight: "44px" }}
                >
                  {isPending ? "保存中..." : "スキップ"}
                </Button>
              </div>
            </>
          )}

          {/* ナビゲーション（Step 1–5） */}
          {step < 6 && (
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 rounded-full border-[#dce3ea] text-[#475569]"
                  style={{ minHeight: "44px" }}
                >
                  前へ
                </Button>
              )}
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 rounded-full bg-[#005F8C] text-white hover:bg-[#004E73] disabled:opacity-40"
                style={{ minHeight: "44px" }}
                disabled={isPending || !canProceed()}
              >
                次へ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {saveError && (
        <p className="mt-3 rounded-lg border border-[#c0392b]/20 bg-[#fdecea] px-4 py-2.5 text-sm text-[#c0392b]">
          {saveError}
        </p>
      )}
      <p className="mt-4 text-center text-sm text-[#64748b]">
        入力した情報はいつでもプロフィールページから変更できます
      </p>
    </div>
  )
}
