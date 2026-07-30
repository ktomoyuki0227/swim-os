"use client"

import { useState } from "react"
import { recordPriceView } from "@/actions/sessions"

interface PriceRevealProps {
  sessionId: string
}

export function PriceReveal({ sessionId }: PriceRevealProps) {
  const [prices, setPrices] = useState<{ memberPrice: number; guestPrice: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleReveal = async () => {
    setIsLoading(true)
    const result = await recordPriceView(sessionId)
    setIsLoading(false)
    if (result.error || !result.data) {
      setError(result.error || "料金の取得に失敗しました")
      return
    }
    setPrices({ memberPrice: result.data.memberPrice || 0, guestPrice: result.data.guestPrice || 0 })
  }

  if (prices) {
    return (
      <>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-[#475569]">参加費（メンバー）</span>
          <span className="text-sm font-bold text-[#005F8C]">
            ¥{prices.memberPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-[#475569]">参加費（ゲスト）</span>
          <span className="text-sm font-bold text-[#005F8C]">
            ¥{prices.guestPrice.toLocaleString()}
          </span>
        </div>
      </>
    )
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#475569]">参加費</span>
        <button
          onClick={handleReveal}
          disabled={isLoading}
          className="rounded-lg bg-[#005F8C]/10 px-3 py-1.5 text-xs font-medium text-[#005F8C] transition-colors hover:bg-[#005F8C]/20 disabled:opacity-50"
        >
          {isLoading ? "確認中..." : "料金を確認する"}
        </button>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-[#c0392b]">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-[#64748b]">
          料金情報の閲覧はグループ管理者に共有されます
        </p>
      )}
    </div>
  )
}
