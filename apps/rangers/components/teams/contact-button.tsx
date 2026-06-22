"use client"

import { useState, useTransition, useEffect } from "react"
import { sendInquiry } from "@/actions/inquiries"

interface ContactButtonProps {
  teamId: string
  isLoggedIn: boolean
}

export function ContactButton({ teamId, isLoggedIn }: ContactButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleClose = () => {
    setOpen(false)
    setMessage("")
    setError(null)
  }

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const result = await sendInquiry(teamId, message)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setMessage("")
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 2000)
      }
    })
  }

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?next=/teams/${teamId}`}
        className="flex w-full items-center justify-center rounded-full border border-[#005F8C] bg-white py-3 text-sm font-medium text-[#005F8C] transition-colors hover:bg-[#e8f2f8]"
        style={{ minHeight: "44px" }}
      >
        問い合わせる
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center rounded-full border border-[#005F8C] bg-white py-3 text-sm font-medium text-[#005F8C] transition-colors hover:bg-[#e8f2f8]"
        style={{ minHeight: "44px" }}
      >
        問い合わせる
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-modal-title"
          >
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf7f0]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0f8a4f"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#1a2332]">
                  お問い合わせを送信しました
                </p>
                <p className="text-xs text-[#5c6a7a]">
                  グループの管理者が確認次第、ご連絡いたします。
                </p>
              </div>
            ) : (
              <>
                <h3 id="inquiry-modal-title" className="mb-1 text-base font-bold text-[#1a2332]">
                  グループへのお問い合わせ
                </h3>
                <p className="mb-4 text-xs text-[#8d99a8]">
                  参加条件や練習内容など、気になることをご記入ください。
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="例：週に何回練習がありますか？初心者でも参加できますか？"
                  className="w-full rounded-lg border border-[#dce3ea] px-3 py-2.5 text-sm text-[#1a2332] placeholder-[#8d99a8] focus:outline-none focus:ring-2 focus:ring-[#005F8C]/40"
                  rows={5}
                  maxLength={1000}
                />
                <p className="mt-1 text-right text-xs text-[#8d99a8]">
                  {message.length}/1000
                </p>
                {error && (
                  <p className="mt-2 text-xs text-red-600">{error}</p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-full border border-[#dce3ea] py-2.5 text-sm text-[#5c6a7a] hover:border-[#8d99a8]"
                    style={{ minHeight: "44px" }}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || !message.trim()}
                    className="flex-1 rounded-full bg-[#005F8C] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#004a6b] disabled:opacity-40"
                    style={{ minHeight: "44px" }}
                  >
                    {isPending ? "送信中..." : "送信する"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
