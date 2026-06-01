"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cancelRegistration } from "@/actions/sessions"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"

interface CancelButtonProps {
  sessionId: string
}

export function CancelButton({ sessionId }: CancelButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleCancel = async () => {
    if (!confirm("参加をキャンセルしますか？")) return
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
        onClick={handleCancel}
        disabled={isLoading}
        variant="outline"
        className="w-full rounded-full border-[#E8614D] text-[#E8614D] hover:bg-[#E8614D]/5"
        style={{ minHeight: "44px" }}
      >
        {isLoading ? "キャンセル中..." : "参加をキャンセル"}
      </Button>
    </div>
  )
}
