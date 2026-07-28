"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cancelRegistration } from "@/actions/sessions"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/toast"

interface CancelButtonProps {
  sessionId: string
}

export function CancelButton({ sessionId }: CancelButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { showToast } = useToast()

  const handleCancel = async () => {
    setShowConfirm(false)
    setIsLoading(true)
    const result = await cancelRegistration(sessionId)
    if (result.error) {
      showToast(result.error, "error")
      setIsLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
        variant="outline"
        className="w-full rounded-full border-[#c0392b] text-[#c0392b] hover:bg-[#c0392b]/5"
        style={{ minHeight: "44px" }}
      >
        {isLoading ? "キャンセル中..." : "参加をキャンセル"}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        title="参加をキャンセルしますか？"
        confirmLabel="キャンセルする"
        cancelLabel="戻る"
        isLoading={isLoading}
        loadingLabel="キャンセル中..."
        onConfirm={handleCancel}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
