"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addStampPurchase } from "@/actions/stamps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/toast"

interface StampPurchaseDialogProps {
  teamId: string
  swimmerId: string
  swimmerName: string
  defaultStampCount: number
}

const MAX_CARD_COUNT = 100
const MAX_STAMP_COUNT = 999
const MAX_AMOUNT = 1_000_000

export function StampPurchaseDialog({ teamId, swimmerId, swimmerName, defaultStampCount }: StampPurchaseDialogProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cardCountInput, setCardCountInput] = useState("1")
  const [stampCountInput, setStampCountInput] = useState(String(defaultStampCount))
  const [amountInput, setAmountInput] = useState("")
  const [note, setNote] = useState("")

  const resetForm = () => {
    setCardCountInput("1")
    setStampCountInput(String(defaultStampCount))
    setAmountInput("")
    setNote("")
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) resetForm()
  }

  const handleSubmit = async () => {
    const cardCount = parseInt(cardCountInput, 10)
    const stampCount = parseInt(stampCountInput, 10)
    const amount = parseInt(amountInput, 10)

    if (!Number.isInteger(cardCount) || cardCount <= 0 || cardCount > MAX_CARD_COUNT) {
      showToast(`枚数は1〜${MAX_CARD_COUNT}の範囲で入力してください`, "error")
      return
    }
    if (!Number.isInteger(stampCount) || stampCount <= 0 || stampCount > MAX_STAMP_COUNT) {
      showToast(`1枚あたりの回数は1〜${MAX_STAMP_COUNT}の範囲で入力してください`, "error")
      return
    }
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_AMOUNT) {
      showToast(`金額は0〜${MAX_AMOUNT.toLocaleString()}円の範囲で入力してください`, "error")
      return
    }

    setIsSaving(true)
    const result = await addStampPurchase(teamId, swimmerId, cardCount, stampCount, amount, note || undefined)
    setIsSaving(false)

    if (result.error) {
      showToast(result.error, "error")
      return
    }

    showToast("購入記録を追加しました", "success")
    setIsOpen(false)
    resetForm()
    router.refresh()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="rounded-full border-[#005F8C] text-[#005F8C] shrink-0"
        style={{ minHeight: "36px" }}
      >
        購入記録を追加
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{swimmerName} の回数券購入を記録</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="stamp-card-count">枚数</Label>
            <Input
              id="stamp-card-count"
              type="number"
              min={1}
              max={MAX_CARD_COUNT}
              value={cardCountInput}
              onChange={(e) => setCardCountInput(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stamp-stamp-count">1枚あたりの回数</Label>
            <Input
              id="stamp-stamp-count"
              type="number"
              min={1}
              max={MAX_STAMP_COUNT}
              value={stampCountInput}
              onChange={(e) => setStampCountInput(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stamp-amount">金額（円）</Label>
            <Input
              id="stamp-amount"
              type="number"
              min={0}
              max={MAX_AMOUNT}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="例: 8000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stamp-note">メモ（任意）</Label>
            <Textarea
              id="stamp-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="現金払い、など"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !amountInput}
            className="bg-[#005F8C] text-white hover:bg-[#004E73]"
            style={{ minHeight: "44px" }}
          >
            {isSaving ? "保存中..." : "記録する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
