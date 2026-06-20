"use client"

import { useActionState } from "react"
import { joinTeamAction } from "@/actions/teams"

interface JoinFormProps {
  inviteCode: string
  teamName: string
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  pointCardCount: number
}

const initialState = { error: null }

export function JoinForm({
  inviteCode,
  teamName,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  pointCardCount,
}: JoinFormProps) {
  const [state, formAction, isPending] = useActionState(joinTeamAction, initialState)

  const options = [
    hasAnnualFee && { value: "annual", label: "年会費", desc: "年単位でお支払い" },
    hasMonthlyFee && { value: "monthly", label: "月謝", desc: "月単位でお支払い" },
    hasPointCard && { value: "point_card", label: "回数券", desc: `${pointCardCount}回券` },
  ].filter(Boolean) as { value: string; label: string; desc: string }[]

  const defaultType = options[0]?.value ?? "monthly"

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invite" value={inviteCode} />

      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {/* 会員種別 */}
      {options.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[#1a2332]">会員種別を選択</p>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <label
                key={opt.value}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-[#dce3ea] px-4 py-3 text-sm transition-colors has-[:checked]:border-[#005F8C] has-[:checked]:bg-[#e8f2f8]"
              >
                <input
                  type="radio"
                  name="membership_type"
                  value={opt.value}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <span className="font-semibold text-[#1a2332]">{opt.label}</span>
                <span className="text-xs text-[#5c6a7a]">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 選択肢がない場合のデフォルト */}
      {options.length === 0 && (
        <input type="hidden" name="membership_type" value={defaultType} />
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-full bg-[#005F8C] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73] disabled:opacity-60"
        style={{ minHeight: "48px" }}
      >
        {isPending ? "参加処理中..." : `${teamName} に参加する`}
      </button>
    </form>
  )
}
