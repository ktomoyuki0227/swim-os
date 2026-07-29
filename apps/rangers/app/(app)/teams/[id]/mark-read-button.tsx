"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { markAnnouncementRead } from "@/actions/announcements"
import { useToast } from "@/components/toast"

export function MarkReadButton({ announcementId, onRead }: { announcementId: string; onRead?: () => void }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    const result = await markAnnouncementRead(announcementId)
    if (result.error) {
      showToast(result.error, "error")
    } else {
      onRead?.()
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="shrink-0 text-xs text-[#005F8C] hover:underline"
    >
      {isLoading ? "..." : "既読"}
    </button>
  )
}
