"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { QRCodeSVG } from "qrcode.react"
import { useMounted } from "@/hooks/use-mounted"
import { useScrollLock } from "@/hooks/use-scroll-lock"
import { useEscapeToClose } from "@/hooks/use-escape-to-close"

interface InviteButtonProps {
  inviteCode: string
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function InviteButton({ inviteCode }: InviteButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const mounted = useMounted()

  useEscapeToClose(open, () => setOpen(false))
  useScrollLock(open)

  const inviteUrl = mounted ? `${window.location.origin}/teams/join/${inviteCode}` : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 2000)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1 rounded-full border border-[#005F8C] bg-white px-2.5 text-xs font-medium text-[#005F8C] transition-colors hover:bg-[#e8f2f8]"
        style={{ minHeight: "44px" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        招待
      </button>

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ minHeight: "100dvh" }}>
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="relative z-[400] w-full max-w-sm rounded-[14px] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1a2332]">グループに招待</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#475569] transition-colors hover:bg-[#f2f7fa]"
                aria-label="閉じる"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="rounded-[14px] border border-[#dce3ea] bg-white p-6">
                <QRCodeSVG value={inviteUrl} size={168} />
              </div>

              <div className="w-full space-y-2">
                <p className="break-all rounded-[10px] border border-[#dce3ea] bg-[#f2f7fa] px-3 py-2 text-xs text-[#475569]">
                  {inviteUrl}
                </p>
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center justify-center rounded-full bg-[#005F8C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#004E73]"
                  style={{ minHeight: "48px" }}
                >
                  {copied ? "コピーしました" : copyFailed ? "コピーに失敗しました" : "招待URLをコピー"}
                </button>
                <p className="text-xs text-[#64748b]">
                  ※このURL・QRコードを知っている人は、承認なしで即座にグループに参加できます
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
