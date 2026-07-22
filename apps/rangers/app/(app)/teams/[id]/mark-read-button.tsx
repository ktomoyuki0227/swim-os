"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { markAnnouncementRead } from "@/actions/announcements"

export function MarkReadButton({ announcementId, onRead }: { announcementId: string; onRead?: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    await markAnnouncementRead(announcementId)
    onRead?.()
    router.refresh()
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
