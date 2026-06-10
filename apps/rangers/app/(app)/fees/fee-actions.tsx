"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { bulkCreateFees } from "@/actions/fees"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"

interface FeeActionsProps {
  teamId: string
  type: "annual" | "monthly"
  period: string
  hasFees: boolean
}

export function FeeActions({ teamId, type, period, hasFees }: FeeActionsProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const { showToast } = useToast()

  const handleBulkCreate = async () => {
    const amountStr = prompt(
      `${type === "annual" ? "年会費" : "月謝"}の金額を入力してください（円）:`
    )
    if (!amountStr) return
    const amount = parseInt(amountStr)
    if (isNaN(amount) || amount < 0) {
      showToast("有効な金額を入力してください", "error")
      return
    }

    setIsCreating(true)
    const result = await bulkCreateFees(teamId, type, period, amount)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast("会費レコードを一括生成しました", "success")
      setTimeout(() => router.refresh(), 1500)
    }
    setIsCreating(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleBulkCreate}
        disabled={isCreating}
        className="rounded-full border-[#005F8C] text-[#005F8C]"
        style={{ minHeight: "44px" }}
      >
        {isCreating ? "生成中..." : hasFees ? "再生成" : "一括生成"}
      </Button>
    </div>
  )
}
