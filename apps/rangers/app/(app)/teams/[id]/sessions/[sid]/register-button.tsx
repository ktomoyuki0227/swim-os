"use client"

import { useState } from "react"
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
}

export function RegisterButton({
  sessionId,
  allowPointCard,
  isCompetition,
  competitionFields,
}: RegisterButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentChoice, setShowPaymentChoice] = useState(false)
  const [entryData, setEntryData] = useState<Record<string, string>>({})
  const { showToast } = useToast()

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
        {isCompetition && competitionFields && competitionFields.length > 0 && (
          <div className="space-y-3 rounded-xl border border-[#005F8C]/20 bg-[#005F8C]/5 p-4">
            <p className="text-sm font-semibold text-[#1a2332]">エントリー情報</p>
            {competitionFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">
                  {field.label}
                  {field.required && <span className="text-[#E8614D]"> *</span>}
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

        <p className="text-sm font-medium text-[#1a2332]">参加方法を選択してください</p>
        <div className="space-y-2">
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
              <p className="text-xs text-[#5c6a7a]">当日会場でお支払い</p>
            </div>
          </button>

          {allowPointCard && (
            <button
              onClick={() => handleRegister("point_card")}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-xl border border-[#dce3ea] bg-white p-4 text-left transition-all hover:border-[#005F8C] disabled:opacity-60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8614D]/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8614D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#1a2332]">回数券を使う</p>
                <p className="text-xs text-[#5c6a7a]">スタンプを1回消費</p>
              </div>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowPaymentChoice(false)}
          className="w-full text-sm text-[#5c6a7a] hover:text-[#1a2332]"
        >
          キャンセル
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setShowPaymentChoice(true)}
        disabled={isLoading}
        className="w-full rounded-full bg-[#005F8C] hover:bg-[#004E73]"
        style={{ minHeight: "52px", fontSize: "16px" }}
      >
        参加する
      </Button>
    </div>
  )
}
