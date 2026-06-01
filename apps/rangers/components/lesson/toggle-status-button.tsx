"use client"

import { useState } from "react"
import { toggleLessonStatus } from "@/actions/lessons"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/toast"

interface ToggleStatusButtonProps {
  lessonId: string
  currentStatus: string
}

export function ToggleStatusButton({ lessonId, currentStatus }: ToggleStatusButtonProps) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  async function handleToggle() {
    setLoading(true)
    const result = await toggleLessonStatus(lessonId, status)
    if (result?.error) {
      showToast(result.error, "error")
    } else if (result?.success && result.newStatus) {
      setStatus(result.newStatus)
    }
    setLoading(false)
  }

  const isPublished = status === "published"

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={isPublished ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={loading}
      >
        {loading ? "変更中..." : isPublished ? "下書きに戻す" : "公開する"}
      </Button>
    </div>
  )
}
