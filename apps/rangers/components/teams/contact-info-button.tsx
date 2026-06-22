"use client"

import { useState, useEffect, useCallback } from "react"

interface ContactInfoButtonProps {
  teamId: string
  contactEmail: string | null
  contactPhone: string | null
  isLoggedIn: boolean
}

export function ContactInfoButton({ teamId, contactEmail, contactPhone, isLoggedIn }: ContactInfoButtonProps) {
  const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, handleClose])

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?next=/teams/${teamId}`}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce3ea] bg-white text-[#005F8C] shadow-sm transition-colors hover:border-[#005F8C] hover:bg-[#e8f2f8]"
        aria-label="問い合わせ先を確認する"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </a>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce3ea] bg-white text-[#005F8C] shadow-sm transition-colors hover:border-[#005F8C] hover:bg-[#e8f2f8]"
        aria-label="問い合わせ先を確認する"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
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
            aria-labelledby="contact-modal-title"
          >
            <h3 id="contact-modal-title" className="mb-4 text-base font-bold text-[#1a2332]">
              お問い合わせ先
            </h3>

            <div className="space-y-3">
              {contactEmail && (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2f8] text-[#005F8C]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-sm text-[#005F8C] underline underline-offset-2"
                  >
                    {contactEmail}
                  </a>
                </div>
              )}

              {contactPhone && (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2f8] text-[#005F8C]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-sm text-[#005F8C] underline underline-offset-2"
                  >
                    {contactPhone}
                  </a>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-[#8d99a8]">
              こちらの連絡先までお気軽にご連絡ください。
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-5 w-full rounded-full border border-[#dce3ea] py-2.5 text-sm text-[#5c6a7a] hover:border-[#8d99a8]"
              style={{ minHeight: "44px" }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  )
}
