"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"

export function PaymentSetupStep({ teamId, typeLabel }: { teamId: string; typeLabel: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleSetup = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      })
      if (!res.ok) throw new Error("failed")
      const { url } = await res.json()
      window.location.href = url
    } catch {
      showToast("決済設定の開始に失敗しました", "error")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 完了メッセージ */}
      <div className="flex items-center gap-3 rounded-[14px] bg-[#eaf7f0] px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f8a4f]/10">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f8a4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1a2332]">{typeLabel}が作成されました！</p>
          <p className="text-xs text-[#475569]">あと1ステップで完了です</p>
        </div>
      </div>

      {/* 口座登録カード */}
      <div className="rounded-[14px] border border-[#dce3ea] p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#005F8C]/10 text-lg">🏦</span>
          <div>
            <p className="text-sm font-semibold text-[#1a2332]">口座情報の登録</p>
            <p className="mt-1 text-xs leading-relaxed text-[#475569]">
              メンバーからの支払いを受け取るために、振込先の口座情報を登録してください。
              Stripeの安全な画面で本人確認と銀行口座の登録を行います。
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSetup}
          disabled={isLoading}
          className="w-full rounded-full bg-[#005F8C] hover:bg-[#004E73]"
          style={{ minHeight: 48 }}
        >
          {isLoading ? "移動中..." : "口座情報を登録する"}
        </Button>

        <div className="space-y-1.5 rounded-[10px] bg-[#f2f7fa] p-3">
          <p className="text-xs font-medium text-[#1a2332]">登録に必要なもの</p>
          <ul className="space-y-1 text-xs text-[#475569]">
            <li className="flex items-center gap-1.5">
              <span className="text-[#005F8C]">•</span>本人確認書類（運転免許証 or パスポート）
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#005F8C]">•</span>銀行口座情報（銀行名・支店・口座番号）
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
