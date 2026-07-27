"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { bulkCreateFees } from "@/actions/fees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/toast"

interface FeeActionsProps {
  teamId: string
  type: "annual" | "monthly"
  period: string
  hasFees: boolean
}

const MAX_FEE_AMOUNT = 1_000_000

export function FeeActions({ teamId, type, period, hasFees }: FeeActionsProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [amountInput, setAmountInput] = useState("")
  const { showToast } = useToast()

  const handleBulkCreate = async () => {
    const amount = parseInt(amountInput, 10)
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_FEE_AMOUNT) {
      showToast(`0〜${MAX_FEE_AMOUNT.toLocaleString()}円の範囲で入力してください`, "error")
      return
    }

    setIsCreating(true)
    const result = await bulkCreateFees(teamId, type, period, amount)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast("会費レコードを一括生成しました", "success")
      setIsOpen(false)
      setAmountInput("")
      setTimeout(() => router.refresh(), 1500)
    }
    setIsCreating(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="rounded-full border-[#005F8C] text-[#005F8C]"
          style={{ minHeight: "44px" }}
        >
          {hasFees ? "再生成" : "一括生成"}
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{type === "annual" ? "年会費" : "月謝"}の一括生成</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-fee-amount">金額（円）</Label>
            <Input
              id="bulk-fee-amount"
              type="number"
              min={0}
              max={MAX_FEE_AMOUNT}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="例: 5000"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleBulkCreate}
              disabled={isCreating || !amountInput}
              className="bg-[#005F8C] text-white hover:bg-[#004E73]"
              style={{ minHeight: "44px" }}
            >
              {isCreating ? "生成中..." : "生成する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
