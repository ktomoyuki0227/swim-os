"use client"

import { useState } from "react"
import { useToast } from "@/components/toast"

interface StripeSetupBannerProps {
  teamId: string
  hasStripeAccount: boolean
  onboardingCompleted: boolean
}

export function StripeSetupBanner({ teamId, hasStripeAccount, onboardingCompleted }: StripeSetupBannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  if (onboardingCompleted) return null

  const handleSetup = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      })
      if (!res.ok) throw new Error("onboarding request failed")
      const { url } = await res.json()
      window.location.href = url
    } catch {
      showToast("決済設定の開始に失敗しました", "error")
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-[14px] border border-[#d97706]/30 bg-[#fef3c7] px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d97706]/10 text-base">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1a2332]">決済の受取設定が未完了です</p>
          <p className="mt-0.5 text-xs text-[#475569]">
            {hasStripeAccount
              ? "Stripe の設定が途中で止まっています。設定を完了すると、メンバーからの支払いが口座に振り込まれるようになります。"
              : "料金を徴収するには、売上の振込先となる口座情報の登録が必要です。"}
          </p>
          <button
            type="button"
            onClick={handleSetup}
            disabled={isLoading}
            className="mt-2 inline-flex items-center rounded-full bg-[#005F8C] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#004E73] disabled:opacity-50"
            style={{ minHeight: 36 }}
          >
            {isLoading ? "移動中..." : hasStripeAccount ? "設定を続ける" : "口座情報を登録する"}
          </button>
        </div>
      </div>
    </div>
  )
}
