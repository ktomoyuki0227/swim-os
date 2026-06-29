"use client"

import { useState } from "react"
import { recordPriceView } from "@/actions/sessions"

interface PriceRevealProps {
  sessionId: string
  memberPrice: number
  guestPrice: number
}

export function PriceReveal({ sessionId, memberPrice, guestPrice }: PriceRevealProps) {
  const [revealed, setRevealed] = useState(false)

  const handleReveal = async () => {
    await recordPriceView(sessionId)
    setRevealed(true)
  }

  if (revealed) {
    return (
      <>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-[#5c6a7a]">参加費（メンバー）</span>
          <span className="text-sm font-bold text-[#005F8C]">
            ¥{memberPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-[#5c6a7a]">参加費（ゲスト）</span>
          <span className="text-sm font-bold text-[#005F8C]">
            ¥{guestPrice.toLocaleString()}
          </span>
        </div>
      </>
    )
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#5c6a7a]">参加費</span>
        <button
          onClick={handleReveal}
          className="rounded-lg bg-[#005F8C]/10 px-3 py-1.5 text-xs font-medium text-[#005F8C] transition-colors hover:bg-[#005F8C]/20"
        >
          料金を確認する
        </button>
      </div>
      <p className="mt-1 text-xs text-[#8d99a8]">
        料金情報の閲覧はグループ管理者に共有されます
      </p>
    </div>
  )
}
