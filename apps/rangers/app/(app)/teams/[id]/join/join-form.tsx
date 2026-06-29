"use client"

import { useActionState } from "react"
import { requestJoinTeamAction } from "@/actions/join-requests"

interface JoinFormProps {
  teamId: string
  teamName: string
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  hasPointCard: boolean
  annualFeeAmount: number | null
  monthlyFeeAmount: number | null
  pointCardCount: number
  pointCardPrice: number | null
}

const initialState = { error: null, success: false }

function formatPrice(amount: number) {
  return `¥${amount.toLocaleString()}`
}

export function JoinForm({
  teamId,
  teamName,
  hasAnnualFee,
  hasMonthlyFee,
  hasPointCard,
  annualFeeAmount,
  monthlyFeeAmount,
  pointCardCount,
  pointCardPrice,
}: JoinFormProps) {
  const [state, formAction, isPending] = useActionState(requestJoinTeamAction, initialState)

  const options = [
    hasAnnualFee && {
      value: "annual",
      label: "年会費",
      desc: annualFeeAmount ? `${formatPrice(annualFeeAmount)}/年` : "年単位でお支払い",
    },
    hasMonthlyFee && {
      value: "monthly",
      label: "月謝",
      desc: monthlyFeeAmount ? `${formatPrice(monthlyFeeAmount)}/月` : "月単位でお支払い",
    },
    hasPointCard && {
      value: "point_card",
      label: "回数券",
      desc:
        pointCardPrice && pointCardCount
          ? `${formatPrice(pointCardPrice)}（${pointCardCount}回分）`
          : pointCardCount
          ? `${pointCardCount}回分`
          : "回数券",
    },
  ].filter(Boolean) as { value: string; label: string; desc: string }[]

  if (state.success) {
    return (
      <div className="rounded-2xl border border-[#0f8a4f] bg-[#eaf7f0] p-6 text-center">
        <div className="mb-3 text-4xl">🎉</div>
        <p className="font-semibold text-[#0f8a4f]">参加申請を送信しました</p>
        <p className="mt-2 text-sm text-[#5c6a7a]">
          管理者が申請を確認次第、通知でお知らせします。
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="team_id" value={teamId} />

      {state.error && (
        <p className="rounded-lg border border-[#c0392b]/20 bg-[#fdecea] px-3 py-2 text-sm text-[#c0392b]">
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

      {/* 会員種別がない場合のデフォルト（参加費のみのグループ） */}
      {options.length === 0 && (
        <input type="hidden" name="membership_type" value="monthly" />
      )}

      {/* 申請の注意書き */}
      <div className="rounded-xl bg-[#f2f7fa] px-4 py-3 text-xs text-[#5c6a7a]">
        参加申請後、管理者の承認をもって正式にグループへ参加となります。
        承認・不承認の結果はアプリ内の通知でお知らせします。
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-full bg-[#005F8C] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73] disabled:opacity-60"
        style={{ minHeight: "48px" }}
      >
        {isPending ? "申請中..." : `${teamName} に参加申請する`}
      </button>
    </form>
  )
}
