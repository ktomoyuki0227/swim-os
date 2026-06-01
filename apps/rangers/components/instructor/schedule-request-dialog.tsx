"use client"

import { useState, useTransition } from "react"
import { CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sendScheduleRequest } from "@/actions/messages"
import { useToast } from "@/components/toast"

interface ScheduleRequestDialogProps {
  instructorId: string
  instructorName: string
  lessonId?: string
}

export function ScheduleRequestDialog({
  instructorId,
  instructorName,
  lessonId,
}: ScheduleRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [dates, setDates] = useState(["", "", ""])
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.append("instructor_id", instructorId)
    if (lessonId) fd.append("lesson_id", lessonId)
    fd.append("message", message)
    dates.filter(Boolean).forEach((d) => fd.append("preferred_dates", d))

    startTransition(async () => {
      const res = await sendScheduleRequest(fd)
      if (res.error) {
        showToast(res.error, "error")
      } else if (res.success) {
        showToast("リクエストを送信しました！", "success")
        setOpen(false)
        setMessage("")
        setDates(["", "", ""])
      }
    })
  }

  return (
    <>
      <Button
        size="sm"
        className="w-full gap-1.5 bg-blue-500 hover:bg-blue-600 sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <CalendarDays className="h-4 w-4" />
        日程をリクエスト
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold">日程リクエスト</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              {instructorName} コーチに希望日時を伝えましょう
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  希望日程（最大3つ）
                </label>
                <div className="space-y-2">
                  {dates.map((d, i) => (
                    <input
                      key={i}
                      type="datetime-local"
                      value={d}
                      onChange={(e) => {
                        const next = [...dates]
                        next[i] = e.target.value
                        setDates(next)
                      }}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="sr-message">
                  メッセージ <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="sr-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="目標や現在のレベル、希望の練習内容などを教えてください"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  disabled={isPending || !message.trim()}
                >
                  {isPending ? "送信中..." : "送信する"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
