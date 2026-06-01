"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { markAllAsRead } from "@/actions/notifications"
import { Button } from "@/components/ui/button"

export function MarkAllReadButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    await markAllAsRead()
    router.refresh()
    setIsLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="rounded-full border-[#005F8C] text-[#005F8C]"
      style={{ minHeight: "44px" }}
    >
      {isLoading ? "..." : "すべて既読"}
    </Button>
  )
}
