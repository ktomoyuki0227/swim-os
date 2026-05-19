"use client"

import { useRef, useState, useTransition } from "react"
import { Send } from "lucide-react"
import { sendMessage } from "@/actions/messages"

interface MessageInputProps {
  receiverId: string
}

export function MessageInput({ receiverId }: MessageInputProps) {
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)

    const fd = new FormData()
    fd.append("receiver_id", receiverId)
    fd.append("content", content.trim())

    startTransition(async () => {
      const res = await sendMessage(fd)
      if (res.error) {
        setError(res.error)
      } else {
        setContent("")
        textareaRef.current?.focus()
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="メッセージを入力... (Enterで送信)"
        rows={1}
        className="flex-1 resize-none rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
        style={{ minHeight: "44px", maxHeight: "120px" }}
      />
      <button
        type="submit"
        disabled={isPending || !content.trim()}
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
        aria-label="送信"
      >
        <Send className="h-4 w-4" />
      </button>
      {error && (
        <p className="absolute bottom-16 left-4 text-xs text-destructive">{error}</p>
      )}
    </form>
  )
}
