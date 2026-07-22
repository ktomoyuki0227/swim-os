"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerForSession } from "@/actions/sessions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/toast"

interface CompetitionField {
  key: string
  label: string
  type: string
  required: boolean
  options?: string[]
}

interface RegisterButtonProps {
  sessionId: string
  allowPointCard: boolean
  isCompetition?: boolean
  competitionFields?: CompetitionField[]
  isExempt?: boolean
  hasCard?: boolean
}

export function RegisterButton({
  sessionId,
  allowPointCard,
  isCompetition,
  competitionFields,
  isExempt,
  hasCard,
}: RegisterButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentChoice, setShowPaymentChoice] = useState(false)
  const [showNoCard, setShowNoCard] = useState(false)
  const [entryData, setEntryData] = useState<Record<string, string>>({})
  const { showToast } = useToast()

  const needsEntryForm = isCompetition && competitionFields && competitionFields.length > 0

  const handleRegister = async (paymentMethod: "cash" | "stripe" | "point_card") => {
    // 試合の場合、必須フィールドのバリデーション
    if (isCompetition && competitionFields) {
      for (const field of competitionFields) {
        if (field.required && !entryData[field.key]?.trim()) {
          showToast(`「${field.label}」を入力してください`, "error")
          return
        }
      }
    }

    setIsLoading(true)
    const competitionEntry = isCompetition ? entryData : undefined
    const result = await registerForSession(sessionId, paymentMethod, competitionEntry)
    if (result.error) {
      showToast(result.error, "error")
      setIsLoading(false)
    } else {
      router.refresh()
    }
  }

  if (showPaymentChoice) {
    return (
      <div className="space-y-3">
        {/* 試合エントリー情報入力 */}
        {needsEntryForm && (
          <div className="space-y-3 rounded-xl border border-[#005F8C]/20 bg-[#005F8C]/5 p-4">
            <p className="text-sm font-semibold text-[#1a2332]">エントリー情報</p>
            {competitionFields!.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">
                  {field.label}
                  {field.required && <span className="text-[#c0392b]"> *</span>}
                </Label>
                <Input
                  value={entryData[field.key] || ""}
                  onChange={(e) =>
                    setEntryData((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.label}
                  className="border-[#dce3ea] bg-white text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {isExempt ? (
          <button
            onClick={() => handleRegister("cash")}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-xl border border-[#0f8a4f]/30 bg-[#0f8a4f]/5 p-4 text-left transition-all hover:border-[#0f8a4f] disabled:opacity-60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f8a4f]/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[#1a2332]">無料で参加する</p>
              <p className="text-xs text-[#475569]">会費会員のため参加費免除</p>
            </div>
          </button>
        ) : (
          <>
            <p className="text-sm font-medium text-[#1a2332]">参加方法を選択してください</p>
            <div className="space-y-2">
              {/* カード払い */}
              <button
                onClick={() => {
                  if (!hasCard) {
                    setShowNoCard(true)
                  } else {
                    setShowNoCard(false)
                    handleRegister("stripe")
                  }
                }}
                disabled={isLoading}
                className="flex w-full items-center gap-3 rounded-xl border border-[#dce3ea] bg-white p-4 text-left transition-all hover:border-[#005F8C] disabled:opacity-60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#005F8C]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1a2332]">クレジットカード</p>
                  <p className="text-xs text-[#475569]">
                    {hasCard ? "登録済みカードで参加（開催確定時に決済）" : "カードを登録して参加"}
                  </p>
                </div>
                {hasCard && (
                  <span className="rounded-full bg-[#eaf7f0] px-2 py-0.5 text-xs font-medium text-[#0f8a4f]">登録済</span>
                )}
              </button>

              {/* カード未登録の案内 */}
              {showNoCard && (
                <div className="rounded-xl border border-[#fdecea] bg-[#fdecea]/60 p-3">
                  <p className="text-xs font-medium text-[#c0392b]">クレジットカードが登録されていません</p>
                  <p className="mt-0.5 text-xs text-[#475569]">お支払いページでカードを登録するとカード払いでご参加いただけます。</p>
                  <Link
                    href="/payments"
                    className="mt-1.5 inline-block text-xs font-medium text-[#005F8C] underline underline-offset-2"
                  >
                    カードを登録する →
                  </Link>
                </div>
              )}

              {/* 当日現金払い */}
              <button
                onClick={() => handleRegister("cash")}
                disabled={isLoading}
                className="flex w-full items-center gap-3 rounded-xl border border-[#dce3ea] bg-white p-4 text-left transition-all hover:border-[#005F8C] disabled:opacity-60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#005F8C]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#005F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#1a2332]">当日現金払い</p>
                  <p className="text-xs text-[#475569]">当日会場でお支払い</p>
                </div>
              </button>

              {allowPointCard && (
                <button
                  onClick={() => handleRegister("point_card")}
                  disabled={isLoading}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#dce3ea] bg-white p-4 text-left transition-all hover:border-[#005F8C] disabled:opacity-60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c0392b]/10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1a2332]">回数券を使う</p>
                    <p className="text-xs text-[#475569]">スタンプを1回消費</p>
                  </div>
                </button>
              )}
            </div>
          </>
        )}
        <button
          onClick={() => setShowPaymentChoice(false)}
          className="w-full text-sm text-[#475569] hover:text-[#1a2332]"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => {
          if (isExempt && !needsEntryForm) {
            handleRegister("cash")
          } else {
            setShowPaymentChoice(true)
          }
        }}
        disabled={isLoading}
        className="w-full rounded-full bg-[#005F8C] hover:bg-[#004E73]"
        style={{ minHeight: "52px", fontSize: "16px" }}
      >
        {isExempt ? "無料で参加する" : "参加する"}
      </Button>
    </div>
  )
}
