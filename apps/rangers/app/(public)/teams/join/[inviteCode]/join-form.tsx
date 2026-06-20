"use client"

import { useActionState } from "react"
import { joinTeamAction } from "@/actions/teams"

interface JoinFormProps {
  inviteCode: string
  teamName: string
  pointCardCount: number
}

const initialState = { error: null }

export function JoinForm({ inviteCode, teamName, pointCardCount }: JoinFormProps) {
  const [state, formAction, isPending] = useActionState(joinTeamAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invite" value={inviteCode} />

      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      {/* 会員種別 */}
      <div>
        <p className="mb-2 text-sm font-medium text-[#1a2332]">会員種別を選択</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-[#dce3ea] px-4 py-3 text-sm transition-colors has-[:checked]:border-[#005F8C] has-[:checked]:bg-[#e8f2f8]">
            <input type="radio" name="membership_type" value="regular" defaultChecked className="sr-only" />
            <span className="font-semibold text-[#1a2332]">レギュラー</span>
            <span className="text-xs text-[#5c6a7a]">月謝・年会費制</span>
          </label>
          {pointCardCount > 0 ? (
            <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-[#dce3ea] px-4 py-3 text-sm transition-colors has-[:checked]:border-[#005F8C] has-[:checked]:bg-[#e8f2f8]">
              <input type="radio" name="membership_type" value="point_card" className="sr-only" />
              <span className="font-semibold text-[#1a2332]">ポイントカード</span>
              <span className="text-xs text-[#5c6a7a]">{pointCardCount}回券</span>
            </label>
          ) : (
            <div className="flex cursor-not-allowed flex-col items-center gap-1 rounded-xl border-2 border-[#dce3ea] bg-[#f8f9fa] px-4 py-3 text-sm opacity-40">
              <span className="font-semibold text-[#1a2332]">ポイントカード</span>
              <span className="text-xs text-[#5c6a7a]">このグループでは未対応</span>
            </div>
          )}
        </div>
      </div>

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
