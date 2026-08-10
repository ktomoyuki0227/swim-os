"use client"

import { useState } from "react"
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
  hasAnnualFee: boolean
  hasMonthlyFee: boolean
  defaultYear: number
  onChanged: () => void
}

const MAX_FEE_AMOUNT = 1_000_000

/**
 * 会費レコードの一括生成。以前は年会費/月謝タブごとに種別・期間が固定されていたが、
 * マトリクス統合後はタブが無くなったため、種別・期間をダイアログ内で選ぶ形に変更した。
 */
export function FeeActions({ teamId, hasAnnualFee, hasMonthlyFee, defaultYear, onChanged }: FeeActionsProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<"annual" | "monthly">(hasAnnualFee ? "annual" : "monthly")
  const [year, setYear] = useState(String(defaultYear))
  // 入力中に毎キー操作でpadStartすると <input type="number"> は先頭の0を
  // 表示上ドロップしてしまい、2桁の月(例: 12)が入力しづらくなる。
  // パディングは送信直前(period組み立て時)にのみ行う
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [amountInput, setAmountInput] = useState("")
  const { showToast } = useToast()

  const typeOptions = [
    hasAnnualFee ? { value: "annual" as const, label: "年会費" } : null,
    hasMonthlyFee ? { value: "monthly" as const, label: "月謝" } : null,
  ].filter(Boolean) as { value: "annual" | "monthly"; label: string }[]

  if (typeOptions.length === 0) return null

  const monthNumber = parseInt(month, 10)
  const period = type === "annual" ? year : `${year}-${String(monthNumber).padStart(2, "0")}`

  const handleBulkCreate = async () => {
    const amount = parseInt(amountInput, 10)
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_FEE_AMOUNT) {
      showToast(`0〜${MAX_FEE_AMOUNT.toLocaleString()}円の範囲で入力してください`, "error")
      return
    }
    if (!/^\d{4}$/.test(year)) {
      showToast("年度を4桁の数字で入力してください", "error")
      return
    }
    if (type === "monthly" && (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12)) {
      showToast("月は1〜12の範囲で入力してください", "error")
      return
    }

    setIsCreating(true)
    const result = await bulkCreateFees(teamId, type, period, amount)
    setIsCreating(false)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      showToast("会費レコードを一括生成しました", "success")
      setIsOpen(false)
      setAmountInput("")
      onChanged()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="rounded-full border-[#005F8C] text-[#005F8C]"
        style={{ minHeight: "40px" }}
      >
        会費を一括生成
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>会費レコードの一括生成</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>種別</Label>
            <div className="flex gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    type === opt.value
                      ? "border-[#005F8C] bg-[#e8f2f8] text-[#005F8C]"
                      : "border-[#dce3ea] text-[#475569]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bulk-fee-year">{type === "annual" ? "年度" : "年月"}</Label>
            <div className="flex gap-2">
              <Input
                id="bulk-fee-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="例: 2026"
                className="flex-1"
              />
              {type === "monthly" && (
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="月"
                  className="w-20"
                />
              )}
            </div>
          </div>
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
            />
          </div>
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
  )
}
