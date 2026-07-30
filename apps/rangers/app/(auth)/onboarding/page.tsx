"use client"

import { useState, useTransition, Fragment } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { completeOnboarding, type OnboardingData } from "@/actions/onboarding"
import { uploadAvatar } from "@/actions/profile"
import { safeRedirectPath } from "@/lib/utils"
import { updatePaymentMethod } from "@/actions/payments"
import { SwimmerProfileStep } from "./swimmer-profile-step"
import { PersonalInfo1Step } from "./personal-info-1-step"
import { PersonalInfo2Step } from "./personal-info-2-step"
import { EmergencyContactStep } from "./emergency-contact-step"
import { CompetitionRegistrationStep } from "./competition-registration-step"
import type { PersonalInfoForm, SwimmerProfileForm } from "./types"

// Stripe.js / react-stripe-js は外部スクリプトの即時読み込みを伴うため、
// お支払いステップ(Step 6)に到達したときにのみ読み込む
const StripeStep = dynamic(
  () => import("./stripe-step").then((mod) => mod.StripeStep),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005F8C] border-t-transparent" />
      </div>
    ),
  }
)

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

const EMPTY_SWIMMER_FORM: SwimmerProfileForm = {
  avatarFile: null,
  avatarPreview: null,
  level: "",
  specialties: [],
  goals: [],
  prefectures: [],
  swimmerType: "",
  swimDisciplines: [],
  bio: "",
}

const EMPTY_PERSONAL_FORM: PersonalInfoForm = {
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
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  const [swimmerForm, setSwimmerForm] = useState<SwimmerProfileForm>(EMPTY_SWIMMER_FORM)
  const [personalForm, setPersonalForm] = useState<PersonalInfoForm>(EMPTY_PERSONAL_FORM)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isValidPhone = (val: string) => /^\d{10,11}$/.test(val.replace(/[-\s]/g, ""))

  // Step 1 バリデーション
  const step1Valid =
    !!swimmerForm.avatarFile &&
    !!swimmerForm.level &&
    swimmerForm.specialties.length >= 1 &&
    swimmerForm.goals.length >= 1 &&
    swimmerForm.prefectures.length >= 1

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return step1Valid
      case 2:
        return !!personalForm.furigana.trim() && !!personalForm.birthYear && !!personalForm.birthMonth && !!personalForm.birthDay && !!personalForm.gender
      case 3:
        return !!personalForm.address.trim() && isValidPhone(personalForm.phone)
      case 4:
        return (
          !!personalForm.emergency_contact_name.trim() &&
          !!personalForm.emergency_contact_relation.trim() &&
          isValidPhone(personalForm.emergency_contact)
        )
      case 5:
        if (personalForm.masters_registered && !personalForm.masters_number.trim()) return false
        if (personalForm.jsa_registered && !personalForm.jsa_number.trim()) return false
        return true
      default:
        return true
    }
  }

  const handleComplete = (stripePaymentMethodId?: string) => {
    setSaveError(null)
    startTransition(async () => {
      // startTransition内の例外はエラーバウンダリまで突き抜けてしまう(500画面化)ため、
      // Server Action呼び出しは必ずtry/catchで受け止める(/profileページの同パターンに合わせる)
      try {
        // カード登録済みの場合: Stripe 側で Customer のデフォルト PM を設定する
        // (SetupIntent 確認だけでは invoice_settings.default_payment_method が更新されない)
        if (stripePaymentMethodId) {
          const { error: pmError } = await updatePaymentMethod(stripePaymentMethodId)
          if (pmError) {
            setSaveError("カード情報の設定に失敗しました。もう一度お試しください。")
            return
          }
        }

        if (swimmerForm.avatarFile) {
          const fd = new FormData()
          fd.append("avatar", swimmerForm.avatarFile)
          const avatarResult = await uploadAvatar(fd)
          if (avatarResult.error) {
            setSaveError("プロフィール写真のアップロードに失敗しました。もう一度お試しください。")
            return
          }
        }

        const birthday =
          personalForm.birthYear && personalForm.birthMonth && personalForm.birthDay
            ? `${personalForm.birthYear}-${personalForm.birthMonth.padStart(2, "0")}-${personalForm.birthDay.padStart(2, "0")}`
            : undefined

        const data: OnboardingData = {
          furigana: personalForm.furigana || undefined,
          birthday,
          gender: (personalForm.gender as OnboardingData["gender"]) || undefined,
          phone: personalForm.phone || undefined,
          address: personalForm.address || undefined,
          emergency_contact_name: personalForm.emergency_contact_name || undefined,
          emergency_contact_relation: personalForm.emergency_contact_relation || undefined,
          emergency_contact: personalForm.emergency_contact || undefined,
          masters_registered: personalForm.masters_registered,
          masters_number: personalForm.masters_number || undefined,
          jsa_registered: personalForm.jsa_registered,
          jsa_number: personalForm.jsa_number || undefined,
          bio: swimmerForm.bio || undefined,
          stripe_payment_method_id: stripePaymentMethodId,
          level: swimmerForm.level || undefined,
          specialties: swimmerForm.specialties,
          swimming_goals: swimmerForm.goals,
          prefectures: swimmerForm.prefectures,
          swimmer_type: swimmerForm.swimmerType || null,
          swim_disciplines: swimmerForm.swimDisciplines,
        }
        const result = await completeOnboarding(data)
        if (!result.error) {
          const params = new URLSearchParams(window.location.search)
          const destination = safeRedirectPath(params.get("next"))
          router.push(destination)
        } else {
          setSaveError("保存に失敗しました。もう一度お試しください。")
        }
      } catch {
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
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                num < progressStep ? "bg-[#005F8C]/20 text-[#005F8C]"
                : num === progressStep ? "bg-[#005F8C] text-white shadow-md"
                : "bg-[#dce3ea] text-[#64748b]"
              }`}>
                {num < progressStep ? "✓" : num}
              </div>
              <p className={`mt-1 hidden text-xs sm:block ${num === progressStep ? "font-medium text-[#005F8C]" : "text-[#64748b]"}`}>
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
          <p className="text-xs font-semibold uppercase tracking-widest text-[#005F8C]">
            STEP {progressStep} / {ALL_STEPS.length}
          </p>
          <h2 className="text-xl font-bold text-[#1a2332]">{currentStep.label}</h2>
          <p className="text-sm text-[#64748b]">{currentStep.desc}</p>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {step === 1 && <SwimmerProfileStep form={swimmerForm} onChange={setSwimmerForm} />}
          {step === 2 && <PersonalInfo1Step form={personalForm} onChange={setPersonalForm} />}
          {step === 3 && <PersonalInfo2Step form={personalForm} onChange={setPersonalForm} />}
          {step === 4 && <EmergencyContactStep form={personalForm} onChange={setPersonalForm} />}
          {step === 5 && <CompetitionRegistrationStep form={personalForm} onChange={setPersonalForm} />}

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
      <p className="mt-4 text-center text-xs text-[#64748b]">
        入力した情報はいつでもプロフィールページから変更できます
      </p>
    </div>
  )
}
