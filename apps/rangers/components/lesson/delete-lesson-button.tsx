"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteLesson } from "@/actions/lessons"
import { Button } from "@/components/ui/button"

interface DeleteLessonButtonProps {
  lessonId: string
}

export function DeleteLessonButton({ lessonId }: DeleteLessonButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const result = await deleteLesson(lessonId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      setConfirming(false)
      return
    }
    router.push("/instructor/lessons")
  }

  if (!confirming) {
    return (
      <div>
        {error && (
          <p className="mb-2 text-sm text-destructive">{error}</p>
        )}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => { setError(null); setConfirming(true) }}
        >
          レッスンを削除
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-destructive">
        本当に削除しますか？この操作は取り消せません。
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setConfirming(false)}
        >
          キャンセル
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "削除中..." : "削除する"}
        </Button>
      </div>
    </div>
  )
}
